import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSettingsStore } from '@/stores/settingsStore';
import { useToastStore } from '@/stores/toastStore';
import { processSyncQueue } from '@/lib/sync';
import { isSupabaseConfigured } from '@/lib/supabase';

export function useSync() {
  const database = useSQLiteContext();
  const syncStatus = useSettingsStore((s) => s.syncStatus);
  const setSyncStatus = useSettingsStore((s) => s.setSyncStatus);
  const setLastSyncAt = useSettingsStore((s) => s.setLastSyncAt);
  const addToast = useToastStore((s) => s.addToast);
  const isSyncing = useRef(false);

  const sync = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSyncStatus('offline');
      return;
    }

    if (isSyncing.current) return;
    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      const result = await processSyncQueue(database);

      if (result.conflicts > 0) {
        addToast('warning', `${result.conflicts} sync conflict(s) detected`);
      }
      if (result.failed > 0) {
        addToast('error', `${result.failed} item(s) failed to sync`);
      }

      setSyncStatus('idle');
      setLastSyncAt(new Date().toISOString());
    } catch {
      setSyncStatus('error');
      addToast('error', 'Sync failed. Will retry automatically.');
    } finally {
      isSyncing.current = false;
    }
  }, [database]);

  // Auto-sync on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void sync();
      }
    });

    return () => subscription.remove();
  }, [sync]);

  return { syncStatus, sync };
}
