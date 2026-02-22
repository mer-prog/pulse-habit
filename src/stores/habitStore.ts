import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, Completion, Streak, HabitWithStreak } from '@/types';

interface HabitState {
  habits: Habit[];
  completions: Record<string, Completion[]>; // keyed by habitId
  streaks: Record<string, Streak>; // keyed by habitId
  isLoading: boolean;

  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabitInStore: (id: string, updates: Partial<Habit>) => void;
  removeHabit: (id: string) => void;

  setCompletions: (habitId: string, completions: Completion[]) => void;
  addCompletion: (completion: Completion) => void;
  removeCompletion: (habitId: string, date: string) => void;

  setStreak: (habitId: string, streak: Streak) => void;
  setStreaks: (streaks: Record<string, Streak>) => void;

  setLoading: (loading: boolean) => void;

  // Computed-like getters
  getActiveHabits: () => Habit[];
  getTodayCompletedIds: (today: string) => Set<string>;
  getHabitsWithStreaks: (today: string) => HabitWithStreak[];
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: {},
      streaks: {},
      isLoading: true,

      setHabits: (habits) => set({ habits }),

      addHabit: (habit) =>
        set((state) => ({ habits: [...state.habits, habit] })),

      updateHabitInStore: (id, updates) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),

      removeHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          completions: Object.fromEntries(
            Object.entries(state.completions).filter(([key]) => key !== id)
          ),
          streaks: Object.fromEntries(
            Object.entries(state.streaks).filter(([key]) => key !== id)
          ),
        })),

      setCompletions: (habitId, completions) =>
        set((state) => ({
          completions: { ...state.completions, [habitId]: completions },
        })),

      addCompletion: (completion) =>
        set((state) => ({
          completions: {
            ...state.completions,
            [completion.habit_id]: [
              ...(state.completions[completion.habit_id] ?? []),
              completion,
            ],
          },
        })),

      removeCompletion: (habitId, date) =>
        set((state) => ({
          completions: {
            ...state.completions,
            [habitId]: (state.completions[habitId] ?? []).filter(
              (c) => c.completed_date !== date
            ),
          },
        })),

      setStreak: (habitId, streak) =>
        set((state) => ({
          streaks: { ...state.streaks, [habitId]: streak },
        })),

      setStreaks: (streaks) => set({ streaks }),

      setLoading: (isLoading) => set({ isLoading }),

      getActiveHabits: () => get().habits.filter((h) => !h.is_archived),

      getTodayCompletedIds: (today) => {
        const ids = new Set<string>();
        const { completions } = get();
        for (const [habitId, comps] of Object.entries(completions)) {
          if (comps.some((c) => c.completed_date === today)) {
            ids.add(habitId);
          }
        }
        return ids;
      },

      getHabitsWithStreaks: (today) => {
        const state = get();
        const completedIds = state.getTodayCompletedIds(today);
        return state
          .getActiveHabits()
          .map((habit) => ({
            ...habit,
            streak: state.streaks[habit.id] ?? {
              habit_id: habit.id,
              current_streak: 0,
              longest_streak: 0,
              last_completed_date: null,
              updated_at: '',
            },
            isCompletedToday: completedIds.has(habit.id),
          }))
          .sort((a, b) => a.sort_order - b.sort_order);
      },
    }),
    {
      name: 'habit-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habits: state.habits,
        completions: state.completions,
        streaks: state.streaks,
      }),
    }
  )
);
