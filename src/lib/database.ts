import type { SQLiteDatabase } from 'expo-sqlite';
import { withDatabaseTransaction, DatabaseError } from './errors';
import type {
  Habit,
  HabitRow,
  Completion,
  CompletionRow,
  Streak,
  StreakRow,
  HabitCategory,
  HabitFrequency,
  SyncOperation,
} from '@/types';
import { DB_VERSION } from '@/constants/config';

// ─── Schema Migration ──────────────────────────────────

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT NOT NULL DEFAULT '🎯',
        color TEXT NOT NULL DEFAULT '#6366F1',
        category TEXT NOT NULL DEFAULT 'general',
        frequency TEXT NOT NULL DEFAULT 'daily',
        target_days TEXT DEFAULT '[]',
        reminder_time TEXT,
        reminder_enabled INTEGER NOT NULL DEFAULT 0,
        is_archived INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        device_id TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced_at TEXT
      );

      CREATE TABLE IF NOT EXISTS completions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        completed_date TEXT NOT NULL,
        note TEXT,
        photo_uri TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced_at TEXT,
        UNIQUE(habit_id, completed_date)
      );

      CREATE TABLE IF NOT EXISTS streaks (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_completed_date TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (habit_id)
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 5,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id TEXT PRIMARY KEY,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        local_data TEXT NOT NULL,
        remote_data TEXT NOT NULL,
        resolved INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completed_date);
      CREATE INDEX IF NOT EXISTS idx_completions_habit ON completions(habit_id, completed_date);
      CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_retry ON sync_queue(retry_count);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

// ─── Sync Queue Helper ─────────────────────────────────
// Non-fatal: enqueue failure only warns. Never blocks local ops.

async function enqueueSync(
  db: SQLiteDatabase,
  tableName: 'habits' | 'completions' | 'streaks',
  operation: SyncOperation,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const id = generateId();
    await db.runAsync(
      'INSERT INTO sync_queue (id, table_name, operation, data) VALUES (?, ?, ?, ?)',
      [id, tableName, operation, JSON.stringify(data)]
    );
  } catch (err) {
    console.warn(`[Sync] enqueue failed for ${tableName}/${operation}:`, err);
  }
}

// ─── Row → Model Mappers ───────────────────────────────

function rowToHabit(row: HabitRow): Habit {
  return {
    ...row,
    category: row.category as HabitCategory,
    frequency: row.frequency as HabitFrequency,
    target_days: JSON.parse(row.target_days) as number[],
    reminder_enabled: row.reminder_enabled === 1,
    is_archived: row.is_archived === 1,
  };
}

function rowToCompletion(row: CompletionRow): Completion {
  return { ...row };
}

function rowToStreak(row: StreakRow): Streak {
  return { ...row };
}

// ─── Habit CRUD ────────────────────────────────────────

export async function getHabits(
  db: SQLiteDatabase,
  userId: string,
  includeArchived = false
): Promise<Habit[]> {
  const query = includeArchived
    ? 'SELECT * FROM habits WHERE user_id = ? ORDER BY sort_order ASC, created_at DESC'
    : 'SELECT * FROM habits WHERE user_id = ? AND is_archived = 0 ORDER BY sort_order ASC, created_at DESC';

  const rows = await db.getAllAsync<HabitRow>(query, [userId]);
  return rows.map(rowToHabit);
}

export async function getHabitById(
  db: SQLiteDatabase,
  id: string
): Promise<Habit | null> {
  const row = await db.getFirstAsync<HabitRow>(
    'SELECT * FROM habits WHERE id = ?',
    [id]
  );
  return row ? rowToHabit(row) : null;
}

export async function createHabit(
  db: SQLiteDatabase,
  habit: Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'synced_at' | 'version'>
): Promise<string> {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO habits (id, user_id, name, description, icon, color, category, frequency, target_days, reminder_time, reminder_enabled, is_archived, sort_order, device_id, version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      id,
      habit.user_id,
      habit.name,
      habit.description,
      habit.icon,
      habit.color,
      habit.category,
      habit.frequency,
      JSON.stringify(habit.target_days),
      habit.reminder_time,
      habit.reminder_enabled ? 1 : 0,
      habit.is_archived ? 1 : 0,
      habit.sort_order,
      habit.device_id,
    ]
  );

  await db.runAsync(
    'INSERT INTO streaks (habit_id) VALUES (?)',
    [id]
  );

  await enqueueSync(db, 'habits', 'INSERT', {
    id,
    user_id: habit.user_id,
    name: habit.name,
    description: habit.description,
    icon: habit.icon,
    color: habit.color,
    category: habit.category,
    frequency: habit.frequency,
    target_days: habit.target_days,
    reminder_time: habit.reminder_time,
    reminder_enabled: habit.reminder_enabled,
    is_archived: habit.is_archived,
    sort_order: habit.sort_order,
    device_id: habit.device_id,
    version: 1,
  });

  await enqueueSync(db, 'streaks', 'INSERT', {
    habit_id: id,
    current_streak: 0,
    longest_streak: 0,
    last_completed_date: null,
  });

  return id;
}

export async function updateHabit(
  db: SQLiteDatabase,
  id: string,
  updates: Partial<Pick<Habit, 'name' | 'description' | 'icon' | 'color' | 'category' | 'frequency' | 'target_days' | 'reminder_time' | 'reminder_enabled' | 'is_archived' | 'sort_order'>>
): Promise<void> {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];
  const syncData: Record<string, unknown> = { id };

  if (updates.name !== undefined) { setClauses.push('name = ?'); values.push(updates.name); syncData.name = updates.name; }
  if (updates.description !== undefined) { setClauses.push('description = ?'); values.push(updates.description); syncData.description = updates.description; }
  if (updates.icon !== undefined) { setClauses.push('icon = ?'); values.push(updates.icon); syncData.icon = updates.icon; }
  if (updates.color !== undefined) { setClauses.push('color = ?'); values.push(updates.color); syncData.color = updates.color; }
  if (updates.category !== undefined) { setClauses.push('category = ?'); values.push(updates.category); syncData.category = updates.category; }
  if (updates.frequency !== undefined) { setClauses.push('frequency = ?'); values.push(updates.frequency); syncData.frequency = updates.frequency; }
  if (updates.target_days !== undefined) { setClauses.push('target_days = ?'); values.push(JSON.stringify(updates.target_days)); syncData.target_days = updates.target_days; }
  if (updates.reminder_time !== undefined) { setClauses.push('reminder_time = ?'); values.push(updates.reminder_time); syncData.reminder_time = updates.reminder_time; }
  if (updates.reminder_enabled !== undefined) { setClauses.push('reminder_enabled = ?'); values.push(updates.reminder_enabled ? 1 : 0); syncData.reminder_enabled = updates.reminder_enabled; }
  if (updates.is_archived !== undefined) { setClauses.push('is_archived = ?'); values.push(updates.is_archived ? 1 : 0); syncData.is_archived = updates.is_archived; }
  if (updates.sort_order !== undefined) { setClauses.push('sort_order = ?'); values.push(updates.sort_order); syncData.sort_order = updates.sort_order; }

  if (setClauses.length === 0) return;

  setClauses.push("updated_at = datetime('now')");
  setClauses.push('version = version + 1');
  setClauses.push('synced_at = NULL');
  values.push(id);

  await db.runAsync(
    `UPDATE habits SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  const updated = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM habits WHERE id = ?',
    [id]
  );
  if (updated) syncData.version = updated.version;

  await enqueueSync(db, 'habits', 'UPDATE', syncData);
}

export async function deleteHabit(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await withDatabaseTransaction(db, async () => {
    await db.runAsync('DELETE FROM streaks WHERE habit_id = ?', [id]);
    await db.runAsync('DELETE FROM completions WHERE habit_id = ?', [id]);
    await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
  });

  await enqueueSync(db, 'habits', 'DELETE', { id });
}

// ─── Completion CRUD ───────────────────────────────────

export async function getCompletions(
  db: SQLiteDatabase,
  habitId: string,
  startDate?: string,
  endDate?: string
): Promise<Completion[]> {
  let query = 'SELECT * FROM completions WHERE habit_id = ?';
  const params: string[] = [habitId];

  if (startDate) {
    query += ' AND completed_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND completed_date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY completed_date DESC';

  const rows = await db.getAllAsync<CompletionRow>(query, params);
  return rows.map(rowToCompletion);
}

export async function getCompletionsForDate(
  db: SQLiteDatabase,
  userId: string,
  date: string
): Promise<Completion[]> {
  const rows = await db.getAllAsync<CompletionRow>(
    `SELECT c.* FROM completions c
     JOIN habits h ON c.habit_id = h.id
     WHERE h.user_id = ? AND c.completed_date = ?`,
    [userId, date]
  );
  return rows.map(rowToCompletion);
}

export async function toggleCompletion(
  db: SQLiteDatabase,
  habitId: string,
  date: string
): Promise<boolean> {
  const existing = await db.getFirstAsync<CompletionRow>(
    'SELECT * FROM completions WHERE habit_id = ? AND completed_date = ?',
    [habitId, date]
  );

  if (existing) {
    await db.runAsync(
      'DELETE FROM completions WHERE habit_id = ? AND completed_date = ?',
      [habitId, date]
    );

    await enqueueSync(db, 'completions', 'DELETE', {
      id: existing.id,
      habit_id: habitId,
      completed_date: date,
    });

    return false;
  }

  const id = generateId();
  await db.runAsync(
    'INSERT INTO completions (id, habit_id, completed_date) VALUES (?, ?, ?)',
    [id, habitId, date]
  );

  await enqueueSync(db, 'completions', 'INSERT', {
    id,
    habit_id: habitId,
    completed_date: date,
    note: null,
    photo_uri: null,
  });

  return true;
}

export async function addCompletionNote(
  db: SQLiteDatabase,
  habitId: string,
  date: string,
  note: string | null,
  photoUri: string | null
): Promise<void> {
  await db.runAsync(
    `UPDATE completions SET note = ?, photo_uri = ? WHERE habit_id = ? AND completed_date = ?`,
    [note, photoUri, habitId, date]
  );

  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM completions WHERE habit_id = ? AND completed_date = ?',
    [habitId, date]
  );
  if (row) {
    await enqueueSync(db, 'completions', 'UPDATE', {
      id: row.id,
      habit_id: habitId,
      completed_date: date,
      note,
      photo_uri: photoUri,
    });
  }
}

// ─── Streak Operations ─────────────────────────────────

export async function getStreak(
  db: SQLiteDatabase,
  habitId: string
): Promise<Streak | null> {
  const row = await db.getFirstAsync<StreakRow>(
    'SELECT * FROM streaks WHERE habit_id = ?',
    [habitId]
  );
  return row ? rowToStreak(row) : null;
}

export async function getAllStreaks(
  db: SQLiteDatabase,
  userId: string
): Promise<Streak[]> {
  const rows = await db.getAllAsync<StreakRow>(
    `SELECT s.* FROM streaks s
     JOIN habits h ON s.habit_id = h.id
     WHERE h.user_id = ? AND h.is_archived = 0`,
    [userId]
  );
  return rows.map(rowToStreak);
}

export function calculateStreak(
  completions: Completion[],
  today: string
): { current: number; longest: number; lastDate: string | null } {
  if (completions.length === 0) {
    return { current: 0, longest: 0, lastDate: null };
  }

  const dates = new Set(completions.map((c) => c.completed_date));
  const sortedDates = [...dates].sort().reverse();

  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  let checkDate = today;

  if (!dates.has(today)) {
    const yesterday = getDateString(addDays(parseDate(today), -1));
    if (!dates.has(yesterday)) {
      const allSorted = [...dates].sort().reverse();
      for (let i = 0; i < allSorted.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = parseDate(allSorted[i - 1]);
          const curr = parseDate(allSorted[i]);
          const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            tempStreak++;
          } else {
            longest = Math.max(longest, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longest = Math.max(longest, tempStreak);
      return { current: 0, longest, lastDate: sortedDates[0] ?? null };
    }
    checkDate = yesterday;
  }

  let d = checkDate;
  while (dates.has(d)) {
    current++;
    d = getDateString(addDays(parseDate(d), -1));
  }

  const allSorted = [...dates].sort();
  tempStreak = 1;
  for (let i = 1; i < allSorted.length; i++) {
    const prev = parseDate(allSorted[i - 1]);
    const curr = parseDate(allSorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
    } else {
      longest = Math.max(longest, tempStreak);
      tempStreak = 1;
    }
  }
  longest = Math.max(longest, tempStreak, current);

  return { current, longest, lastDate: sortedDates[0] ?? null };
}

export async function updateStreak(
  db: SQLiteDatabase,
  habitId: string,
  today: string
): Promise<Streak> {
  const completions = await getCompletions(db, habitId);
  const { current, longest, lastDate } = calculateStreak(completions, today);

  await db.runAsync(
    `INSERT OR REPLACE INTO streaks (habit_id, current_streak, longest_streak, last_completed_date, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [habitId, current, longest, lastDate]
  );

  const streak: Streak = {
    habit_id: habitId,
    current_streak: current,
    longest_streak: longest,
    last_completed_date: lastDate,
    updated_at: new Date().toISOString(),
  };

  await enqueueSync(db, 'streaks', 'UPDATE', {
    habit_id: habitId,
    current_streak: current,
    longest_streak: longest,
    last_completed_date: lastDate,
  });

  return streak;
}

// ─── Sync Queue Operations ─────────────────────────────

export async function getSyncQueue(
  db: SQLiteDatabase
): Promise<import('@/types').SyncQueueItem[]> {
  return db.getAllAsync(
    'SELECT * FROM sync_queue WHERE retry_count < max_retries ORDER BY created_at ASC'
  );
}

export async function addToSyncQueue(
  db: SQLiteDatabase,
  item: Omit<import('@/types').SyncQueueItem, 'retry_count' | 'max_retries' | 'created_at'>
): Promise<void> {
  await db.runAsync(
    'INSERT INTO sync_queue (id, table_name, operation, data) VALUES (?, ?, ?, ?)',
    [item.id, item.table_name, item.operation, item.data]
  );
}

export async function incrementSyncRetry(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    'UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?',
    [id]
  );
}

export async function removeSyncQueueItem(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

// ─── Sync Conflicts ────────────────────────────────────

export async function getUnresolvedConflicts(
  db: SQLiteDatabase
): Promise<import('@/types').SyncConflict[]> {
  return db.getAllAsync(
    'SELECT * FROM sync_conflicts WHERE resolved = 0 ORDER BY created_at DESC'
  );
}

export async function addSyncConflict(
  db: SQLiteDatabase,
  conflict: Omit<import('@/types').SyncConflict, 'resolved' | 'created_at'>
): Promise<void> {
  await db.runAsync(
    'INSERT INTO sync_conflicts (id, table_name, record_id, local_data, remote_data) VALUES (?, ?, ?, ?, ?)',
    [conflict.id, conflict.table_name, conflict.record_id, conflict.local_data, conflict.remote_data]
  );
}

export async function resolveConflict(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync(
    'UPDATE sync_conflicts SET resolved = 1 WHERE id = ?',
    [id]
  );
}

// ─── Helpers ───────────────────────────────────────────

function generateId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export { generateId, getDateString, parseDate, addDays };


export async function purgeExpiredSyncItems(
  db: SQLiteDatabase
): Promise<number> {
  const result = await db.runAsync(
    'DELETE FROM sync_queue WHERE retry_count >= max_retries'
  );
  return result.changes;
}


