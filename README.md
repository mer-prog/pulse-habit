# 🟠 PulseHabit

**Build better habits, one day at a time.**

A Neo-Brutalist habit tracker built with React Native (Expo) and Supabase. Offline-first architecture with cloud sync, streak tracking, and a bold design system.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Navigation | Expo Router v6 (file-based) |
| State | Zustand |
| Local DB | expo-sqlite |
| Cloud | Supabase (Auth + PostgreSQL) |
| Styling | Custom design system (Neo-Brutalist) |
| Fonts | Space Grotesk + Space Mono |
| Language | TypeScript (strict mode) |

## Architecture

```
┌─────────────────────────────────┐
│         React Native UI         │
│   (Neo-Brutalist Components)    │
├─────────────────────────────────┤
│     Zustand State Management    │
├──────────┬──────────────────────┤
│  SQLite  │   Supabase Sync     │
│ (local)  │  (queue-based)      │
├──────────┴──────────────────────┤
│      Supabase (Auth + RLS)      │
└─────────────────────────────────┘
```

**Offline-first sync pipeline:**
1. All mutations write to local SQLite first
2. Changes enqueue to sync queue with retry logic
3. On connectivity, queue processes against Supabase
4. Row Level Security ensures data isolation per user
5. Conflict resolution via version tracking

## Features

- **Habit CRUD** — Create, edit, archive habits with custom icons/colors
- **Daily Tracking** — One-tap completion with haptic feedback
- **Streak System** — Current streak, longest streak, completion rate
- **Statistics** — Weekly/monthly views with visual charts
- **Dark Mode** — Light / Dark / System with smooth transitions
- **Cloud Sync** — Supabase-backed with offline queue
- **Notifications** — Configurable daily reminders (dev build)

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Sign in / Sign up
│   ├── (tabs)/             # Main tab navigation
│   └── habit/              # Habit detail & creation
├── components/
│   ├── brutal/             # Design system (10 components)
│   ├── common/             # Shared utilities
│   └── habits/             # Habit-specific components
├── constants/              # Theme tokens, config
├── hooks/                  # Custom hooks
├── lib/                    # Database, sync, notifications
├── stores/                 # Zustand stores
└── types/                  # TypeScript definitions
```

## Getting Started

### Prerequisites
- Node.js 20+
- Expo Go app (iOS/Android) or EAS development build

### Setup

```bash
git clone https://github.com/mer-prog/pulse-habit.git
cd pulse-habit
npm install
```

```bash
cp .env.example .env
# Fill in your Supabase credentials
```

```bash
npx expo start --clear
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Add your project URL and anon key to `.env`

### Development Build (for notifications)

```bash
npx eas build --profile development --platform android
```

```bash
npx eas build --profile development --platform ios
```

## Design System

Neo-Brutalist design with heavy borders, offset shadows, and bold typography.

| Token | Value |
|-------|-------|
| Accent | `#FF5722` |
| Light BG | `#FFFDF5` |
| Dark BG | `#0D0D0D` |
| Border | 2-3px solid |
| Shadow Offset | 4px |
| Heading Font | Space Grotesk |
| Mono Font | Space Mono |

## Scripts

```bash
npm start          # Start Expo dev server
npm run typecheck  # TypeScript validation
npm test           # Run Jest tests
npm run lint       # ESLint
```

## License

MIT

---

Built by [mer-prog](https://github.com/mer-prog)
