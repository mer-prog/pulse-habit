# 🟠 PulseHabit — Build Better Habits, Even Offline

## Summary

- **What**: A habit tracker that works without internet and syncs your data to the cloud when you're back online — no data loss, no waiting.
- **Who**: Mobile app founders, health-tech startups, and anyone who needs a production-grade React Native reference with offline-first architecture.
- **Tech**: React Native · Expo SDK 54 · TypeScript · Zustand · SQLite · Supabase · Row Level Security

---

## Links

| | |
|---|---|
| **📱 Live Showcase** | [mer-prog.github.io/pulse-habit/docs/showcase.html](https://mer-prog.github.io/pulse-habit/docs/showcase.html) |
| **💻 Source Code** | [github.com/mer-prog/pulse-habit](https://github.com/mer-prog/pulse-habit) |
| **🏗️ Running Cost** | **$0/month** — Supabase Free Tier (50k requests, 500MB storage) |

> **Note**: This is a portfolio project. The showcase page includes mock screenshots and a simulated store listing to demonstrate the full product vision.

---

## Skills Demonstrated

| Skill | What I Built |
|-------|-------------|
| **Offline-First Architecture** | App works fully without internet. All mutations write to local SQLite first, then sync to Supabase via a queue with exponential backoff and auto-purge. Zero data loss even on spotty connections. |
| **Auth + Row Level Security** | Every user's data is isolated at the database level. Supabase Auth handles sessions, and PostgreSQL RLS policies ensure no user can ever read or modify another user's habits — enforced server-side, not client-side. |
| **Custom Design System** | Built a 10-component Neo-Brutalist design system from scratch (no UI library). Heavy borders, offset shadows, monospace type. Full dark mode with Light/Dark/System toggle. |
| **Sync Conflict Resolution** | Solved a real-world bug where local SQLite user IDs diverged from Supabase auth UIDs. Built user_id rewriting in the sync pipeline so RLS policies pass correctly. |
| **File-Based Routing + State** | Expo Router v6 for type-safe navigation, Zustand for minimal-boilerplate state management with persist middleware for settings. |

---

## Architecture

```
┌──────────────────────────────────────┐
│          React Native UI             │
│   Neo-Brutalist Design System (10)   │
│   Expo Router v6 · useTheme()        │
├──────────────────────────────────────┤
│        Zustand State Layer           │
│  authStore · habitStore · settings   │
├─────────────────┬────────────────────┤
│   SQLite (local) │  Sync Queue       │
│   All mutations  │  retry + purge    │
│   go here first  │  backoff: 1s×2^n  │
├─────────────────┴────────────────────┤
│          Supabase (cloud)            │
│   Auth · PostgreSQL · RLS Policies   │
└──────────────────────────────────────┘
```

**Data flow**: UI → Zustand → SQLite (instant) → Sync Queue → Supabase (async). The user never waits for the network.

---

## Key Features

### 1. Offline-First Sync Pipeline

**What it does**: Users can create habits, mark completions, and view stats entirely offline. When connectivity returns, everything syncs automatically.

**How it works**:

```
User taps "complete" 
  → SQLite INSERT (instant, <10ms)
  → Enqueue to sync_queue table
  → SyncManager detects auth session
  → Process queue items sequentially
  → Supabase INSERT with RLS validation
  → On success: dequeue
  → On failure: increment retry, backoff 1s × 2^n
  → After 5 failures: auto-purge stale items
```

**Technical detail**: The sync pipeline validates `session.user.id` before every batch and rewrites `user_id` fields in the payload to match the authenticated UID. This was necessary because SQLite stores a locally-generated UUID during guest mode, which diverges from `auth.uid()` after sign-up. Without this rewrite, RLS policies reject the INSERT.

```typescript
// sync.ts — user_id rewrite before Supabase INSERT
if (data.user_id && data.user_id !== session.user.id) {
  data.user_id = session.user.id;
}
```

---

### 2. Row Level Security (RLS)

**What it does**: Even if someone intercepts the API key, they cannot access another user's data. Security is enforced at the PostgreSQL level.

**How it works**: Every table has RLS policies that check `auth.uid() = user_id`. Completions and streaks use subqueries to verify ownership through the parent habit.

```sql
-- Direct ownership (habits, sync_queue)
CREATE POLICY "Users can view own habits" ON habits 
  FOR SELECT USING (auth.uid() = user_id);

-- Indirect ownership (completions via habit)
CREATE POLICY "Users can view own completions" ON completions 
  FOR SELECT USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );
```

---

### 3. Neo-Brutalist Design System

**What it does**: A distinctive, memorable UI that stands out from generic Material/Cupertino apps. Full dark mode support with zero flash on theme switch.

**Components built** (10 total):

| Component | Purpose |
|-----------|---------|
| `BrutalCard` | Container with 3px border + 4px offset shadow |
| `BrutalButton` | Pressable with translate animation on press |
| `BrutalInput` | Text input with heavy border styling |
| `BrutalCheckbox` | Habit completion toggle with haptic feedback |
| `BrutalTag` | Category badges with color variants |
| `BrutalProgress` | Progress bar with border styling |
| `StatBox` | Numeric stat display (streaks, rates) |
| `OffsetShadow` | Reusable shadow wrapper |
| `HatchPattern` | SVG diagonal line pattern for backgrounds |
| `BrutalHabitCard` | Composite habit card with streak ring |

**Theme system**: `useTheme()` hook reads from Zustand's `settingsStore` (persisted via AsyncStorage) and combines with `useColorScheme()` for system-preference support. Each component destructures `const { colors, isDark } = useTheme()` — no Context provider needed, no unnecessary re-renders.

---

### 4. Streak Tracking Engine

**What it does**: Shows current streak, longest streak, and completion rate in real-time. Users see their progress update the instant they tap.

**How it works**: Streak calculation runs client-side against SQLite for instant feedback. When a completion is toggled:

1. INSERT/DELETE in `completions` table
2. Recalculate streak by walking backwards from today through `completed_date` entries
3. UPDATE `streaks` table with new values
4. Enqueue both operations to sync queue

---

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| Framework | React Native 0.81 | Cross-platform mobile (iOS + Android) |
| Platform | Expo SDK 54 | Build tooling, OTA updates, managed workflow |
| Navigation | Expo Router v6 | File-based routing with type safety |
| Language | TypeScript (strict) | Type safety across 47 source files |
| State | Zustand | Minimal boilerplate, selector-based re-renders |
| Local DB | expo-sqlite | Synchronous reads, offline persistence |
| Backend | Supabase | Auth, PostgreSQL, Row Level Security |
| Design | Custom (Neo-Brutalist) | 10 hand-built components, dark mode |
| Fonts | Space Grotesk + Space Mono | Display + monospace pairing |

---

## Project Structure

```
src/                          # 4,805 lines across 47 files
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # Root layout + SyncManager
│   ├── (auth)/               # Sign in / Sign up
│   ├── (tabs)/               # 4-tab navigation
│   │   ├── index.tsx         # Today view + FAB
│   │   ├── habits.tsx        # All habits list
│   │   ├── stats.tsx         # Statistics + calendar
│   │   └── profile.tsx       # Settings + theme toggle
│   └── habit/
│       ├── new.tsx           # 3-step creation wizard
│       └── [id].tsx          # Detail + monthly calendar
├── components/
│   ├── brutal/               # Design system (10 components)
│   ├── habits/               # BrutalHabitCard, StreakRing
│   └── common/               # LoadingSpinner
├── constants/
│   ├── theme.ts              # Palettes, tokens, useTheme()
│   └── config.ts             # App constants
├── stores/                   # Zustand stores (3)
├── hooks/                    # useHabits, useStreak, useNotifications
├── lib/
│   ├── database.ts           # SQLite CRUD (619 lines)
│   ├── sync.ts               # Sync pipeline (244 lines)
│   └── supabase.ts           # Client initialization
└── types/index.ts            # TypeScript interfaces
```

---

## Database Design

### ER Diagram

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  habits   │──1:N──│ completions  │       │ streaks  │
│           │       │              │       │          │
│ id (PK)   │       │ habit_id(FK) │       │habit_id  │
│ user_id   │       │ completed_   │       │ (PK,FK)  │
│ name      │       │   date       │       │ current_ │
│ frequency │       │ note         │       │  streak  │
│ icon      │       └──────────────┘       │ longest_ │
│ color     │──1:1──────────────────────────│  streak  │
│ version   │                              └──────────┘
└──────────┘
     │
     │ (user_id)
     ▼
┌──────────────┐    ┌────────────────┐
│  sync_queue  │    │ sync_conflicts │
│              │    │                │
│ table_name   │    │ local_data     │
│ operation    │    │ remote_data    │
│ data (JSONB) │    │ resolved       │
│ retry_count  │    └────────────────┘
└──────────────┘
```

### Schema (TypeScript)

```typescript
interface Habit {
  id: string;              // UUID, PK
  user_id: string;         // FK → auth.users, RLS anchor
  name: string;
  icon: string;            // Emoji
  color: string;           // Hex
  category: HabitCategory; // 'health' | 'exercise' | 'learning' | ...
  frequency: 'daily' | 'weekly' | 'custom';
  target_days: number[];   // [1,2,3,4,5] = Mon-Fri
  reminder_time: string | null;
  is_archived: boolean;
  version: number;         // Optimistic locking
  device_id: string | null;
}

interface Completion {
  id: string;
  habit_id: string;        // FK → habits
  completed_date: string;  // YYYY-MM-DD, UNIQUE with habit_id
  note: string | null;
}

interface Streak {
  habit_id: string;        // PK + FK → habits
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}
```

### Design Rationale

| Decision | Rationale |
|----------|-----------|
| `completions` uses `UNIQUE(habit_id, completed_date)` | Prevents duplicate completions on the same day — critical for idempotent sync |
| `streaks` is a separate table (not computed) | Avoids expensive recalculation on every read; updated on write |
| `sync_queue` stores `JSONB data` | Flexible enough to queue any table's mutations without schema coupling |
| `version` column on `habits` | Enables optimistic locking for future multi-device conflict resolution |
| All FKs use `ON DELETE CASCADE` | When a user deletes their account, all related data is automatically cleaned |

---

## Security Design

### Current Implementation

| Threat | Mitigation |
|--------|-----------|
| Unauthorized data access | RLS policies on all 5 tables — enforced at PostgreSQL level |
| Session hijacking | Supabase Auth with JWT refresh tokens, session expiry |
| SQL injection (local) | Parameterized queries via expo-sqlite bind variables |
| Data loss on poor connectivity | Local-first SQLite + async sync queue with retry |

### Production Hardening Plan

| Enhancement | Status |
|------------|--------|
| Rate limiting on auth endpoints | Planned — Supabase built-in rate limits available |
| Email verification flow | Planned — Supabase supports, not yet configured |
| Certificate pinning | Planned — for production builds |
| Biometric app lock | Planned — expo-local-authentication |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **SQLite over AsyncStorage** | Relational queries (JOINs for streak calculation), faster reads, ACID transactions |
| **Zustand over Redux/Context** | 70% less boilerplate, selector-based re-renders, no Provider wrapper needed |
| **Supabase over Firebase** | PostgreSQL (RLS, proper relational model), open-source, predictable pricing |
| **Inline styles over NativeWind** | Full control for Neo-Brutalist design tokens; NativeWind's utility classes conflicted with heavy border/shadow patterns |
| **useTheme() hook over Context** | Zustand selector subscribes only to `themeMode` — avoids re-rendering the entire tree on theme change |
| **Queue-based sync over real-time** | Resilient to network interruptions; real-time (WebSocket) would fail silently on disconnect |

---

## Author

Built by [mer-prog](https://github.com/mer-prog)
