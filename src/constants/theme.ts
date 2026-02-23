import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

// ════════════════════════════════════════════════════════
// PulseHabit — Neo-Brutalist Design System + Dark Mode
// ════════════════════════════════════════════════════════

// ─── Static tokens (shared across themes) ─────────────
export const brutal = {
  accent: '#FF5722',
  accentAlt: '#FF7A50',
  success: '#10B981',
  successAlt: '#059669',
  indigo: '#4F46E5',
  violet: '#7C3AED',
  cyan: '#0891B2',
  amber: '#D97706',
  rose: '#E11D48',

  shadowOffset: 4,
  shadowOffsetSm: 3,
  shadowOffsetPressed: 1,

  space: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
    '2xl': 24, '3xl': 32, '4xl': 48,
  },

  borderWidth: { sm: 1.5, md: 2, lg: 3 },

  fontSize: {
    xs: 9, sm: 10, md: 11, base: 13, lg: 15, xl: 17,
    '2xl': 20, '3xl': 24, '4xl': 32, '5xl': 42, '6xl': 48, hero: 72,
  },
} as const;

// ─── Theme-dependent palettes ─────────────────────────
const lightPalette = {
  bg: '#FFFDF5',
  bgAlt: '#F5F0E8',
  ink: '#1A1A1A',
  inkSoft: '#555555',
  inkMuted: '#999999',
  card: '#FFFFFF',
  border: '#1A1A1A',
  borderLight: '#E0DBD0',
  shadow: '#1A1A1A',
  white: '#FFFDF5',
  dotGrid: '#000000',
} as const;

const darkPalette = {
  bg: '#0D0D0D',
  bgAlt: '#1A1A1A',
  ink: '#E8E4DC',
  inkSoft: '#A0A0A0',
  inkMuted: '#666666',
  card: '#1A1A1A',
  border: '#555555',
  borderLight: '#2A2A2A',
  shadow: '#000000',
  white: '#0D0D0D',      // inverted: dark text on light (ink) backgrounds
  dotGrid: '#FFFFFF',
} as const;

export type ThemeColors = {
  bg: string;
  bgAlt: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  card: string;
  border: string;
  borderLight: string;
  shadow: string;
  white: string;
  dotGrid: string;
};

// ─── useTheme hook ────────────────────────────────────
export function useTheme() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const colors: ThemeColors = isDark ? darkPalette : lightPalette;

  return {
    colors,
    isDark,
    statusBarStyle: (isDark ? 'light' : 'dark') as 'light' | 'dark',
  };
}

// ─── Category Colors ──────────────────────────────────
export const categoryColors: Record<string, string> = {
  health: brutal.cyan,
  exercise: brutal.success,
  learning: brutal.indigo,
  work: brutal.amber,
  mind: brutal.violet,
  other: '#999999',
};

// ─── Font Family Helper ───────────────────────────────
export const fontFamily = {
  heading: 'SpaceGrotesk_700Bold',
  headingMedium: 'SpaceGrotesk_600SemiBold',
  body: 'SpaceGrotesk_500Medium',
  bodyRegular: 'SpaceGrotesk_400Regular',
  mono: 'SpaceMono_700Bold',
  monoRegular: 'SpaceMono_400Regular',
} as const;

