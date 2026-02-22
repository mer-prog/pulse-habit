# PulseHabit — Smart Habit & Streak Tracker

A visually beautiful habit tracking mobile app that makes building daily routines fun and rewarding. Track habits, visualize streaks, and stay motivated with animations and statistics.

![React Native](https://img.shields.io/badge/React_Native-0.81-blue?logo=react)
![Expo](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)
![NativeWind](https://img.shields.io/badge/NativeWind-v4-06B6D4?logo=tailwindcss)

## Screenshots

| Today | Habits | Stats | Profile |
|-------|--------|-------|---------|
| ![Today](docs/screenshots/today.png) | ![Habits](docs/screenshots/habits.png) | ![Stats](docs/screenshots/stats.png) | ![Profile](docs/screenshots/profile.png) |

## Features

- **Habit Tracking** — Create habits with custom icons, colors, and categories
- **Streak Tracking** — Visual streak rings with animated progress indicators
- **Daily Progress** — See today's completion rate at a glance
- **Statistics** — GitHub-style heatmap, charts, and monthly calendars
- **Offline-First** — Full functionality without internet (SQLite local database)
- **Cloud Sync** — Supabase backend with conflict detection and retry queue
- **Push Notifications** — Per-habit reminders with deep link navigation
- **Camera Integration** — Attach photos to habit completions
- **Haptic Feedback** — Tactile responses for completions and interactions
- **Dark Mode** — System-detected or manual theme switching
- **Animations** — Smooth streak ring, checkbox, and celebration animations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Expo SDK 54 + React Native 0.81 |
| Language | TypeScript (strict mode) |
| Navigation | expo-router v6 (file-based routing) |
| State | Zustand (persist + AsyncStorage) |
| Local DB | expo-sqlite (SQLite, offline-first) |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Animations | react-native-reanimated v4 |
| Charts | react-native-gifted-charts + react-native-svg |
| Backend | Supabase (Auth + PostgreSQL + Realtime) |
| Notifications | expo-notifications (local) |
| Camera | expo-image-picker |
| Haptics | expo-haptics |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    UI Layer                      │
│  expo-router (screens) ← NativeWind (styling)   │
│  react-native-reanimated (animations)           │
├─────────────────────────────────────────────────┤
│                  State Layer                     │
│  Zustand stores (habit, auth, settings, toast)   │
│  AsyncStorage persistence                        │
├─────────────────────────────────────────────────┤
│                  Data Layer                      │
│  SQLite (offline-first local DB)                 │
│  ↕ Sync Queue (conflict detection + retry)       │
│  Supabase (remote PostgreSQL + Auth)             │
├─────────────────────────────────────────────────┤
│               Native Features                    │
│  Haptics · Notifications · Camera · Dark Mode    │
└─────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js >= 20.19
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app)

### Setup

```bash
# Clone the repository
git clone https://github.com/mer-prog/pulse-habit.git
cd pulse-habit

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials (optional — app works offline)

# Start the development server
npx expo start
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | No (offline mode) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | No (offline mode) |

> The app works fully offline without Supabase configured. Cloud sync is optional.

### Running Tests

```bash
npm test
```

## Project Structure

```
pulse-habit/
├── app.json                    # Expo configuration
├── babel.config.js             # Babel (NativeWind + Reanimated)
├── metro.config.js             # Metro bundler (NativeWind)
├── tailwind.config.js          # Tailwind CSS v3 config
├── global.css                  # Tailwind directives
├── jest.config.js              # Jest configuration
├── src/
│   ├── app/                    # expo-router screens
│   │   ├── _layout.tsx         # Root (SQLite + auth guard + theme)
│   │   ├── (auth)/             # Auth screens (sign-in, sign-up)
│   │   ├── (tabs)/             # Tab screens (today, habits, stats, profile)
│   │   └── habit/              # Habit screens ([id] detail, new)
│   ├── components/
│   │   ├── common/             # ErrorBoundary, Toast, EmptyState, etc.
│   │   ├── ui/                 # Button, Card, Input, Modal, AnimatedCheckbox
│   │   ├── habits/             # HabitCard, StreakRing, HabitList, etc.
│   │   └── stats/              # WeeklyHeatmap, StreakChart, CompletionRate
│   ├── stores/                 # Zustand stores (habit, auth, settings, toast)
│   ├── lib/                    # Database, sync, notifications, haptics, errors
│   ├── hooks/                  # useHabits, useStreak, useSync, useNotifications
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # Colors, categories, config values
│   ├── dev/                    # Seed data (dev only)
│   └── __tests__/              # Unit tests
```

## Database Schema

### SQLite (Local)

- **habits** — Habit definitions with icon, color, category, frequency
- **completions** — Daily completion records (UNIQUE per habit+date)
- **streaks** — Current and longest streak per habit
- **sync_queue** — Pending sync operations with retry logic
- **sync_conflicts** — Detected version conflicts for resolution

### Sync Strategy

- Completions: Idempotent upsert (no conflicts possible)
- Habits: Version-based conflict detection with device tracking
- Retry: Exponential backoff (1s → 2s → 4s → 8s → 16s), max 5 retries
- Dead letter queue after max retries with user notification

## License

MIT
