<p align="center">
  <img src="assets/icon.png" alt="PulseHabit" width="80" height="80" />
</p>

<h1 align="center">PulseHabit</h1>
<p align="center"><strong>Offline-first habit tracker with cloud sync — zero data loss, even without internet.</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo_SDK-54-000020?style=flat-square&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-RLS-3ECF8E?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Cost-%240%2Fmo-brightgreen?style=flat-square" alt="Cost" />
</p>

<p align="center">
  <a href="https://mer-prog.github.io/pulse-habit/docs/showcase.html"><strong>Live Showcase</strong></a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#security">Security</a> ·
  <a href="./README_JP.md">日本語</a>
</p>

---

## Why This Project Exists

Most habit apps break in the real world — subway commutes, airplane mode, spotty Wi-Fi. PulseHabit was built to solve that. Every mutation writes to SQLite first and syncs to Supabase asynchronously, so the UI responds in under 10ms regardless of network state.

This isn't a tutorial project. It solves a real-world sync bug where local SQLite user IDs diverge from Supabase auth UIDs after sign-up — a problem that silently breaks Row Level Security policies in production.

**Who this is for**: Mobile app founders, health-tech startups, and engineers who need a production-grade React Native reference with offline-first architecture.

---

## Demo

> **[Live Showcase Page](https://mer-prog.github.io/pulse-habit/docs/showcase.html)** — Interactive mockups, feature walkthrough, and simulated store listing.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   TODAY.     │  │   HABITS.   │  │   STATS.    │  │   PROFILE   │
│             │  │             │  │             │  │             │
│  ◉ 3/5     │  │ 01 🏃 Jog  │  │  ▓▓▓▓░ 78% │  │  ○ mer-prog │
│  ████░░░░░ │  │ 02 📚 Read │  │             │  │  Theme: ◐   │
│             │  │ 03 🧘 Med  │  │  Streak: 45 │  │  Sync: ✓    │
│  🏃 Jog  ✓ │  │ 04 💧 H2O  │  │  Best: 45d  │  │             │
│  📚 Read ✓ │  │ 05 💻 Code │  │  Total: 847 │  │  Sign Out → │
│  🧘 Med  ✓ │  │             │  │             │  │             │
│  💧 H2O  · │  │  🔥23  🔥15 │  │  ▪▪▫▪▪▪▫   │  │             │
│  💻 Code · │  │             │  │  Feb 2026   │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/mer-prog/pulse-habit.git
cd pulse-habit

# 2. Install
npm install

# 3. Configure environment (optional — works offline without Supabase)
cp .env.example .env
# Edit .env with your Supabase project URL and anon key

# 4. Run
npx expo start
```

> **No Supabase account?** The app works fully offline with local SQLite. Cloud sync activates automatically when you add Supabase credentials.

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

## Skills Demonstrated

| Skill | What I Built |
|-------|-------------|
| **Offline-First Architecture** | All mutations write to local SQLite first (<10ms), then sync to Supabase via a queue with exponential backoff and auto-purge. Zero data loss on any connection state. |
| **Auth + Row Level Security** | Every user's data is isolated at the PostgreSQL level. Even if the API key leaks, no user can read another user's data — enforced server-side, not client-side. |
| **Custom Design System** | 10-component Neo-Brutalist system built from scratch (no UI library). Heavy borders, offset shadows, monospace type. Full dark mode with Light/Dark/System toggle. |
| **Sync Conflict Resolution** | Solved a real production bug where local SQLite user IDs diverged from Supabase auth UIDs. Built user_id rewriting in the sync pipeline so RLS policies pass correctly. |
| **Security Hardening** | Cryptographic ID generation, input validation with length limits, debug log sanitization, PRAGMA injection prevention. Full audit documented below. |
| **Internationalization (i18n)** | i18next + expo-localization for Japanese/English switching, device language auto-detection, bidirectional sync with Zustand persisted settings. |

---

## Architecture

```
┌─────────────────────────────────────────┐
│           React Native UI               │
│    Neo-Brutalist Design System (10)     │
│    Expo Router v6 · useTheme()          │
├─────────────────────────────────────────┤
│          Zustand State Layer            │
│   authStore · habitStore · settings     │
├───────────────────┬─────────────────────┤
│  SQLite (local)   │   Sync Queue        │
│  All mutations    │   retry + purge     │
│  go here first    │   backoff: 1s×2^n   │
├───────────────────┴─────────────────────┤
│           Supabase (cloud)              │
│    Auth · PostgreSQL · RLS Policies     │
└─────────────────────────────────────────┘
```

**Data flow**: UI → Zustand → SQLite (instant) → Sync Queue → Supabase (async). The user never waits for the network.

---

## Key Features

### 1. Offline-First Sync Pipeline

Users can create habits, mark completions, and view stats entirely offline. When connectivity returns, everything syncs automatically.

```
User taps "complete"
  → SQLite INSERT (instant, <10ms)
  → Enqueue to sync_queue table
  → SyncManager detects auth session
  → Process queue items sequentially
  → Supabase UPSERT with RLS validation
  → On success: dequeue
  → On failure: increment retry, backoff 1s × 2^n
  → After 5 failures: auto-purge stale items
```

**The hard part**: SQLite stores a locally-generated UUID during offline mode. After sign-up, this diverges from `auth.uid()`. Without a rewrite, RLS policies reject every INSERT. The sync pipeline solves this:

```typescript
// sync.ts — user_id rewrite before Supabase INSERT
if (data.user_id && data.user_id !== session.user.id) {
  data.user_id = session.user.id;
}
```

### 2. Row Level Security (RLS)

Even if someone intercepts the API key, they cannot access another user's data. Security is enforced at the PostgreSQL level.

```sql
-- Direct ownership (habits, sync_queue)
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

-- Indirect ownership (completions via parent habit)
CREATE POLICY "Users can view own completions" ON completions
  FOR SELECT USING (
    habit_id IN (SELECT id FROM habits WHERE user_id = auth.uid())
  );
```

### 3. Neo-Brutalist Design System

A distinctive, memorable UI that stands out from generic Material/Cupertino apps. Full dark mode with zero flash on theme switch.

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

**Theme system**: `useTheme()` reads from Zustand's `settingsStore` (persisted via AsyncStorage) combined with `useColorScheme()` for system-preference support. No Context provider needed — no unnecessary re-renders.

### 4. Streak Tracking Engine

Current streak, longest streak, and completion rate update the instant a user taps. Calculation runs client-side against SQLite for immediate feedback, then syncs to the cloud.

### 5. Internationalization (i18n)

Full Japanese/English language support with instant switching — no app restart needed.

- **Device language auto-detection** via `expo-localization` on first launch (Japanese locale → `ja`, everything else → `en`)
- **Manual switching** from the Settings screen with JP/EN toggle buttons (Neo-Brutalist styled)
- **Bidirectional sync** between i18next and Zustand `settingsStore` (persisted to AsyncStorage)
- **Locale-aware formatting** — dates, calendar weekday/month names, and relative streak text adapt to the selected language

---

## Tech Stack

| Category | Technology | Why |
|----------|-----------|-----|
| Framework | React Native 0.81 | Cross-platform mobile (iOS + Android) |
| Platform | Expo SDK 54 | Managed workflow, OTA updates, dev builds |
| Navigation | Expo Router v6 | File-based routing with type safety |
| Language | TypeScript (strict) | Type safety across all source files |
| State | Zustand | Selector-based re-renders, no Provider wrapper |
| Local DB | expo-sqlite | Synchronous reads, offline persistence, ACID |
| Backend | Supabase | Auth, PostgreSQL, Row Level Security |
| Design | Custom (Neo-Brutalist) | 10 hand-built components, dark mode |
| i18n | i18next + react-i18next | Translation keys, interpolation, namespace separation |
| Localization | expo-localization | Device language detection for default locale |
| Fonts | Space Grotesk + Space Mono | Display + monospace pairing |

---

## Project Structure

```
src/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root layout + SyncManager
│   ├── (auth)/                 # Sign in / Sign up
│   ├── (tabs)/                 # 4-tab navigation
│   │   ├── index.tsx           # Today view + FAB
│   │   ├── habits.tsx          # All habits list
│   │   ├── stats.tsx           # Statistics + calendar heatmap
│   │   └── profile.tsx         # Settings + theme toggle
│   └── habit/
│       ├── new.tsx             # 3-step creation wizard
│       └── [id].tsx            # Detail + monthly calendar
├── components/
│   ├── brutal/                 # Design system (10 components)
│   ├── habits/                 # BrutalHabitCard, StreakRing
│   └── common/                 # LoadingSpinner, Toast
├── constants/
│   ├── theme.ts                # Palettes, tokens, useTheme()
│   └── config.ts               # App constants + validation limits
├── i18n/
│   ├── index.ts                # i18next initialization + device language detection
│   └── locales/                # Translation JSON files (ja.json, en.json)
├── stores/                     # Zustand stores (auth, habit, settings, toast)
├── hooks/                      # useHabits, useStreak, useSync, useNotifications
├── lib/
│   ├── database.ts             # SQLite CRUD + migration
│   ├── sync.ts                 # Sync pipeline + conflict resolution
│   ├── supabase.ts             # Client initialization
│   └── errors.ts               # Typed error hierarchy
├── types/index.ts              # TypeScript interfaces
└── dev/seed.ts                 # Development seed data
```

---

## Database Design

```
┌───────────┐        ┌──────────────┐        ┌───────────┐
│  habits    │──1:N──│ completions   │        │  streaks   │
│            │       │               │        │            │
│ id (PK)    │       │ habit_id (FK) │        │ habit_id   │
│ user_id    │       │ completed_date│        │  (PK, FK)  │
│ name       │       │ note          │        │ current    │
│ frequency  │       └───────────────┘        │ longest    │
│ icon/color │──1:1───────────────────────────│ last_date  │
│ version    │                                └────────────┘
└────────────┘
       │ (user_id)
       ▼
┌──────────────┐     ┌────────────────┐
│  sync_queue   │     │ sync_conflicts  │
│               │     │                 │
│ table_name    │     │ local_data      │
│ operation     │     │ remote_data     │
│ data (JSONB)  │     │ resolved        │
│ retry_count   │     └─────────────────┘
└───────────────┘
```

| Decision | Rationale |
|----------|-----------|
| `UNIQUE(habit_id, completed_date)` | Prevents duplicate completions — critical for idempotent sync |
| `streaks` as separate table | Avoids expensive recalculation on every read; updated on write |
| `sync_queue` stores JSONB | Queues any table's mutations without schema coupling |
| `version` on habits | Optimistic locking for multi-device conflict resolution |
| All FKs `ON DELETE CASCADE` | Account deletion automatically cleans all related data |

---

<a id="security"></a>

## Security

### Audit Results

A full security audit was conducted on this codebase. Results:

| Category | Status | Details |
|----------|--------|---------|
| Hardcoded secrets / API keys | **PASS** | All credentials via environment variables; `.env` never committed |
| SQL injection | **PASS** | All queries use parameterized bind variables (`?`) |
| XSS | **N/A** | React Native `Text` does not render HTML |
| Row Level Security | **PASS** | All 5 tables enforce `auth.uid() = user_id` at PostgreSQL level |
| ID generation | **PASS** | `crypto.getRandomValues()` for cryptographically secure UUIDs |
| Input validation | **PASS** | Length limits on all user inputs (name, email, habit fields) |
| Password policy | **PASS** | Min 8 chars + uppercase + number required at sign-up |
| Debug log sanitization | **PASS** | User IDs truncated in dev logs; no PII in production |
| Git history | **PASS** | No `.env` files ever committed; secrets never in history |
| Dependency vulnerabilities | **NOTE** | Dev-only (jest/babel); no production impact |

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized data access | RLS policies on all 5 tables — enforced at PostgreSQL level |
| Session hijacking | Supabase Auth with JWT refresh tokens, session expiry |
| SQL injection (local) | Parameterized queries via expo-sqlite bind variables |
| Predictable IDs | `crypto.getRandomValues()` instead of `Math.random()` |
| Input overflow | Validation limits: name 100 chars, description 500 chars, email 254 chars |
| Data loss on poor connectivity | Local-first SQLite + async sync queue with exponential backoff |

### Production Hardening Roadmap

| Enhancement | Status |
|------------|--------|
| Rate limiting on auth endpoints | Planned — Supabase built-in |
| Email verification flow | Planned — Supabase supported |
| Certificate pinning | Planned — production builds |
| Biometric app lock | Planned — expo-local-authentication |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **SQLite over AsyncStorage** | Relational queries (JOINs for streak calc), faster reads, ACID transactions |
| **Zustand over Redux/Context** | 70% less boilerplate, selector-based re-renders, no Provider wrapper |
| **Supabase over Firebase** | PostgreSQL (RLS, proper relational model), open-source, predictable pricing |
| **Inline styles over NativeWind** | Full control for Neo-Brutalist design tokens; NativeWind conflicted with heavy border/shadow patterns |
| **useTheme() hook over Context** | Zustand selector subscribes only to `themeMode` — avoids re-rendering the entire tree |
| **Queue-based sync over real-time** | Resilient to network interruptions; WebSocket fails silently on disconnect |
| **i18next over expo-localization alone** | Translation key namespaces, interpolation (`{{count}} days`), pluralization support. expo-localization used only for locale detection |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | No | Supabase project URL (`https://<id>.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase publishable anon key |

> Both are optional. Without them, the app runs in offline-only mode with full functionality.

---

## License

[MIT](./LICENSE) — free to use, modify, and distribute.

---

<p align="center">
  Built by <a href="https://github.com/mer-prog">mer-prog</a>
</p>
