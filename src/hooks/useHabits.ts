import { useCallback, useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import * as db from '@/lib/database';
import { hapticSuccess, hapticMedium } from '@/lib/haptics';
import type { Habit, HabitWithStreak } from '@/types';

export function useHabits() {
  const database = useSQLiteContext();
  const user = useAuthStore((s) => s.user);
  const store = useHabitStore();

  const today = useMemo(() => db.getDateString(new Date()), []);
  const userId = user?.id ?? 'local';

  const habitsWithStreaks: HabitWithStreak[] = useMemo(
    () => store.getHabitsWithStreaks(today),
    [store.habits, store.completions, store.streaks, today]
  );

  const completedCount = useMemo(
    () => habitsWithStreaks.filter((h) => h.isCompletedToday).length,
    [habitsWithStreaks]
  );

  const totalCount = habitsWithStreaks.length;

  const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

  const loadHabits = useCallback(async () => {
    store.setLoading(true);
    try {
      const habits = await db.getHabits(database, userId);
      store.setHabits(habits);

      // Load completions and streaks for each habit
      const streaksMap: Record<string, import('@/types').Streak> = {};
      for (const habit of habits) {
        const completions = await db.getCompletions(database, habit.id);
        store.setCompletions(habit.id, completions);

        const streak = await db.getStreak(database, habit.id);
        if (streak) streaksMap[habit.id] = streak;
      }
      store.setStreaks(streaksMap);
    } finally {
      store.setLoading(false);
    }
  }, [database, userId]);

  const toggleCompletion = useCallback(
    async (habitId: string) => {
      const completed = await db.toggleCompletion(database, habitId, today);
      if (completed) {
        store.addCompletion({
          id: '',
          habit_id: habitId,
          completed_date: today,
          note: null,
          photo_uri: null,
          created_at: new Date().toISOString(),
          synced_at: null,
        });
        await hapticSuccess();
      } else {
        store.removeCompletion(habitId, today);
        await hapticMedium();
      }

      const streak = await db.updateStreak(database, habitId, today);
      store.setStreak(habitId, streak);

      return completed;
    },
    [database, today]
  );

  const createHabit = useCallback(
    async (
      habitData: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'synced_at' | 'version' | 'user_id' | 'device_id'>
    ) => {
      const id = await db.createHabit(database, {
        ...habitData,
        user_id: userId,
        device_id: null,
      });
      const habit = await db.getHabitById(database, id);
      if (habit) store.addHabit(habit);
      return id;
    },
    [database, userId]
  );

  const archiveHabit = useCallback(
    async (habitId: string) => {
      await db.updateHabit(database, habitId, { is_archived: true });
      store.updateHabitInStore(habitId, { is_archived: true });
    },
    [database]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      await db.deleteHabit(database, habitId);
      store.removeHabit(habitId);
    },
    [database]
  );

  return {
    habits: habitsWithStreaks,
    isLoading: store.isLoading,
    completedCount,
    totalCount,
    completionRate,
    today,
    loadHabits,
    toggleCompletion,
    createHabit,
    archiveHabit,
    deleteHabit,
  };
}
