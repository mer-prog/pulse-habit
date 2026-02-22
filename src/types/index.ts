// ─── Habit Types ───────────────────────────────────────

export type HabitCategory =
  | 'health'
  | 'exercise'
  | 'learning'
  | 'work'
  | 'mind'
  | 'other';

export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  target_days: number[]; // [1,2,3,4,5] = Mon-Fri
  reminder_time: string | null; // HH:MM
  reminder_enabled: boolean;
  is_archived: boolean;
  sort_order: number;
  device_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface Completion {
  id: string;
  habit_id: string;
  completed_date: string; // YYYY-MM-DD
  note: string | null;
  photo_uri: string | null;
  created_at: string;
  synced_at: string | null;
}

export interface Streak {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

// ─── Category Definition ───────────────────────────────

export interface CategoryDefinition {
  key: HabitCategory;
  label: string;
  labelJa: string;
  color: string;
  icon: string;
}

// ─── Sync Types ────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncQueueItem {
  id: string;
  table_name: 'habits' | 'completions' | 'streaks';
  operation: SyncOperation;
  data: string; // JSON string
  retry_count: number;
  max_retries: number;
  created_at: string;
}

export interface SyncConflict {
  id: string;
  table_name: string;
  record_id: string;
  local_data: string; // JSON string
  remote_data: string; // JSON string
  resolved: boolean;
  created_at: string;
}

// ─── App Types ─────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ─── Auth Types ────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

// ─── Error Types ───────────────────────────────────────

export type AppErrorType = 'SYNC_ERROR' | 'DATABASE_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR';

// ─── Habit with Streak (joined view) ──────────────────

export interface HabitWithStreak extends Habit {
  streak: Streak;
  isCompletedToday: boolean;
}

// ─── Database Row Types (SQLite raw results) ──────────

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: string;
  frequency: string;
  target_days: string; // JSON string
  reminder_time: string | null;
  reminder_enabled: number; // 0 | 1
  is_archived: number; // 0 | 1
  sort_order: number;
  device_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export interface CompletionRow {
  id: string;
  habit_id: string;
  completed_date: string;
  note: string | null;
  photo_uri: string | null;
  created_at: string;
  synced_at: string | null;
}

export interface StreakRow {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}
