import { useEffect, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useHabits } from '@/hooks/useHabits';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BrutalProgress, StatBox, BlackTag } from '@/components/brutal';
import { BrutalHabitCard } from '@/components/habits/BrutalHabitCard';
import { brutal, fontFamily } from '@/constants/theme';

export default function TodayScreen() {
  const router = useRouter();
  const {
    habits,
    isLoading,
    completedCount,
    totalCount,
    today,
    loadHabits,
    toggleCompletion,
  } = useHabits();

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  const dayName = useMemo(() => {
    return new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase();
  }, [today]);

  // Placeholder stats — will be computed from real data
  const bestStreak = useMemo(() => {
    let max = 0;
    for (const h of habits) {
      if (h.streak && h.streak.current_streak > max) max = h.streak.current_streak;
    }
    return max > 0 ? `${max}d` : '0d';
  }, [habits]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brutal.bg }} edges={['top']}>
      {/* Dot grid background */}
      <DotGrid />

      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {/* Date tag */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <BlackTag>{dayName}</BlackTag>
        </View>

        {/* Title */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 }}>
          <Text
            style={{
              fontSize: brutal.fontSize['6xl'],
              fontFamily: fontFamily.heading,
              fontWeight: '700',
              color: brutal.ink,
              lineHeight: 52,
              letterSpacing: -1.5,
            }}
          >
            TODAY
          </Text>
          <Text
            style={{
              fontSize: brutal.fontSize['6xl'],
              fontFamily: fontFamily.heading,
              fontWeight: '700',
              color: brutal.accent,
              lineHeight: 52,
            }}
          >
            .
          </Text>
        </View>

        {/* Progress bar */}
        <View style={{ marginBottom: 20 }}>
          <BrutalProgress done={completedCount} total={totalCount} />
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <StatBox label="BEST STREAK" value={bestStreak} accent={brutal.accent} />
          <StatBox label="TODAY" value={`${completedCount}/${totalCount}`} accent={brutal.indigo} />
          <StatBox label="ACTIVE" value={totalCount} accent={brutal.success} />
        </View>

        {/* Section header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <BlackTag>{`HABITS — ${completedCount}/${totalCount}`}</BlackTag>
          <View style={{ flex: 1, height: 2, backgroundColor: brutal.ink }} />
        </View>

        {/* Habit cards */}
        {habits.map((habit) => (
          <BrutalHabitCard
            key={habit.id}
            habit={habit}
            onToggle={() => void toggleCompletion(habit.id)}
            onPress={() => router.push(`/habit/${habit.id}`)}
          />
        ))}

        {/* Empty state */}
        {habits.length === 0 && (
          <View
            style={{
              borderWidth: 2,
              borderColor: brutal.borderLight,
              borderStyle: 'dashed',
              padding: 32,
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 40,
                marginBottom: 12,
              }}
            >
              🎯
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: fontFamily.heading,
                fontWeight: '700',
                color: brutal.ink,
                marginBottom: 4,
              }}
            >
              NO HABITS YET
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: fontFamily.monoRegular,
                color: brutal.inkMuted,
                textAlign: 'center',
              }}
            >
              Tap the + button to create your first habit
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/habit/new')}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: 90,
          right: 20,
          width: 56,
          height: 56,
          backgroundColor: brutal.accent,
          borderWidth: 3,
          borderColor: brutal.ink,
          alignItems: 'center',
          justifyContent: 'center',
          // Offset shadow via wrapper
          shadowColor: brutal.ink,
          shadowOffset: { width: pressed ? 1 : 4, height: pressed ? 1 : 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 0,
          transform: [
            { translateX: pressed ? 3 : 0 },
            { translateY: pressed ? 3 : 0 },
          ],
        })}
      >
        <Text
          style={{
            fontSize: 30,
            fontFamily: fontFamily.heading,
            fontWeight: '700',
            color: '#FFFFFF',
            lineHeight: 32,
          }}
        >
          +
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

/** Subtle dot grid background pattern */
function DotGrid() {
  const dots: { cx: number; cy: number }[] = [];
  const spacing = 20;
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 20; x++) {
      dots.push({ cx: x * spacing + spacing / 2, cy: y * spacing + spacing / 2 });
    }
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
      }}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%">
        {dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={1} fill="#000000" />
        ))}
      </Svg>
    </View>
  );
}

