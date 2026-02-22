import { useMemo } from 'react';
import { useHabitStore } from '@/stores/habitStore';
import type { Streak } from '@/types';

export function useStreak(habitId: string): Streak & { formattedCurrent: string } {
  const streak = useHabitStore((s) => s.streaks[habitId]);

  const defaultStreak: Streak = {
    habit_id: habitId,
    current_streak: 0,
    longest_streak: 0,
    last_completed_date: null,
    updated_at: '',
  };

  const current = streak ?? defaultStreak;

  const formattedCurrent = useMemo(() => {
    const count = current.current_streak;
    if (count === 0) return '0 days';
    if (count === 1) return '1 day';
    return `${count} days`;
  }, [current.current_streak]);

  return { ...current, formattedCurrent };
}

export function useTopStreaks(limit = 3) {
  const streaks = useHabitStore((s) => s.streaks);
  const habits = useHabitStore((s) => s.habits);

  return useMemo(() => {
    const activeHabitIds = new Set(
      habits.filter((h) => !h.is_archived).map((h) => h.id)
    );

    return Object.values(streaks)
      .filter((s) => activeHabitIds.has(s.habit_id) && s.current_streak > 0)
      .sort((a, b) => b.current_streak - a.current_streak)
      .slice(0, limit);
  }, [streaks, habits, limit]);
}
