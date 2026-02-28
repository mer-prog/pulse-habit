import { View, Text, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import { useSettingsStore, type Language } from '@/stores/settingsStore';
import {
  BrutalButton, BrutalTag, OffsetShadow, StatBox, BlackTag,
} from '@/components/brutal';
import { brutal, fontFamily, useTheme } from '@/constants/theme';
import i18n from '@/i18n';
import type { ThemeMode } from '@/types';

const languageOptions: { key: Language; label: string }[] = [
  { key: 'ja', label: 'JP' },
  { key: 'en', label: 'EN' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const habits = useHabitStore((s) => s.habits);
  const streaks = useHabitStore((s) => s.streaks);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const themeOptions: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: t('profile.themeLight') },
    { key: 'dark', label: t('profile.themeDark') },
    { key: 'system', label: t('profile.themeSystem') },
  ];

  const activeHabits = habits.filter((h) => !h.is_archived);
  const totalCompletions = Object.values(useHabitStore.getState().completions).flat().length;
  const longestStreak = Math.max(0, ...Object.values(streaks).map((s) => s.longest_streak));

  const handleSignOut = () => {
    Alert.alert(t('profile.signOut'), t('profile.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.signOut'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const handleChangeLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
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
          <Text style={{ fontSize: brutal.fontSize['5xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, letterSpacing: -1.5 }}>{t('profile.title')}</Text>
          <Text style={{ fontSize: brutal.fontSize['5xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent }}>.</Text>
        </View>

        {/* User card */}
        <OffsetShadow offset={brutal.shadowOffset}>
          <View style={{ borderWidth: 3, borderColor: colors.border, backgroundColor: colors.card, padding: 20, alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 72, height: 72, borderWidth: 3, borderColor: colors.border, backgroundColor: brutal.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
            <Text style={{ fontSize: 20, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{user?.name ?? t('common.user')}</Text>
            <Text style={{ fontSize: 12, fontFamily: fontFamily.monoRegular, color: colors.inkMuted, marginTop: 2 }}>{user?.email ?? ''}</Text>
          </View>
        </OffsetShadow>

        {/* Journey stats */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
            <View style={{ marginBottom: 12 }}><BlackTag>{t('profile.yourJourney')}</BlackTag></View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatBox label={t('profile.completions')} value={totalCompletions} accent={brutal.success} />
              <StatBox label={t('profile.longest')} value={`${longestStreak}d`} accent={brutal.accent} />
              <StatBox label={t('profile.active')} value={activeHabits.length} accent={brutal.indigo} />
            </View>
          </View>
        </OffsetShadow>

        {/* Theme selector */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {t('profile.theme')}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {themeOptions.map((opt, i) => {
                const isActive = themeMode === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setThemeMode(opt.key)}
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
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </OffsetShadow>

        {/* Language selector */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              {t('profile.language')}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {languageOptions.map((opt, i) => {
                const isActive = language === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => handleChangeLanguage(opt.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderWidth: 2,
                      borderColor: isActive ? brutal.accent : colors.border,
                      borderLeftWidth: i > 0 ? 0 : 2,
                      backgroundColor: isActive ? brutal.accent : colors.card,
                      alignItems: 'center',
                      shadowColor: isActive ? colors.shadow : 'transparent',
                      shadowOffset: { width: isActive ? brutal.shadowOffsetSm : 0, height: isActive ? brutal.shadowOffsetSm : 0 },
                      shadowOpacity: isActive ? 1 : 0,
                      shadowRadius: 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: brutal.fontSize.base,
                        fontFamily: fontFamily.mono,
                        fontWeight: '700',
                        color: isActive ? '#FFFFFF' : colors.ink,
                        letterSpacing: 1,
                      }}
                    >
                      {opt.label}
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
              <Text style={{ fontSize: 13, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{t('profile.dataSync')}</Text>
              <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: colors.inkMuted, marginTop: 2 }}>{t('profile.supabaseConnected')}</Text>
            </View>
            <BrutalTag color={brutal.success}>{t('profile.synced')}</BrutalTag>
          </View>
        </OffsetShadow>

        <BrutalButton title={t('profile.signOut')} onPress={handleSignOut} color={brutal.rose} fullWidth />

        <Text style={{ textAlign: 'center', marginTop: 20, fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: colors.inkMuted }}>
          {t('profile.version')}
        </Text>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
