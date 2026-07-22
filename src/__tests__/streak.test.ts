import { calculateStreak } from '@/lib/database';
import type { Completion } from '@/types';

function makeCompletion(date: string): Completion {
  return {
    id: `test-${date}`,
    habit_id: 'test-habit',
    completed_date: date,
    note: null,
    photo_uri: null,
    created_at: date,
    synced_at: null,
  };
}

describe('calculateStreak', () => {
  it('returns 0 when there are no completions', () => {
    const result = calculateStreak([], '2026-02-22');
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.lastDate).toBeNull();
  });

  it('calculates streak from consecutive completions including today', () => {
    const completions = [
      makeCompletion('2026-02-20'),
      makeCompletion('2026-02-21'),
      makeCompletion('2026-02-22'),
    ];
    const result = calculateStreak(completions, '2026-02-22');
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('calculates streak starting from yesterday if today is not completed', () => {
    const completions = [
      makeCompletion('2026-02-19'),
      makeCompletion('2026-02-20'),
      makeCompletion('2026-02-21'),
    ];
    const result = calculateStreak(completions, '2026-02-22');
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('resets streak after a gap day', () => {
    const completions = [
      makeCompletion('2026-02-18'),
      makeCompletion('2026-02-19'),
      // gap on 2026-02-20
      makeCompletion('2026-02-21'),
      makeCompletion('2026-02-22'),
    ];
    const result = calculateStreak(completions, '2026-02-22');
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
  });

  it('handles month boundaries correctly', () => {
    const completions = [
      makeCompletion('2026-01-30'),
      makeCompletion('2026-01-31'),
      makeCompletion('2026-02-01'),
      makeCompletion('2026-02-02'),
    ];
    const result = calculateStreak(completions, '2026-02-02');
    expect(result.current).toBe(4);
    expect(result.longest).toBe(4);
  });

  it('handles year boundaries correctly', () => {
    const completions = [
      makeCompletion('2025-12-30'),
      makeCompletion('2025-12-31'),
      makeCompletion('2026-01-01'),
      makeCompletion('2026-01-02'),
    ];
    const result = calculateStreak(completions, '2026-01-02');
    expect(result.current).toBe(4);
    expect(result.longest).toBe(4);
  });

  it('tracks longest streak even when current streak is shorter', () => {
    const completions = [
      // Old streak of 5
      makeCompletion('2026-02-01'),
      makeCompletion('2026-02-02'),
      makeCompletion('2026-02-03'),
      makeCompletion('2026-02-04'),
      makeCompletion('2026-02-05'),
      // Gap
      // New streak of 2
      makeCompletion('2026-02-21'),
      makeCompletion('2026-02-22'),
    ];
    const result = calculateStreak(completions, '2026-02-22');
    expect(result.current).toBe(2);
    expect(result.longest).toBe(5);
  });

  it('returns current=0 when no recent completions', () => {
    const completions = [
      makeCompletion('2026-02-01'),
      makeCompletion('2026-02-02'),
    ];
    const result = calculateStreak(completions, '2026-02-22');
    expect(result.current).toBe(0);
    expect(result.longest).toBe(2);
  });

  it('handles single completion today', () => {
    const completions = [makeCompletion('2026-02-22')];
    const result = calculateStreak(completions, '2026-02-22');
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it('handles duplicate dates correctly', () => {
    const completions = [
      makeCompletion('2026-02-21'),
      makeCompletion('2026-02-21'), // duplicate
      makeCompletion('2026-02-22'),
    ];
    const result = calculateStreak(completions, '2026-02-22');
    expect(result.current).toBe(2);
  });
});

// Weekday reference for Feb 2026: 16=Mon, 17=Tue, 18=Wed, 20=Fri,
// 21=Sat, 22=Sun, 23=Mon, 25=Wed (target_days use Date.getDay(): 0=Sun..6=Sat)
describe('calculateStreak with habit frequency', () => {
  const weekly = (days: number[]) =>
    ({ frequency: 'weekly', target_days: days }) as const;
  const custom = (days: number[]) =>
    ({ frequency: 'custom', target_days: days }) as const;

  describe('weekly habits', () => {
    it('counts consecutive scheduled days as a streak despite calendar gaps', () => {
      // Mon/Wed/Fri habit completed Mon, Wed, Fri
      const completions = [
        makeCompletion('2026-02-16'),
        makeCompletion('2026-02-18'),
        makeCompletion('2026-02-20'),
      ];
      const result = calculateStreak(completions, '2026-02-20', weekly([1, 3, 5]));
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });

    it('keeps the streak on non-scheduled days', () => {
      // Today is Saturday — an off-day for a Mon/Wed/Fri habit
      const completions = [
        makeCompletion('2026-02-16'),
        makeCompletion('2026-02-18'),
        makeCompletion('2026-02-20'),
      ];
      const result = calculateStreak(completions, '2026-02-21', weekly([1, 3, 5]));
      expect(result.current).toBe(3);
    });

    it('keeps the streak when today is scheduled but not yet completed', () => {
      // Today is Monday (scheduled, uncompleted) — grace until the day ends
      const completions = [
        makeCompletion('2026-02-16'),
        makeCompletion('2026-02-18'),
        makeCompletion('2026-02-20'),
      ];
      const result = calculateStreak(completions, '2026-02-23', weekly([1, 3, 5]));
      expect(result.current).toBe(3);
    });

    it('resets the streak after a missed scheduled day', () => {
      // Monday 02-23 was scheduled but missed; today is Wednesday 02-25
      const completions = [
        makeCompletion('2026-02-16'),
        makeCompletion('2026-02-18'),
        makeCompletion('2026-02-20'),
      ];
      const result = calculateStreak(completions, '2026-02-25', weekly([1, 3, 5]));
      expect(result.current).toBe(0);
      expect(result.longest).toBe(3);
    });

    it('breaks the streak across a missed scheduled day in the middle', () => {
      // Wednesday 02-18 was scheduled but missed
      const completions = [
        makeCompletion('2026-02-16'),
        makeCompletion('2026-02-20'),
      ];
      const result = calculateStreak(completions, '2026-02-20', weekly([1, 3, 5]));
      expect(result.current).toBe(1);
      expect(result.longest).toBe(1);
    });

    it('ignores off-day completions (they neither extend nor break the streak)', () => {
      // Tuesday 02-17 is not scheduled for a Mon/Wed/Fri habit
      const completions = [
        makeCompletion('2026-02-16'),
        makeCompletion('2026-02-17'),
        makeCompletion('2026-02-18'),
        makeCompletion('2026-02-20'),
      ];
      const result = calculateStreak(completions, '2026-02-20', weekly([1, 3, 5]));
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });

    it('falls back to daily behavior when target_days is empty', () => {
      const completions = [
        makeCompletion('2026-02-21'),
        makeCompletion('2026-02-22'),
      ];
      const result = calculateStreak(completions, '2026-02-22', weekly([]));
      expect(result.current).toBe(2);
    });
  });

  describe('custom target_days habits', () => {
    it('tracks a weekend-only habit across weeks', () => {
      // Sat/Sun habit: Sat 02-14, Sun 02-15, Sat 02-21; today Sun 02-22 (uncompleted)
      const completions = [
        makeCompletion('2026-02-14'),
        makeCompletion('2026-02-15'),
        makeCompletion('2026-02-21'),
      ];
      const result = calculateStreak(completions, '2026-02-22', custom([0, 6]));
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });

    it('computes longest streak over scheduled days only', () => {
      // Monday-only habit completed two Mondays in a row, then abandoned
      const completions = [
        makeCompletion('2026-02-02'),
        makeCompletion('2026-02-09'),
      ];
      const result = calculateStreak(completions, '2026-02-22', custom([1]));
      expect(result.current).toBe(0);
      expect(result.longest).toBe(2);
    });
  });

  describe('daily habits', () => {
    it('matches the default behavior when the schedule is passed explicitly', () => {
      const completions = [
        makeCompletion('2026-02-20'),
        makeCompletion('2026-02-21'),
        makeCompletion('2026-02-22'),
      ];
      const result = calculateStreak(completions, '2026-02-22', {
        frequency: 'daily',
        target_days: [0, 1, 2, 3, 4, 5, 6],
      });
      expect(result.current).toBe(3);
      expect(result.longest).toBe(3);
    });
  });
});
