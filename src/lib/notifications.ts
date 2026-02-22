let Notifications: any = null;
// Disabled in Expo Go - enable in development builds
// try { Notifications = require('expo-notifications'); } catch {}
import type { Habit } from '@/types';

if (Notifications) { Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
}); }

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleHabitReminder(habit: Habit): Promise<string | null> {
  if (!habit.reminder_enabled || !habit.reminder_time) return null;

  const [hours, minutes] = habit.reminder_time.split(':').map(Number);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${habit.icon} ${habit.name}`,
      body: 'Time to complete your habit!',
      data: { habitId: habit.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });

  return id;
}

export async function cancelHabitReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
