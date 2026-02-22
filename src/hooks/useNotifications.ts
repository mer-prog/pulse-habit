import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  requestNotificationPermissions,
  scheduleHabitReminder,
  cancelAllReminders,
} from '@/lib/notifications';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHabitStore } from '@/stores/habitStore';
import type { Habit } from '@/types';

export function useNotifications() {
  const router = useRouter();
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const habits = useHabitStore((s) => s.habits);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Listen for notification taps
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const habitId = response.notification.request.content.data?.habitId;
        if (habitId && typeof habitId === 'string') {
          router.push(`/habit/${habitId}`);
        }
      });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, [router]);

  const requestPermissions = useCallback(async () => {
    return requestNotificationPermissions();
  }, []);

  const scheduleAllReminders = useCallback(async () => {
    if (!notificationsEnabled) return;

    await cancelAllReminders();

    const activeHabits = habits.filter(
      (h) => !h.is_archived && h.reminder_enabled && h.reminder_time
    );

    for (const habit of activeHabits) {
      await scheduleHabitReminder(habit);
    }
  }, [habits, notificationsEnabled]);

  const scheduleForHabit = useCallback(
    async (habit: Habit) => {
      if (!notificationsEnabled) return null;
      return scheduleHabitReminder(habit);
    },
    [notificationsEnabled]
  );

  return {
    requestPermissions,
    scheduleAllReminders,
    scheduleForHabit,
    notificationsEnabled,
  };
}
