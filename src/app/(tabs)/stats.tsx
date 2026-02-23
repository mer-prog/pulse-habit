import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useHabitStore } from '@/stores/habitStore';
import { BrutalCard, BlackTag, OffsetShadow, HatchPattern } from '@/components/brutal';
import { brutal, fontFamily, categoryColors, useTheme } from '@/constants/theme';
import * as db from '@/lib/database';

type Period = 'week' | 'month' | 'year';

export default function StatsScreen() {
  const { colors } = useTheme();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const streaks = useHabitStore((s) => s.streaks);
  const [period, setPeriod] = useState<Period>('week');

  const activeHabits = useMemo(() => habits.filter((h) => !h.is_archived), [habits]);
  const total = activeHabits.length || 1;

  const overallRate = useMemo(() => {
    const today = db.getDateString(new Date());
    let done = 0;
    for (const h of activeHabits) {
      const hc = completions[h.id] ?? [];
      if (hc.some((c) => c.completed_date === today)) done++;
    }
    return activeHabits.length > 0 ? Math.round((done / activeHabits.length) * 100) : 0;
  }, [activeHabits, completions]);

  const barData = useMemo(() => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const data: { day: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = db.getDateString(d);
      let count = 0;
      for (const h of activeHabits) {
        if ((completions[h.id] ?? []).some((c) => c.completed_date === dateStr)) count++;
      }
      data.push({ day: days[6 - i], value: Math.round((count / total) * 100) });
    }
    return data;
  }, [activeHabits, completions, total]);

  const heatmap = useMemo(() => {
    const cells: number[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = db.getDateString(d);
      let count = 0;
      for (const h of activeHabits) {
        if ((completions[h.id] ?? []).some((c) => c.completed_date === dateStr)) count++;
      }
      const ratio = count / total;
      cells.push(ratio > 0.7 ? 3 : ratio > 0.4 ? 2 : ratio > 0 ? 1 : 0);
    }
    return cells;
  }, [activeHabits, completions, total]);

  const topStreaks = useMemo(() => {
    return Object.entries(streaks)
      .map(([id, s]) => ({ habit: habits.find((h) => h.id === id), streak: s.current_streak }))
      .filter((s) => s.habit && s.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);
  }, [habits, streaks]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Animated.ScrollView
        entering={FadeIn.duration(400)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: brutal.fontSize['5xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, letterSpacing: -1.5 }}>STATS</Text>
          <Text style={{ fontSize: brutal.fontSize['5xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent }}>.</Text>
        </View>

        {/* Period selector */}
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          {(['week', 'month', 'year'] as const).map((p, i) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1, paddingVertical: 10,
                borderWidth: 2, borderColor: colors.border, borderLeftWidth: i > 0 ? 0 : 2,
                backgroundColor: period === p ? colors.ink : colors.card,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono, fontWeight: '700',
                color: period === p ? colors.white : colors.ink,
                textTransform: 'uppercase', letterSpacing: 1,
              }}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* Big number */}
        <OffsetShadow offset={brutal.shadowOffset}>
          <View style={{ borderWidth: 3, borderColor: colors.border, backgroundColor: colors.card, padding: 20, alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: brutal.fontSize.hero, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, lineHeight: 76, letterSpacing: -3 }}>{overallRate}</Text>
              <Text style={{ fontSize: brutal.fontSize['4xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent }}>%</Text>
            </View>
            <Text style={{ fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 6 }}>
              COMPLETION RATE TODAY
            </Text>
          </View>
        </OffsetShadow>

        {/* Bar chart */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              DAILY COMPLETION %
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 }}>
              {barData.map((d, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{
                    width: '100%', height: Math.max((d.value / 100) * 80, 4),
                    backgroundColor: d.value === 100 ? brutal.success : brutal.accent,
                    borderWidth: 1.5, borderColor: colors.border,
                  }} />
                  <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: i === 6 ? brutal.accent : colors.inkMuted }}>{d.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </OffsetShadow>

        {/* Heatmap */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              28-DAY ACTIVITY
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {heatmap.map((v, i) => (
                <View key={i} style={{
                  width: `${(100 - 6 * 1.5) / 7}%`, aspectRatio: 1,
                  borderWidth: 1.5,
                  borderColor: v > 0 ? colors.border : colors.borderLight,
                  backgroundColor:
                    v === 3 ? brutal.accent
                    : v === 2 ? `${brutal.accent}60`
                    : v === 1 ? `${brutal.accent}25`
                    : colors.bgAlt,
                }} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
              <Text style={{ fontSize: 9, fontFamily: fontFamily.monoRegular, color: colors.inkMuted }}>LESS</Text>
              {[0, 1, 2, 3].map((v) => (
                <View key={v} style={{
                  width: 12, height: 12, borderWidth: 1,
                  borderColor: v > 0 ? colors.border : colors.borderLight,
                  backgroundColor: v === 3 ? brutal.accent : v === 2 ? `${brutal.accent}60` : v === 1 ? `${brutal.accent}25` : colors.bgAlt,
                }} />
              ))}
              <Text style={{ fontSize: 9, fontFamily: fontFamily.monoRegular, color: colors.inkMuted }}>MORE</Text>
            </View>
          </View>
        </OffsetShadow>

        {/* Top Streaks */}
        {topStreaks.length > 0 && (
          <OffsetShadow offset={brutal.shadowOffsetSm}>
            <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14 }}>
              <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                TOP STREAKS 🔥
              </Text>
              {topStreaks.map((s, i) => (
                <View key={s.habit?.id ?? i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.borderLight, borderStyle: 'dashed' }}>
                  <Text style={{ fontSize: 18, fontFamily: fontFamily.heading, fontWeight: '900', color: colors.inkMuted, width: 24, opacity: 0.3 }}>{i + 1}</Text>
                  <Text style={{ fontSize: 20 }}>{s.habit?.icon}</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontFamily: fontFamily.headingMedium, fontWeight: '600', color: colors.ink }}>{s.habit?.name}</Text>
                  <Text style={{ fontSize: 16, fontFamily: fontFamily.mono, fontWeight: '700', color: brutal.accent }}>{s.streak}d</Text>
                </View>
              ))}
            </View>
          </OffsetShadow>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
