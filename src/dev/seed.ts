import type { SQLiteDatabase } from 'expo-sqlite';
import type { HabitCategory } from '@/types';

interface SeedHabit {
  name: string;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: 'daily' | 'custom';
  target_days: number[];
  streak: number;
}

const SEED_HABITS: SeedHabit[] = [
  {
    name: '朝のジョギング',
    icon: '🏃',
    color: '#F59E0B',
    category: 'exercise',
    frequency: 'daily',
    target_days: [0, 1, 2, 3, 4, 5, 6],
    streak: 23,
  },
  {
    name: '読書30分',
    icon: '📚',
    color: '#6366F1',
    category: 'learning',
    frequency: 'daily',
    target_days: [0, 1, 2, 3, 4, 5, 6],
    streak: 15,
  },
  {
    name: '瞑想10分',
    icon: '🧘',
    color: '#8B5CF6',
    category: 'mind',
    frequency: 'daily',
    target_days: [0, 1, 2, 3, 4, 5, 6],
    streak: 45,
  },
  {
    name: '水2L',
    icon: '💧',
    color: '#10B981',
    category: 'health',
    frequency: 'daily',
    target_days: [0, 1, 2, 3, 4, 5, 6],
    streak: 7,
  },
  {
    name: 'コーディング1時間',
    icon: '💻',
    color: '#3B82F6',
    category: 'work',
    frequency: 'custom',
    target_days: [1, 2, 3, 4, 5], // Mon-Fri
    streak: 12,
  },
];

// Today: habits 0, 1, 2 are completed (3/5)
const TODAY_COMPLETED_INDICES = [0, 1, 2];

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  if (!__DEV__) {
    console.warn('Seed data is only available in development');
    return;
  }

  // Only seed if tables are empty
  const habitCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM habits'
  );
  if (habitCount && habitCount.count > 0) return;

  const userId = 'local';
  const today = new Date();
  const todayStr = formatDate(today);

  for (let i = 0; i < SEED_HABITS.length; i++) {
    const seed = SEED_HABITS[i];
    const habitId = generateId();

    // Insert habit
    await db.runAsync(
      `INSERT INTO habits (id, user_id, name, description, icon, color, category, frequency, target_days, reminder_enabled, sort_order, version)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 0, ?, 1)`,
      [
        habitId,
        userId,
        seed.name,
        seed.icon,
        seed.color,
        seed.category,
        seed.frequency,
        JSON.stringify(seed.target_days),
        i,
      ]
    );

    // Generate 30 days of completion data at ~80% rate
    const completionDates: string[] = [];

    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = formatDate(date);

      // For today, only complete indices in TODAY_COMPLETED_INDICES
      if (d === 0) {
        if (TODAY_COMPLETED_INDICES.includes(i)) {
          completionDates.push(dateStr);
        }
        continue;
      }

      // For weekday-only habits, skip weekends
      if (seed.frequency === 'custom') {
        const dayOfWeek = date.getDay();
        if (!seed.target_days.includes(dayOfWeek)) continue;
      }

      // 80% completion rate (but ensure the streak matches)
      if (d < seed.streak) {
        // Within the streak period — always completed
        completionDates.push(dateStr);
      } else {
        // Before streak — random 60% chance
        if (Math.random() < 0.6) {
          completionDates.push(dateStr);
        }
      }
    }

    // Insert completions
    for (const dateStr of completionDates) {
      const compId = generateId();
      await db.runAsync(
        'INSERT INTO completions (id, habit_id, completed_date) VALUES (?, ?, ?)',
        [compId, habitId, dateStr]
      );
    }

    // Calculate and insert streak
    const lastCompleted = completionDates.length > 0
      ? completionDates[completionDates.length - 1]
      : null;

    // Calculate actual current streak from the data
    let currentStreak = 0;
    const sortedDates = new Set(completionDates);
    let checkDate = todayStr;

    // If today isn't completed, start from yesterday
    if (!sortedDates.has(todayStr)) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      checkDate = formatDate(yesterday);
    }

    while (sortedDates.has(checkDate)) {
      currentStreak++;
      const d = new Date(checkDate.split('-').map(Number).reduce((date, part, idx) => {
        if (idx === 0) return new Date(part, 0, 1);
        if (idx === 1) { date.setMonth(part - 1); return date; }
        date.setDate(part); return date;
      }, new Date()));
      d.setDate(d.getDate() - 1);
      checkDate = formatDate(d);
    }

    // Find longest streak
    let longestStreak = currentStreak;
    const allDates = [...sortedDates].sort();
    let tempStreak = 1;
    for (let j = 1; j < allDates.length; j++) {
      const prev = new Date(allDates[j - 1]);
      const curr = new Date(allDates[j]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (Math.abs(diff - 1) < 0.01) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    await db.runAsync(
      `INSERT INTO streaks (habit_id, current_streak, longest_streak, last_completed_date, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [habitId, currentStreak, longestStreak, lastCompleted]
    );
  }
}

function generateId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
