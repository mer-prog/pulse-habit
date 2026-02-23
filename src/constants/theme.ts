import { Platform, StyleSheet } from 'react-native';

// ════════════════════════════════════════════════════════
// PulseHabit — Neo-Brutalist Design System
// ════════════════════════════════════════════════════════

export const brutal = {
  // ─── Colors ─────────────────────────────────────────
  bg: '#FFFDF5',
  bgAlt: '#F5F0E8',
  ink: '#1A1A1A',
  inkSoft: '#555555',
  inkMuted: '#999999',

  accent: '#FF5722',
  accentAlt: '#FF7A50',
  success: '#10B981',
  successAlt: '#059669',
  indigo: '#4F46E5',
  violet: '#7C3AED',
  cyan: '#0891B2',
  amber: '#D97706',
  rose: '#E11D48',
  white: '#FFFDF5',

  border: '#1A1A1A',
  borderLight: '#E0DBD0',

  // ─── Shadows (offset for brutalist effect) ──────────
  shadowOffset: 4,
  shadowOffsetSm: 3,
  shadowOffsetPressed: 1,

  // ─── Spacing ────────────────────────────────────────
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
  },

  // ─── Border ─────────────────────────────────────────
  borderWidth: {
    sm: 1.5,
    md: 2,
    lg: 3,
  },

  // ─── Font sizes ─────────────────────────────────────
  fontSize: {
    xs: 9,
    sm: 10,
    md: 11,
    base: 13,
    lg: 15,
    xl: 17,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
    '5xl': 42,
    '6xl': 48,
    hero: 72,
  },
} as const;

// ─── Category Colors ──────────────────────────────────
export const categoryColors: Record<string, string> = {
  health: brutal.cyan,
  exercise: brutal.success,
  learning: brutal.indigo,
  work: brutal.amber,
  mind: brutal.violet,
  other: brutal.inkMuted,
};

// ─── Font Family Helper ───────────────────────────────
// We load SpaceGrotesk & SpaceMono in _layout.tsx
export const fontFamily = {
  heading: 'SpaceGrotesk_700Bold',
  headingMedium: 'SpaceGrotesk_600SemiBold',
  body: 'SpaceGrotesk_500Medium',
  bodyRegular: 'SpaceGrotesk_400Regular',
  mono: 'SpaceMono_700Bold',
  monoRegular: 'SpaceMono_400Regular',
} as const;

