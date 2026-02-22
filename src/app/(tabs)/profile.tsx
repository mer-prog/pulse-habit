import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHabitStore } from '@/stores/habitStore';
import { useSync } from '@/hooks/useSync';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { colors } from '@/constants/colors';
import { APP_VERSION } from '@/constants/config';
import type { ThemeMode } from '@/types';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const lastSyncAt = useSettingsStore((s) => s.lastSyncAt);
  const habits = useHabitStore((s) => s.habits);
  const streaks = useHabitStore((s) => s.streaks);
  const { syncStatus, sync } = useSync();

  const totalCompletions = Object.values(
    useHabitStore.getState().completions
  ).reduce((sum, c) => sum + c.length, 0);

  const longestStreak = Math.max(
    0,
    ...Object.values(streaks).map((s) => s.longest_streak)
  );

  const activeDays = new Set(
    Object.values(useHabitStore.getState().completions)
      .flatMap((c) => c.map((comp) => comp.completed_date))
  ).size;

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          if (isSupabaseConfigured()) {
            await supabase.auth.signOut();
          }
          signOut();
        },
      },
    ]);
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'light', label: 'Light', icon: 'sunny' },
    { mode: 'dark', label: 'Dark', icon: 'moon' },
    { mode: 'system', label: 'System', icon: 'phone-portrait' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      <Header title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {/* User Info */}
        <Card className="mb-4 items-center">
          <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {user?.name ?? 'User'}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {user?.email ?? ''}
          </Text>
        </Card>

        {/* Stats Summary */}
        <Card className="mb-4">
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Your Journey
          </Text>
          <View className="flex-row">
            <StatItem label="Completions" value={totalCompletions} icon="checkmark-circle" />
            <StatItem label="Longest Streak" value={longestStreak} icon="flame" />
            <StatItem label="Active Days" value={activeDays} icon="calendar" />
          </View>
        </Card>

        {/* Theme Setting */}
        <Card className="mb-4">
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Theme
          </Text>
          <View className="flex-row gap-2">
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.mode}
                onPress={() => setThemeMode(opt.mode)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                  themeMode === opt.mode
                    ? 'bg-indigo-500'
                    : 'bg-slate-100 dark:bg-slate-700'
                }`}
              >
                <Ionicons
                  name={opt.icon}
                  size={16}
                  color={themeMode === opt.mode ? '#FFFFFF' : '#64748B'}
                />
                <Text
                  className={`text-sm font-medium ${
                    themeMode === opt.mode
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Sync Status */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Data Sync
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {syncStatus === 'syncing'
                  ? 'Syncing...'
                  : syncStatus === 'error'
                  ? 'Sync failed'
                  : syncStatus === 'offline'
                  ? 'Offline mode'
                  : lastSyncAt
                  ? `Last synced: ${new Date(lastSyncAt).toLocaleString()}`
                  : 'Not synced yet'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => void sync()}
              className="rounded-lg bg-slate-100 p-2 dark:bg-slate-700"
            >
              <Ionicons name="sync" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Dev tools */}
        {__DEV__ && (
          <Card className="mb-4">
            <Text className="mb-2 text-xs font-medium uppercase text-slate-400">
              Developer
            </Text>
            <TouchableOpacity
              onPress={async () => {
                const { seedDatabase } = await import('@/dev/seed');
                const { useSQLiteContext } = await import('expo-sqlite');
                Alert.alert(
                  'Seed Data',
                  'This will add demo habits and completions. Existing data will not be affected.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Seed',
                      onPress: () => {
                        // Seed needs DB context, which is handled in the seed module
                        Alert.alert('Info', 'Use the seed function from the database context');
                      },
                    },
                  ]
                );
              }}
              className="flex-row items-center py-2"
            >
              <Ionicons name="flask" size={20} color={colors.warning} />
              <Text className="ml-2 text-sm text-slate-700 dark:text-slate-300">
                Reset & Seed Data
              </Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="mb-4 items-center rounded-2xl bg-white py-4 dark:bg-slate-800"
        >
          <Text className="font-semibold text-red-500">Sign Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text className="text-center text-xs text-slate-400">
          PulseHabit v{APP_VERSION}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="flex-1 items-center">
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </Text>
      <Text className="text-xs text-slate-500 dark:text-slate-400">{label}</Text>
    </View>
  );
}
