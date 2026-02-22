export const colors = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4338CA',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  light: {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
  },

  dark: {
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
  },

  categories: {
    health: '#10B981',
    exercise: '#F59E0B',
    learning: '#6366F1',
    work: '#3B82F6',
    mind: '#8B5CF6',
    other: '#64748B',
  } as const,
} as const;

export type ThemeColors = typeof colors.light;
