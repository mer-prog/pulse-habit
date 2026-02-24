export const APP_NAME = 'PulseHabit';
export const APP_VERSION = '1.0.0';
export const DB_NAME = 'pulsehabit.db';
export const DB_VERSION = 1;

export const SYNC_MAX_RETRIES = 5;
export const SYNC_BACKOFF_BASE_MS = 1000;

export const DEFAULT_REMINDER_TIME = '09:00';

// Input validation limits
export const MAX_HABIT_NAME_LENGTH = 100;
export const MAX_HABIT_DESCRIPTION_LENGTH = 500;
export const MAX_COMPLETION_NOTE_LENGTH = 500;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 254;

export const HABIT_ICONS = [
  '🎯', '🏃', '📚', '🧘', '💧', '💻', '🎨', '🎵',
  '✍️', '🌱', '💪', '🧠', '🍎', '😴', '🧹', '📝',
  '🚶', '🥗', '💊', '🙏',
];

export const HABIT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#10B981', '#3B82F6', '#06B6D4',
  '#84CC16', '#F97316',
];

export const WEEKDAYS = [
  { key: 1, label: 'Mon', labelJa: '月' },
  { key: 2, label: 'Tue', labelJa: '火' },
  { key: 3, label: 'Wed', labelJa: '水' },
  { key: 4, label: 'Thu', labelJa: '木' },
  { key: 5, label: 'Fri', labelJa: '金' },
  { key: 6, label: 'Sat', labelJa: '土' },
  { key: 0, label: 'Sun', labelJa: '日' },
];
