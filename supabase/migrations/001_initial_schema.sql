-- PulseHabit: Supabase PostgreSQL Schema
-- Status: ALREADY EXECUTED on Supabase Dashboard
-- This file is for reference and version control only.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎯',
  color TEXT NOT NULL DEFAULT '#6366F1',
  category TEXT NOT NULL DEFAULT 'general',
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_days JSONB DEFAULT '[]'::jsonb,
  reminder_time TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  device_id TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  note TEXT,
  photo_uri TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  UNIQUE(habit_id, completed_date)
);

CREATE TABLE IF NOT EXISTS streaks (
  habit_id UUID PRIMARY KEY REFERENCES habits(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  data JSONB NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  local_data JSONB NOT NULL,
  remote_data JSONB NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON completions(habit_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user ON sync_conflicts(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

CREATE TRIGGER habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own completions" ON completions FOR SELECT USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own completions" ON completions FOR INSERT WITH CHECK (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own completions" ON completions FOR UPDATE USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own completions" ON completions FOR DELETE USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own streaks" ON streaks FOR SELECT USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own streaks" ON streaks FOR INSERT WITH CHECK (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own streaks" ON streaks FOR UPDATE USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own streaks" ON streaks FOR DELETE USING (habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own sync_queue" ON sync_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own sync_conflicts" ON sync_conflicts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
