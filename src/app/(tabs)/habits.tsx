import { useEffect, useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useHabits } from '@/hooks/useHabits';
import { BlackTag, BrutalTag } from '@/components/brutal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { brutal, fontFamily, categoryColors } from '@/constants/theme';

export default function HabitsScreen() {
  const router = useRouter();
  const { habits, isLoading, loadHabits } = useHabits();

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  const categories = useMemo(() => {
    return [...new Set(habits.map((h) => h.category))];
  }, [habits]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brutal.bg }} edges={['top']}>
      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {/* Title */}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 16, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: brutal.fontSize['5xl'],
              fontFamily: fontFamily.heading,
              fontWeight: '700',
              color: brutal.ink,
              letterSpacing: -1.5,
            }}
          >
            HABITS
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

        {/* Filter tags */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          <BlackTag>{`ALL (${habits.length})`}</BlackTag>
          {categories.map((cat) => (
            <BrutalTag key={cat} color={categoryColors[cat]}>
              {cat}
            </BrutalTag>
          ))}
        </View>

        {/* Habit list with index */}
        <View>
          {habits.map((h, i) => {
            const catColor = categoryColors[h.category] || brutal.inkMuted;
            const streak = h.streak?.current_streak ?? 0;

            return (
              <Pressable
                key={h.id}
                onPress={() => router.push(`/habit/${h.id}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  borderBottomWidth: 2,
                  borderBottomColor: brutal.ink,
                  borderTopWidth: i === 0 ? 2 : 0,
                  borderTopColor: brutal.ink,
                }}
              >
                {/* Index number (outlined) */}
                <Text
                  style={{
                    fontSize: 28,
                    fontFamily: fontFamily.heading,
                    fontWeight: '700',
                    color: brutal.bgAlt,
                    width: 36,
                    textAlign: 'right',
                    // Note: -webkit-text-stroke doesn't work in RN
                    // We'll use a slightly visible color instead
                    opacity: 0.3,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </Text>

                <Text style={{ fontSize: 28 }}>{h.icon}</Text>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: fontFamily.heading,
                      fontWeight: '700',
                      color: brutal.ink,
                    }}
                    numberOfLines={1}
                  >
                    {h.name}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 3 }}>
                    <BrutalTag color={catColor} small>
                      {h.category}
                    </BrutalTag>
                    {h.reminder_time && (
                      <Text
                        style={{
                          fontSize: brutal.fontSize.sm,
                          fontFamily: fontFamily.monoRegular,
                          color: brutal.inkMuted,
                        }}
                      >
                        {h.reminder_time}
                      </Text>
                    )}
                  </View>
                </View>

                {streak > 0 && (
                  <View
                    style={{
                      borderWidth: 2,
                      borderColor: brutal.accent,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      backgroundColor: `${brutal.accent}10`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fontFamily.mono,
                        fontWeight: '700',
                        color: brutal.accent,
                      }}
                    >
                      🔥{streak}
                    </Text>
                  </View>
                )}

                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: fontFamily.monoRegular,
                    color: brutal.inkMuted,
                  }}
                >
                  →
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

