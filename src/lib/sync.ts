import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SQLiteDatabase } from 'expo-sqlite';
import { supabase, isSupabaseConfigured } from './supabase';
import {
  getSyncQueue,
  incrementSyncRetry,
  removeSyncQueueItem,
  addSyncConflict,
} from './database';
import { SyncError } from './errors';
import { SYNC_BACKOFF_BASE_MS, SYNC_MAX_RETRIES } from '@/constants/config';
import type { SyncQueueItem } from '@/types';

const DEVICE_ID_KEY = 'pulse_habit_device_id';

export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function processSyncQueue(db: SQLiteDatabase): Promise<{
  processed: number;
  failed: number;
  conflicts: number;
}> {
  if (!isSupabaseConfigured()) {
    return { processed: 0, failed: 0, conflicts: 0 };
  }

  // Verify we have a valid Supabase auth session before attempting any sync
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('[Sync] No valid Supabase session yet, skipping sync');
    return { processed: 0, failed: 0, conflicts: 0 };
  }
  console.log('[Sync] Session verified, auth_uid:', session.user.id);

  const queue = await getSyncQueue(db);
  let processed = 0;
  let failed = 0;
  let conflicts = 0;

  for (const item of queue) {
    try {
      const result = await processQueueItem(db, item);
      if (result === 'success') {
        await removeSyncQueueItem(db, item.id);
        processed++;
      } else if (result === 'conflict') {
        await removeSyncQueueItem(db, item.id);
        conflicts++;
      }
    } catch (err) {
      console.warn(`[Sync] Failed to process item ${item.id}:`, err);
      await incrementSyncRetry(db, item.id);
      failed++;

      if (item.retry_count + 1 >= item.max_retries) {
        console.warn(`[Sync] Item ${item.id} reached max retries`);
      }
    }
  }

  return { processed, failed, conflicts };
}

async function processQueueItem(
  db: SQLiteDatabase,
  item: SyncQueueItem
): Promise<'success' | 'conflict'> {
  const data = JSON.parse(item.data) as Record<string, unknown>;

  // Debug: log auth state and data being synced
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`[Sync] Processing ${item.table_name} ${item.operation}`, {
    auth_uid: session?.user?.id ?? 'NO SESSION',
    data_user_id: data.user_id ?? 'N/A',
    record_id: data.id ?? data.habit_id ?? 'unknown',
    retry: item.retry_count,
  });

  // CRITICAL: Override local user_id with current Supabase auth uid
  // Local SQLite may have a different user_id (from initial signup or guest mode)
  // RLS policy requires auth.uid() = user_id, so we must align them
  if (session?.user?.id && data.user_id && data.user_id !== session.user.id) {
    console.log(`[Sync] Rewriting user_id: ${data.user_id} → ${session.user.id}`);
    data.user_id = session.user.id;
  }

  if (item.table_name === 'completions') {
    return processCompletionSync(item, data);
  }

  if (item.table_name === 'habits') {
    return processHabitSync(db, item, data);
  }

  if (item.table_name === 'streaks') {
    return processStreakSync(item, data);
  }

  throw new SyncError(`Unknown table: ${item.table_name}`);
}

async function processCompletionSync(
  item: SyncQueueItem,
  data: Record<string, unknown>
): Promise<'success'> {
  if (item.operation === 'DELETE') {
    const { error } = await supabase
      .from('completions')
      .delete()
      .eq('id', data.id);
    if (error && !error.message.includes('0 rows')) {
      throw new SyncError(`completions DELETE: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from('completions').upsert(data, {
      onConflict: 'habit_id,completed_date',
    });
    if (error) throw new SyncError(`completions UPSERT: ${error.message}`);
  }
  return 'success';
}

async function processHabitSync(
  db: SQLiteDatabase,
  item: SyncQueueItem,
  data: Record<string, unknown>
): Promise<'success' | 'conflict'> {
  if (item.operation === 'INSERT') {
    const { error } = await supabase.from('habits').insert(data);
    if (error) {
      if (error.code === '23505') {
        const { error: upsertErr } = await supabase
          .from('habits')
          .upsert(data);
        if (upsertErr) throw new SyncError(`habits INSERT fallback: ${upsertErr.message}`);
        return 'success';
      }
      throw new SyncError(`habits INSERT: ${error.message}`);
    }
    return 'success';
  }

  if (item.operation === 'DELETE') {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', data.id);
    if (error && !error.message.includes('0 rows')) {
      throw new SyncError(`habits DELETE: ${error.message}`);
    }
    return 'success';
  }

  // UPDATE — version conflict detection
  const localVersion = (data.version as number) ?? 1;
  const { data: remote, error: fetchErr } = await supabase
    .from('habits')
    .select('version')
    .eq('id', data.id)
    .single();

  if (fetchErr) {
    if (fetchErr.code === 'PGRST116') {
      const { error: insertErr } = await supabase.from('habits').insert(data);
      if (insertErr) throw new SyncError(`habits UPDATE->INSERT fallback: ${insertErr.message}`);
      return 'success';
    }
    throw new SyncError(`habits UPDATE fetch: ${fetchErr.message}`);
  }

  if (remote && remote.version > localVersion - 1) {
    const { data: remoteData } = await supabase
      .from('habits')
      .select('*')
      .eq('id', data.id)
      .single();

    if (remoteData) {
      await addSyncConflict(db, {
        id: generateUUID(),
        table_name: 'habits',
        record_id: data.id as string,
        local_data: JSON.stringify(data),
        remote_data: JSON.stringify(remoteData),
      });
    }
    return 'conflict';
  }

  const { error: updateErr } = await supabase
    .from('habits')
    .update(data)
    .eq('id', data.id);

  if (updateErr) throw new SyncError(`habits UPDATE: ${updateErr.message}`);
  return 'success';
}

async function processStreakSync(
  item: SyncQueueItem,
  data: Record<string, unknown>
): Promise<'success'> {
  if (item.operation === 'DELETE') {
    const { error } = await supabase
      .from('streaks')
      .delete()
      .eq('habit_id', data.habit_id);
    if (error && !error.message.includes('0 rows')) {
      throw new SyncError(`streaks DELETE: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from('streaks').upsert(data, {
      onConflict: 'habit_id',
    });
    if (error) throw new SyncError(`streaks UPSERT: ${error.message}`);
  }
  return 'success';
}

export function getBackoffDelay(retryCount: number): number {
  const baseDelay = SYNC_BACKOFF_BASE_MS * Math.pow(2, retryCount);
  const jitter = Math.random() * baseDelay * 0.5;
  return baseDelay + jitter;
}

function generateUUID(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
