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
