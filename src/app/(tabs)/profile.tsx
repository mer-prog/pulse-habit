import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  BrutalButton, BrutalTag, OffsetShadow, StatBox, BlackTag,
} from '@/components/brutal';
import { brutal, fontFamily, useTheme } from '@/constants/theme';
import type { ThemeMode } from '@/types';

const themeOptions: { key: ThemeMode; label: string }[] = [
  { key: 'light', label: '☀ LIGHT' },
  { key: 'dark', label: '☽ DARK' },
  { key: 'system', label: '⚙ SYS' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const habits = useHabitStore((s) => s.habits);
  const streaks = useHabitStore((s) => s.streaks);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const activeHabits = habits.filter((h) => !h.is_archived);
  const totalCompletions = Object.values(useHabitStore.getState().completions).flat().length;
  const longestStreak = Math.max(0, ...Object.values(streaks).map((s) => s.longest_streak));

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {/* Title */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 16, marginBottom: 28 }}>
          <Text style={{ fontSize: brutal.fontSize['5xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, letterSpacing: -1.5 }}>PROFILE</Text>
          <Text style={{ fontSize: brutal.fontSize['5xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent }}>.</Text>
        </View>

        {/* User card */}
        <OffsetShadow offset={brutal.shadowOffset}>
          <View style={{ borderWidth: 3, borderColor: colors.border, backgroundColor: colors.card, padding: 20, alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 72, height: 72, borderWidth: 3, borderColor: colors.border, backgroundColor: brutal.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
            <Text style={{ fontSize: 20, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{user?.name ?? 'User'}</Text>
            <Text style={{ fontSize: 12, fontFamily: fontFamily.monoRegular, color: colors.inkMuted, marginTop: 2 }}>{user?.email ?? ''}</Text>
          </View>
        </OffsetShadow>

        {/* Journey stats */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
            <View style={{ marginBottom: 12 }}><BlackTag>YOUR JOURNEY</BlackTag></View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatBox label="COMPLETIONS" value={totalCompletions} accent={brutal.success} />
              <StatBox label="LONGEST" value={`${longestStreak}d`} accent={brutal.accent} />
              <StatBox label="ACTIVE" value={activeHabits.length} accent={brutal.indigo} />
            </View>
          </View>
        </OffsetShadow>

        {/* Theme selector — WIRED */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              THEME
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {themeOptions.map((t, i) => {
                const isActive = themeMode === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setThemeMode(t.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderWidth: 2,
                      borderColor: colors.border,
                      borderLeftWidth: i > 0 ? 0 : 2,
                      backgroundColor: isActive ? colors.ink : colors.card,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: brutal.fontSize.sm,
                        fontFamily: fontFamily.mono,
                        fontWeight: '700',
                        color: isActive ? colors.white : colors.ink,
                        letterSpacing: 0.6,
                      }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </OffsetShadow>

        {/* Sync status */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 13, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>Data Sync</Text>
              <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: colors.inkMuted, marginTop: 2 }}>SUPABASE CONNECTED</Text>
            </View>
            <BrutalTag color={brutal.success}>SYNCED</BrutalTag>
          </View>
        </OffsetShadow>

        <BrutalButton title="SIGN OUT" onPress={handleSignOut} color={brutal.rose} fullWidth />

        <Text style={{ textAlign: 'center', marginTop: 20, fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: colors.inkMuted }}>
          PULSEHABIT v1.0.0
        </Text>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
