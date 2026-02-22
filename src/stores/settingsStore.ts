import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode, SyncStatus } from '@/types';

interface SettingsState {
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;

  setThemeMode: (mode: ThemeMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncAt: (date: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      notificationsEnabled: true,
      syncStatus: 'idle',
      lastSyncAt: null,

      setThemeMode: (themeMode) => set({ themeMode }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);
