<p align="center">
  <img src="assets/icon.png" alt="PulseHabit" width="80" height="80" />
</p>

<h1 align="center">PulseHabit Habit Tracker</h1>
<p align="center"><strong>Offline-first habit tracker with cloud sync — zero data loss, even without internet.</strong></p>

---

## 1. Skills Demonstrated

| Skill | What Was Built |
|-------|---------------|
| **Offline-First Architecture** | All mutations write to local SQLite first (response under 10ms), then sync to Supabase asynchronously via a sync_queue table. Exponential backoff (1s x 2^n + jitter) with auto-retry, auto-purge after 5 failures. Zero data loss regardless of network state. |
| **Auth + Row Level Security (RLS)** | RLS policies applied to all 5 tables (habits, completions, streaks, sync_queue, sync_conflicts) at the PostgreSQL level. Direct ownership check via `auth.uid() = user_id` and indirect ownership for completions via the habits table. Even if the API key leaks, no user can access another user's data. |
| **Custom Design System** | 10 Neo-Brutalist components built from scratch without any UI library. Heavy borders (2-3px), offset shadows (3-4px), and monospace typography. Three theme modes: Light, Dark, and System. |
| **Sync Conflict Resolution** | Solved a production bug where local SQLite user_ids diverged from Supabase auth UIDs. The sync pipeline rewrites user_id before upload so RLS policies pass correctly. Version-based optimistic locking for conflict detection on the habits table. |
| **Security Hardening** | Cryptographic ID generation via `crypto.getRandomValues()`, parameterized queries (`?` bind variables) to prevent SQL injection, input validation (name 100 chars, description 500 chars, email 254 chars), debug log sanitization with truncated user IDs. |
| **Internationalization (i18n)** | Japanese/English switching via i18next + react-i18next + expo-localization. Device language auto-detection on first launch, bidirectional sync with Zustand's `settingsStore` (AsyncStorage persistence). Instant switching without app restart. |
| **Streak Calculation Engine** | Client-side computation of current streak, longest streak, and completion rate from the completions table. Updates instantly on tap, writes to SQLite, then syncs to cloud. Handles today/yesterday boundary edge cases. |
| **Haptic Feedback** | Seven types of haptic feedback via expo-haptics (Success, Warning, Error, Light, Medium, Heavy, Selection) applied contextually. Habit completion triggers Success; deletion triggers Warning. |
| **Notification Reminders** | Daily reminders via expo-notifications. Per-habit configurable reminder time (HH:MM format), notification tap navigates to habit detail screen. |

---

## 2. Tech Stack

| Category | Technology | Version | Why |
|----------|-----------|---------|-----|
| Framework | React Native | 0.81.4 | Cross-platform mobile for iOS and Android |
| Platform | Expo SDK | 54 | Managed workflow, OTA updates, development builds |
| Routing | Expo Router | 6.0.23 | File-based routing with typed routes |
| Language | TypeScript | 5.8.0 | Strict mode enabled, type safety across all source files |
| State | Zustand | 5.0.11 | Selector-based re-renders, no Provider wrapper needed |
| Local DB | expo-sqlite | 16.0.10 | Synchronous reads, offline persistence, ACID transactions |
| Backend | Supabase | 2.97.0 | Auth, PostgreSQL, Row Level Security |
| Design | Custom (Neo-Brutalist) | - | 10 hand-built components, dark mode support |
| i18n | i18next + react-i18next | 25.8.13 / 16.5.4 | Translation key namespaces, interpolation (`{{count}}`), language switching |
| Localization | expo-localization | 55.0.8 | Device language detection |
| Animation | react-native-reanimated | 4.1.1 | High-performance native thread animations |
| Fonts | Space Grotesk + Space Mono | - | Display + monospace pairing |
| Charts | react-native-gifted-charts | 1.4.74 | Bar charts on the stats screen |
| SVG | react-native-svg | 15.12.1 | Streak ring, dot grid, hatch patterns |

---

## 3. Architecture

```
+--------------------------------------------------------------+
|                      React Native UI Layer                    |
|           Neo-Brutalist Design System (10 components)        |
|           Expo Router v6 - useTheme() - useTranslation()     |
+--------------------------------------------------------------+
|                     Zustand State Layer                       |
|      authStore - habitStore - settingsStore - toastStore     |
|      AsyncStorage persistence (persist + createJSONStorage)  |
+-----------------------------+--------------------------------+
|   SQLite (local)            |        Sync Queue              |
|   All mutations             |   Exponential backoff: 1sx2^n  |
|   write here first          |   Max retries: 5               |
|   Response: <10ms           |   On exceed: auto-purge        |
+-----------------------------+--------------------------------+
|                    Supabase (cloud)                           |
|        Auth - PostgreSQL - RLS Policies (all 5 tables)       |
+--------------------------------------------------------------+
```

**Data flow**: User action -> Zustand -> SQLite (instant) -> sync_queue -> Supabase (async)

```
User taps "complete"
  -> SQLite INSERT (instant, <10ms)
  -> Enqueue to sync_queue table
  -> SyncManager detects auth session
  -> Process queue items sequentially
  -> Rewrite user_id to Supabase auth UID
  -> Supabase UPSERT with RLS validation
  -> On success: dequeue
  -> On failure: increment retry_count, backoff 1s x 2^n
  -> After 5 failures: auto-purge
```

**App startup flow**:
```
RootLayout
  -> Load fonts (Space Grotesk x 4 + Space Mono x 2)
  -> Hide splash screen
  -> GestureHandlerRootView
    -> SafeAreaProvider
      -> SQLiteProvider (DB: pulsehabit.db, onInit: migrateDatabase)
        -> AppContent
          |- Auth initialization (check Supabase session)
          |- LanguageSync (first launch: detect device lang; later: restore saved)
          |- SyncManager (trigger sync after auth, retry after 3s)
          |- ToastContainer
          +- Stack
            |- (tabs)  [authenticated]
            |- (auth)  [not authenticated]
            |- habit/[id] (card presentation)
            +- habit/new  (modal presentation)
```

---

## 4. Key Features

### 4.1 Offline-First Sync Pipeline

All operations (create habit, record completion, delete, edit) write to local SQLite first. The UI responds instantly regardless of network state, and sync runs in the background.

**Sync conflict resolution implementation** (`src/lib/sync.ts`):
```typescript
// Detect and rewrite user_id divergence between local SQLite and Supabase auth
if (session?.user?.id && data.user_id && data.user_id !== session.user.id) {
  data.user_id = session.user.id;
}
```

**Version-based conflict detection for the habits table**:
- On UPDATE, compare remote version against local version
- If remote is newer, record both versions in the `sync_conflicts` table
- On INSERT with duplicate key error (23505), fall back to UPSERT

**Completions table**: UPSERT on `habit_id,completed_date` pair. Prevents duplicate completions.

**Streaks table**: UPSERT on `habit_id`. Always overwrites with the latest calculated result.

**AppState foreground sync**: Automatically triggers sync every time the app returns to the foreground (AppState listener in the `useSync` hook).

### 4.2 Row Level Security (RLS)

```sql
-- Direct ownership (habits, sync_queue)
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

-- Indirect ownership (completions via parent habits table)
CREATE POLICY "Users can view own completions" ON completions
  FOR SELECT USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );
```

### 4.3 Neo-Brutalist Design System

Built 10 custom components without any UI library (no Material UI, NativeWind, etc.):

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| `OffsetShadow` | `OffsetShadow.tsx` | 51 | Animated shadow wrapper with press state |
| `BrutalCard` | `BrutalCard.tsx` | 46 | Container with 2-3px border + 3-4px offset shadow |
| `BrutalButton` | `BrutalButton.tsx` | 83 | Button with sm/md/lg sizes, loading state, haptic feedback |
| `BrutalInput` | `BrutalInput.tsx` | 81 | Text input with focus shadow color change, error display |
| `BrutalCheckbox` | `BrutalCheckbox.tsx` | 70 | Checkbox with SVG checkmark, scale animation |
| `BrutalTag` | `BrutalTag.tsx` | 51 | Tag badges with filled/outline variants, small size option |
| `BrutalProgress` | `BrutalProgress.tsx` | 61 | Progress bar with hatch pattern background, perfect day message |
| `StatBox` | `StatBox.tsx` | 53 | Numeric stat display with accent color, monospace label |
| `HatchPattern` | `HatchPattern.tsx` | 47 | SVG diagonal stripe pattern at 45 degrees, alternating colors |
| `BlackTag` | `BrutalTag.tsx` | - | Black background tag (included in BrutalTag file) |

**Theme system**: The `useTheme()` hook combines Zustand's `settingsStore.themeMode` with the system's `useColorScheme()`. Light and dark palettes each define 11 colors. Uses selector-based subscriptions to minimize re-renders without a Context Provider.

**Light palette**: bg=#FFFDF5 (cream), ink=#1A1A1A, card=#FFFFFF, border=#1A1A1A
**Dark palette**: bg=#0D0D0D, ink=#E8E4DC, card=#1A1A1A, border=#555555

### 4.4 Streak Calculation Engine

Implemented in the `calculateStreak()` function in `src/lib/database.ts`:

1. Build a Set of dates from completions
2. If today is not included, start checking from yesterday (streak continuity check)
3. Count consecutive days to compute current_streak
4. Sort all dates and find the longest consecutive run (longest_streak)
5. Write to streaks table via INSERT OR REPLACE
6. Enqueue to sync_queue

### 4.5 Internationalization (i18n)

**Supported languages**: Japanese (ja), English (en)
**Translation key count**: Approximately 100 keys per language across 12 namespaces (common, tabs, auth, today, habits, stats, profile, habit, categories, weekdays, weekdaysShort, months, date)

**Language sync flow**:
```
First launch
  -> Detect device language via expo-localization
  -> Japanese locale -> 'ja', everything else -> 'en'
  -> Persist to settingsStore.language (AsyncStorage)
  -> Apply via i18n.changeLanguage()

Subsequent launches
  -> Read settingsStore.language
  -> Apply via i18n.changeLanguage()

Manual switch
  -> JP/EN selector on the profile screen
  -> settingsStore.setLanguage()
  -> i18n.changeLanguage()
  -> Instant update without app restart
```

**Locale-aware formatting**: Calendar weekday names (`weekdaysShort.mon`), month names (`months.0` through `months.11`), and date formats (`date.monthYear`) all adapt to the selected language.

### 4.6 Habit Creation Wizard (3 Steps)

**Step 1 (Details)**: Name (required, max 100 chars), description (optional, max 500 chars), icon selection (20 emoji options), color selection (10 colors), category selection (6 types: Health, Exercise, Learning, Work, Mind, Other)

**Step 2 (Frequency)**: Three options: "Every Day", "Specific Days", and "Custom". Day selection UI with 7 toggle buttons when not daily.

**Step 3 (Reminder)**: Enable/disable daily reminder, time input (HH:MM), preview card showing the habit as it will appear.

### 4.7 Statistics and Analytics Screen

- **Completion rate**: Hero-sized (72pt) percentage display
- **Daily bar chart**: 7-day completion rate with weekday labels
- **28-day heatmap**: 4-level grid (0%=empty, >0%=light, >40%=medium, >70%=dark)
- **Top streaks**: Top 3 habits by current streak count

---

## 5. Database Design

### ER Diagram

```
+-------------+        +---------------+        +-------------+
|  habits     |--1:N--|  completions   |        |  streaks    |
|             |       |                |        |             |
| id (PK)     |       | id (PK)        |        | habit_id    |
| user_id     |       | habit_id (FK)  |        |  (PK, FK)   |
| name        |       | completed_date |        | current     |
| description |       | note           |        |  _streak    |
| icon        |       | photo_uri      |        | longest     |
| color       |       | created_at     |        |  _streak    |
| category    |       | synced_at      |        | last_date   |
| frequency   |       |                |        | updated_at  |
| target_days |       | UNIQUE(        |        +-------------+
| reminder_   |       |  habit_id,     |
|  time       |       |  completed_    |
| reminder_   |       |  date)         |
|  enabled    |       +----------------+
| is_archived |
| sort_order  |
| device_id   |                +------------------+
| version     |                | sync_conflicts    |
| created_at  |                |                   |
| updated_at  |                | id (PK)           |
| synced_at   |                | table_name        |
|             |                | record_id         |
| habits      |--1:1----------| local_data        |
|  (user_id)  |                | remote_data       |
+-------------+                | resolved          |
       |                       | created_at        |
       v                       +-------------------+
+---------------+
|  sync_queue    |
|                |
| id (PK)        |
| table_name     |
| operation      |
| data (JSON)    |
| retry_count    |
| max_retries    |
| created_at     |
+----------------+
```

### Indexes

```sql
CREATE INDEX idx_completions_date ON completions(completed_date);
CREATE INDEX idx_completions_habit ON completions(habit_id, completed_date);
CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_sync_queue_retry ON sync_queue(retry_count);
```

### TypeScript Interfaces

```typescript
// src/types/index.ts

type HabitCategory = 'health' | 'exercise' | 'learning' | 'work' | 'mind' | 'other';
type HabitFrequency = 'daily' | 'weekly' | 'custom';

interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  target_days: number[];       // [1,2,3,4,5] = Mon-Fri
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

interface Completion {
  id: string;
  habit_id: string;
  completed_date: string;     // YYYY-MM-DD
  note: string | null;
  photo_uri: string | null;
  created_at: string;
  synced_at: string | null;
}

interface Streak {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';
type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

interface SyncQueueItem {
  id: string;
  table_name: 'habits' | 'completions' | 'streaks';
  operation: SyncOperation;
  data: string;               // JSON string
  retry_count: number;
  max_retries: number;
  created_at: string;
}

interface SyncConflict {
  id: string;
  table_name: string;
  record_id: string;
  local_data: string;         // JSON string
  remote_data: string;        // JSON string
  resolved: boolean;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface HabitWithStreak extends Habit {
  streak: Streak;
  isCompletedToday: boolean;
}
```

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| `UNIQUE(habit_id, completed_date)` | Prevents duplicate completions. Essential for idempotent sync |
| Streaks as separate table | Avoids expensive recalculation on every read. Updated on write |
| sync_queue stores JSON | Queues any table's mutations without schema coupling |
| Version column on habits | Optimistic locking for multi-device conflict resolution |
| All FKs `ON DELETE CASCADE` | Account deletion automatically cleans all related data |
| `lower(hex(randomblob(16)))` | Cryptographically random 32-character hex string as SQLite default ID |

---

## 6. Security Design

### Audit Results

| Category | Status | Details |
|----------|--------|---------|
| Hardcoded secrets / API keys | **PASS** | All credentials via environment variables. `.env` never committed |
| SQL injection | **PASS** | All queries use parameterized bind variables (`?`) |
| XSS | **N/A** | React Native `Text` does not render HTML |
| Row Level Security | **PASS** | All 5 tables enforce `auth.uid() = user_id` at PostgreSQL level |
| ID generation | **PASS** | `crypto.getRandomValues()` for cryptographically secure UUIDs |
| Input validation | **PASS** | Length limits on all user inputs (name 100 chars, email 254 chars, password min 8 chars + uppercase + number) |
| Password policy | **PASS** | Minimum 8 characters + at least one uppercase letter + at least one number required at sign-up |
| Debug log sanitization | **PASS** | User IDs truncated to 8 characters in dev logs. No PII in production |
| PRAGMA injection prevention | **PASS** | `DB_VERSION` cast via `Number()` with integer validation before PRAGMA assignment |

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized data access | RLS policies on all 5 tables (enforced at PostgreSQL level) |
| Session hijacking | Supabase Auth with JWT refresh tokens, session expiry |
| SQL injection (local) | Parameterized queries via expo-sqlite bind variables |
| Predictable IDs | `crypto.getRandomValues()` instead of `Math.random()` |
| Input overflow | Validation limits: name 100 chars, description 500 chars, email 254 chars |
| Data loss on poor connectivity | Local-first SQLite + async sync queue with exponential backoff |

### Typed Error Hierarchy

```typescript
// src/lib/errors.ts
class AppError extends Error {
  type: 'SYNC_ERROR' | 'DATABASE_ERROR' | 'NETWORK_ERROR' | 'AUTH_ERROR';
}
class SyncError extends AppError {}      // Sync pipeline
class DatabaseError extends AppError {}  // SQLite transactions
class NetworkError extends AppError {}   // Network failures
```

The `withDatabaseTransaction()` function manages `BEGIN`/`COMMIT`/`ROLLBACK` and throws `DatabaseError` on failure.

---

## 7. Project Structure

```
src/                                           Lines
|-- app/                                       -- Expo Router screens
|   |-- _layout.tsx                          (135)  Root layout + LanguageSync + SyncManager
|   |-- (auth)/
|   |   |-- _layout.tsx                      ( 10)  Auth stack layout
|   |   |-- sign-in.tsx                      (113)  Sign-in screen
|   |   +-- sign-up.tsx                      (104)  Sign-up screen
|   |-- (tabs)/
|   |   |-- _layout.tsx                      ( 71)  4-tab navigation
|   |   |-- index.tsx                        (130)  Today view + FAB
|   |   |-- habits.tsx                       ( 82)  All habits list
|   |   |-- stats.tsx                        (197)  Statistics + heatmap
|   |   +-- profile.tsx                      (196)  Settings + theme + language toggle
|   +-- habit/
|       |-- new.tsx                           (224)  3-step creation wizard
|       +-- [id].tsx                          (267)  Habit detail + monthly calendar
|-- components/
|   |-- brutal/                              -- Design system (10 components)
|   |   |-- index.ts                         ( 10)  Barrel exports
|   |   |-- OffsetShadow.tsx                 ( 51)  Animated shadow wrapper
|   |   |-- BrutalCard.tsx                   ( 46)  Card container
|   |   |-- BrutalButton.tsx                 ( 83)  Button (3 sizes + loading)
|   |   |-- BrutalInput.tsx                  ( 81)  Text input + error display
|   |   |-- BrutalCheckbox.tsx               ( 70)  Checkbox + animation
|   |   |-- BrutalTag.tsx                    ( 51)  Tag + BlackTag
|   |   |-- BrutalProgress.tsx               ( 61)  Progress bar
|   |   |-- StatBox.tsx                      ( 53)  Numeric stat display
|   |   +-- HatchPattern.tsx                 ( 47)  SVG diagonal pattern
|   |-- habits/
|   |   |-- BrutalHabitCard.tsx              (105)  Habit card (streak + category)
|   |   +-- StreakRing.tsx                   ( 72)  SVG circular progress
|   +-- common/
|       |-- LoadingSpinner.tsx               ( 25)  Loading spinner
|       +-- Toast.tsx                        ( 50)  Toast notifications
|-- constants/
|   |-- theme.ts                             (116)  Palettes, tokens, useTheme()
|   |-- config.ts                            ( 39)  App constants + validation limits
|   +-- categories.ts                        ( 50)  6 category definitions
|-- i18n/
|   |-- index.ts                             ( 33)  i18next init + device language detection
|   +-- locales/
|       |-- ja.json                          (197)  Japanese translations
|       +-- en.json                          (197)  English translations
|-- stores/
|   |-- authStore.ts                         (111)  Auth state + Supabase session management
|   |-- habitStore.ts                        (140)  Habits, completions, streaks state
|   |-- settingsStore.ts                     ( 47)  Theme, language, notification settings
|   +-- toastStore.ts                        ( 37)  Toast notification queue
|-- hooks/
|   |-- useHabits.ts                         (124)  Habit CRUD + completion toggle
|   |-- useStreak.ts                         ( 42)  Streak retrieval + top streaks
|   |-- useSync.ts                           ( 59)  Sync execution + AppState monitoring
|   +-- useNotifications.ts                  ( 44)  Reminder notification management
|-- lib/
|   |-- database.ts                          (630)  SQLite CRUD + migration + streak calculation
|   |-- sync.ts                              (249)  Sync pipeline + conflict resolution
|   |-- supabase.ts                          ( 25)  Supabase client initialization
|   |-- errors.ts                            ( 70)  Typed error hierarchy + transactions
|   |-- haptics.ts                           ( 29)  Haptic feedback (7 types)
|   +-- notifications.ts                     ( 49)  Push notification scheduling
|-- types/
|   +-- index.ts                             (160)  All TypeScript interfaces
|-- dev/
|   +-- seed.ts                              (212)  Development seed data (5 habits)
+-- __tests__/
    |-- habitStore.test.ts                   (195)  Zustand store tests
    |-- streak.test.ts                       (127)  Streak calculation tests
    +-- sync.test.ts                         ( 59)  Sync pipeline tests
                                           -----
                                    Total: 5,375 lines
```

---

## 8. Setup

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- Expo CLI (via `npx expo`)
- iOS: Xcode 15 or later (for simulator)
- Android: Android Studio (for emulator)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/mer-prog/pulse-habit.git
cd pulse-habit

# 2. Install dependencies
npm install

# 3. Configure environment (optional -- works offline without Supabase)
cp .env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# 4. Start the dev server
npx expo start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | No | Supabase project URL (`https://<id>.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase publishable anon key |

Both are optional. Without them, the app runs in offline-only mode with full functionality using local SQLite.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Start web version |
| `npm test` | Run Jest test suite |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript strict type check |

---

## 9. Design Decisions

| Decision | Rationale |
|----------|-----------|
| **SQLite over AsyncStorage** | Relational queries (JOINs for streak calculation), faster reads, ACID transaction support |
| **Zustand over Redux/Context** | 70% less boilerplate, selector-based re-renders, no Provider wrapper needed |
| **Supabase over Firebase** | PostgreSQL (RLS, proper relational model), open-source, predictable pricing |
| **Inline styles over NativeWind** | Full control over Neo-Brutalist design tokens (heavy borders, offset shadows). NativeWind conflicted with these patterns |
| **useTheme() hook over Context** | Zustand selector subscribes only to `themeMode`, avoiding re-rendering the entire tree |
| **Queue-based sync over real-time** | Resilient to network interruptions. WebSocket fails silently on disconnect |
| **i18next over expo-localization alone** | Translation key namespaces, interpolation (`{{count}} days`), pluralization support. expo-localization used only for locale detection |
| **4 separate stores (auth/habit/settings/toast)** | Separation of concerns. Auth changes do not trigger habit store re-renders |
| **Separate streaks table** | Avoids recalculating all completions on every read. Updated incrementally on write |

---

## 10. Running Costs

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Supabase | Free tier | $0 |
| Expo | Free tier | $0 |
| Apple Developer Program | - | $99/year (only for App Store publishing) |
| Google Play Console | - | $25 one-time (only for Play Store publishing) |

**Total running cost: $0/month**

Supabase free tier includes: 500MB database, 1GB transfer, 50,000 rows, 50,000 monthly active users. More than sufficient for personal use and small teams.

When Supabase is not configured, the app operates entirely on local SQLite, requiring no cloud services while retaining full functionality.

---

## 11. Author

<p align="center">
  Built by <a href="https://github.com/mer-prog">mer-prog</a>
</p>

---

<p align="center">
  <a href="./README.md">English README</a> · <a href="./README_JP.md">Japanese README</a>
</p>
