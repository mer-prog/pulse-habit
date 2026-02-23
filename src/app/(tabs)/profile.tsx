import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/authStore';
import { useHabitStore } from '@/stores/habitStore';
import {
  BrutalButton,
  BrutalTag,
  OffsetShadow,
  StatBox,
  BlackTag,
} from '@/components/brutal';
import { brutal, fontFamily } from '@/constants/theme';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const habits = useHabitStore((s) => s.habits);
  const streaks = useHabitStore((s) => s.streaks);

  const activeHabits = habits.filter((h) => !h.is_archived);

  // Compute journey stats
  const totalCompletions = Object.values(useHabitStore.getState().completions)
    .flat().length;

  const longestStreak = Math.max(
    0,
    ...Object.values(streaks).map((s) => s.longest_streak),
  );

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => void signOut(),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brutal.bg }} edges={['top']}>
      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {/* Title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            marginTop: 16,
            marginBottom: 28,
          }}
        >
          <Text
            style={{
              fontSize: brutal.fontSize['5xl'],
              fontFamily: fontFamily.heading,
              fontWeight: '700',
              color: brutal.ink,
              letterSpacing: -1.5,
            }}
          >
            PROFILE
          </Text>
          <Text
            style={{
              fontSize: brutal.fontSize['5xl'],
              fontFamily: fontFamily.heading,
              fontWeight: '700',
              color: brutal.accent,
            }}
          >
            .
          </Text>
        </View>

        {/* User card */}
        <OffsetShadow offset={brutal.shadowOffset}>
          <View
            style={{
              borderWidth: 3,
              borderColor: brutal.ink,
              backgroundColor: '#fff',
              padding: 20,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderWidth: 3,
                borderColor: brutal.ink,
                backgroundColor: brutal.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>

            <Text
              style={{
                fontSize: 20,
                fontFamily: fontFamily.heading,
                fontWeight: '700',
                color: brutal.ink,
              }}
            >
              {user?.name ?? 'User'}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: fontFamily.monoRegular,
                color: brutal.inkMuted,
                marginTop: 2,
              }}
            >
              {user?.email ?? ''}
            </Text>
          </View>
        </OffsetShadow>

        {/* Journey stats */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View
            style={{
              borderWidth: 2,
              borderColor: brutal.ink,
              backgroundColor: '#fff',
              padding: 14,
              marginBottom: 16,
            }}
          >
            <View style={{ marginBottom: 12 }}>
              <BlackTag>YOUR JOURNEY</BlackTag>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <StatBox label="COMPLETIONS" value={totalCompletions} accent={brutal.success} />
              <StatBox label="LONGEST" value={`${longestStreak}d`} accent={brutal.accent} />
              <StatBox label="ACTIVE" value={activeHabits.length} accent={brutal.indigo} />
            </View>
          </View>
        </OffsetShadow>

        {/* Theme selector */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View
            style={{
              borderWidth: 2,
              borderColor: brutal.ink,
              backgroundColor: '#fff',
              padding: 14,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: brutal.fontSize.sm,
                fontFamily: fontFamily.mono,
                fontWeight: '700',
                color: brutal.inkSoft,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              THEME
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {[
                { label: '☀ LIGHT', active: true },
                { label: '🌙 DARK', active: false },
                { label: '⚙ SYS', active: false },
              ].map((t, i) => (
                <Pressable
                  key={i}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderWidth: 2,
                    borderColor: brutal.ink,
                    borderLeftWidth: i > 0 ? 0 : 2,
                    backgroundColor: t.active ? brutal.ink : '#fff',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: brutal.fontSize.sm,
                      fontFamily: fontFamily.mono,
                      fontWeight: '700',
                      color: t.active ? brutal.white : brutal.ink,
                      letterSpacing: 0.6,
                    }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </OffsetShadow>

        {/* Sync status */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View
            style={{
              borderWidth: 2,
              borderColor: brutal.ink,
              backgroundColor: '#fff',
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fontFamily.heading,
                  fontWeight: '700',
                  color: brutal.ink,
                }}
              >
                Data Sync
              </Text>
              <Text
                style={{
                  fontSize: brutal.fontSize.sm,
                  fontFamily: fontFamily.monoRegular,
                  color: brutal.inkMuted,
                  marginTop: 2,
                }}
              >
                SUPABASE CONNECTED
              </Text>
            </View>
            <BrutalTag color={brutal.success}>SYNCED</BrutalTag>
          </View>
        </OffsetShadow>

        {/* Sign out */}
        <BrutalButton
          title="SIGN OUT"
          onPress={handleSignOut}
          color={brutal.rose}
          fullWidth
        />

        {/* Version */}
        <Text
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: brutal.fontSize.sm,
            fontFamily: fontFamily.monoRegular,
            color: brutal.inkMuted,
          }}
        >
          PULSEHABIT v1.0.0
        </Text>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

