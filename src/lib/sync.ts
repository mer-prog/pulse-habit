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
    } catch {
      await incrementSyncRetry(db, item.id);
      failed++;

      if (item.retry_count + 1 >= item.max_retries) {
        // Dead letter — item stays in queue but won't be retried
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

  if (item.table_name === 'completions') {
    // Completions use idempotent upsert — no conflicts possible
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
    await supabase.from('completions').delete().eq('id', data.id);
  } else {
    await supabase.from('completions').upsert(data, {
      onConflict: 'habit_id,completed_date',
    });
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
    if (error) throw new SyncError(error.message);
    return 'success';
  }

  if (item.operation === 'DELETE') {
    await supabase.from('habits').delete().eq('id', data.id);
    return 'success';
  }

  // UPDATE — check version for conflict detection
  const localVersion = (data.version as number) ?? 1;
  const { data: remote } = await supabase
    .from('habits')
    .select('version')
    .eq('id', data.id)
    .single();

  if (remote && remote.version > localVersion - 1) {
    // Conflict: remote was modified by another device
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

  const { error } = await supabase
    .from('habits')
    .update(data)
    .eq('id', data.id);

  if (error) throw new SyncError(error.message);
  return 'success';
}

async function processStreakSync(
  item: SyncQueueItem,
  data: Record<string, unknown>
): Promise<'success'> {
  if (item.operation === 'DELETE') {
    await supabase.from('streaks').delete().eq('habit_id', data.habit_id);
  } else {
    await supabase.from('streaks').upsert(data, {
      onConflict: 'habit_id',
    });
  }
  return 'success';
}

export function getBackoffDelay(retryCount: number): number {
  return SYNC_BACKOFF_BASE_MS * Math.pow(2, retryCount);
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
