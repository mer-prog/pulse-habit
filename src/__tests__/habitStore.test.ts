import { useHabitStore } from '@/stores/habitStore';
import type { Habit, Completion, Streak } from '@/types';

const mockHabit: Habit = {
  id: 'test-1',
  user_id: 'local',
  name: 'Test Habit',
  description: null,
  icon: '🎯',
  color: '#6366F1',
  category: 'other',
  frequency: 'daily',
  target_days: [0, 1, 2, 3, 4, 5, 6],
  reminder_time: null,
  reminder_enabled: false,
  is_archived: false,
  sort_order: 0,
  device_id: null,
  version: 1,
  created_at: '2026-02-22T00:00:00Z',
  updated_at: '2026-02-22T00:00:00Z',
  synced_at: null,
};

const mockHabit2: Habit = {
  ...mockHabit,
  id: 'test-2',
  name: 'Second Habit',
  category: 'exercise',
  sort_order: 1,
};

const mockStreak: Streak = {
  habit_id: 'test-1',
  current_streak: 5,
  longest_streak: 10,
  last_completed_date: '2026-02-22',
  updated_at: '2026-02-22T00:00:00Z',
};

describe('habitStore', () => {
  beforeEach(() => {
    // Reset store state
    useHabitStore.setState({
      habits: [],
      completions: {},
      streaks: {},
      isLoading: false,
    });
  });

  describe('addHabit', () => {
    it('adds a habit to the store', () => {
      useHabitStore.getState().addHabit(mockHabit);
      expect(useHabitStore.getState().habits).toHaveLength(1);
      expect(useHabitStore.getState().habits[0].name).toBe('Test Habit');
    });

    it('adds multiple habits', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);
      store.addHabit(mockHabit2);
      expect(useHabitStore.getState().habits).toHaveLength(2);
    });
  });

  describe('updateHabitInStore', () => {
    it('updates habit properties', () => {
      useHabitStore.getState().addHabit(mockHabit);
      useHabitStore.getState().updateHabitInStore('test-1', { name: 'Updated' });
      expect(useHabitStore.getState().habits[0].name).toBe('Updated');
    });

    it('does not modify other habits', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);
      store.addHabit(mockHabit2);
      store.updateHabitInStore('test-1', { name: 'Updated' });
      expect(useHabitStore.getState().habits[1].name).toBe('Second Habit');
    });
  });

  describe('removeHabit', () => {
    it('removes habit and its related data', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);
      store.setCompletions('test-1', [
        {
          id: 'c-1',
          habit_id: 'test-1',
          completed_date: '2026-02-22',
          note: null,
          photo_uri: null,
          created_at: '',
          synced_at: null,
        },
      ]);
      store.setStreak('test-1', mockStreak);

      store.removeHabit('test-1');

      expect(useHabitStore.getState().habits).toHaveLength(0);
      expect(useHabitStore.getState().completions['test-1']).toBeUndefined();
      expect(useHabitStore.getState().streaks['test-1']).toBeUndefined();
    });
  });

  describe('getActiveHabits', () => {
    it('filters out archived habits', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);
      store.addHabit({ ...mockHabit2, is_archived: true });
      expect(store.getActiveHabits()).toHaveLength(1);
      expect(store.getActiveHabits()[0].id).toBe('test-1');
    });
  });

  describe('getTodayCompletedIds', () => {
    it('returns completed habit IDs for today', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);
      store.addHabit(mockHabit2);
      store.setCompletions('test-1', [
        {
          id: 'c-1',
          habit_id: 'test-1',
          completed_date: '2026-02-22',
          note: null,
          photo_uri: null,
          created_at: '',
          synced_at: null,
        },
      ]);

      const ids = store.getTodayCompletedIds('2026-02-22');
      expect(ids.has('test-1')).toBe(true);
      expect(ids.has('test-2')).toBe(false);
    });
  });

  describe('getHabitsWithStreaks', () => {
    it('returns habits with streak data and completion status', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);
      store.setStreak('test-1', mockStreak);
      store.setCompletions('test-1', [
        {
          id: 'c-1',
          habit_id: 'test-1',
          completed_date: '2026-02-22',
          note: null,
          photo_uri: null,
          created_at: '',
          synced_at: null,
        },
      ]);

      const result = store.getHabitsWithStreaks('2026-02-22');
      expect(result).toHaveLength(1);
      expect(result[0].isCompletedToday).toBe(true);
      expect(result[0].streak.current_streak).toBe(5);
    });

    it('provides default streak when none exists', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);

      const result = store.getHabitsWithStreaks('2026-02-22');
      expect(result[0].streak.current_streak).toBe(0);
      expect(result[0].isCompletedToday).toBe(false);
    });

    it('calculates correct completion rate', () => {
      const store = useHabitStore.getState();
      store.addHabit(mockHabit);
      store.addHabit(mockHabit2);
      store.setCompletions('test-1', [
        {
          id: 'c-1',
          habit_id: 'test-1',
          completed_date: '2026-02-22',
          note: null,
          photo_uri: null,
          created_at: '',
          synced_at: null,
        },
      ]);

      const result = store.getHabitsWithStreaks('2026-02-22');
      const completedCount = result.filter((h) => h.isCompletedToday).length;
      const rate = completedCount / result.length;
      expect(rate).toBe(0.5); // 1 out of 2
    });
  });
});
