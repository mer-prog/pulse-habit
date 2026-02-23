import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { requestNotificationPermissions, scheduleHabitReminder, cancelAllReminders } from '@/lib/notifications';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHabitStore } from '@/stores/habitStore';
import type { Habit } from '@/types';
let Notifications: any = null;
// Disabled in Expo Go - enable in development builds
// try { Notifications = require('expo-notifications'); } catch {}
export function useNotifications() {
  const router = useRouter();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const habits = useHabitStore((s) => s.habits);
  const responseListener = useRef<any>(null);
  useEffect(() => {
    if (!Notifications) return;
    try {
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const habitId = response.notification.request.content.data?.habitId;
        if (habitId && typeof habitId === 'string') { router.push('/habit/' + habitId); }
      });
    } catch {}
    return () => {
      if (responseListener.current && Notifications) {
        try { Notifications.removeNotificationSubscription(responseListener.current); } catch {}
      }
    };
  }, [router]);
  const requestPermissions = useCallback(async () => {
    try { return await requestNotificationPermissions(); } catch { return false; }
  }, []);
  const scheduleAllReminders = useCallback(async () => {
    if (!notificationsEnabled) return;
    try {
      await cancelAllReminders();
      for (const habit of habits.filter((h: any) => !h.is_archived && h.reminder_enabled && h.reminder_time)) { await scheduleHabitReminder(habit); }
    } catch {}
  }, [habits, notificationsEnabled]);
  const scheduleForHabit = useCallback(async (habit: Habit) => {
    if (!notificationsEnabled) return null;
    try { return await scheduleHabitReminder(habit); } catch { return null; }
  }, [notificationsEnabled]);
  return { requestPermissions, scheduleAllReminders, scheduleForHabit, notificationsEnabled };
}
