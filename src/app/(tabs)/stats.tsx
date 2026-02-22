import { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { WeeklyHeatmap } from '@/components/stats/WeeklyHeatmap';
import { StreakChart } from '@/components/stats/StreakChart';
import { CompletionRate } from '@/components/stats/CompletionRate';
import { MonthlyCalendar } from '@/components/stats/MonthlyCalendar';
import { useHabitStore } from '@/stores/habitStore';
import { useAuthStore } from '@/stores/authStore';
import { useTopStreaks } from '@/hooks/useStreak';
import { Ionicons } from '@expo/vector-icons';
import * as db from '@/lib/database';
import { CATEGORY_MAP } from '@/constants/categories';

type Period = 'week' | 'month' | 'year';

export default function StatsScreen() {
  const database = useSQLiteContext();
  const habits = useHabitStore((s) => s.habits);
  const completions = useHabitStore((s) => s.completions);
  const user = useAuthStore((s) => s.user);
  const topStreaks = useTopStreaks(3);
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();

  // Build heatmap data from all completions
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    const activeHabits = habits.filter((h) => !h.is_archived);
    const totalHabits = activeHabits.length || 1;

    // Count completions per date
    const dateCounts: Record<string, number> = {};
    for (const habitCompletions of Object.values(completions)) {
      for (const c of habitCompletions) {
        dateCounts[c.completed_date] = (dateCounts[c.completed_date] ?? 0) + 1;
      }
    }

    // Convert to rates
    for (const [date, count] of Object.entries(dateCounts)) {
      data[date] = Math.min(count / totalHabits, 1);
    }

    return data;
  }, [habits, completions]);

  // Overall completion rate
  const overallRate = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.is_archived);
    if (activeHabits.length === 0) return 0;

    const today = db.getDateString(new Date());
    let completed = 0;
    for (const h of activeHabits) {
      const hc = completions[h.id] ?? [];
      if (hc.some((c) => c.completed_date === today)) completed++;
    }
    return completed / activeHabits.length;
  }, [habits, completions]);

  // Streak chart data (last 7 or 30 days)
  const streakChartData = useMemo(() => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const data: { value: number; label?: string }[] = [];
    const activeHabits = habits.filter((h) => !h.is_archived);
    const total = activeHabits.length || 1;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = db.getDateString(d);
      let count = 0;
      for (const h of activeHabits) {
        const hc = completions[h.id] ?? [];
        if (hc.some((c) => c.completed_date === dateStr)) count++;
      }
      data.push({
        value: Math.round((count / total) * 100),
        label: i % (period === 'week' ? 1 : 7) === 0
          ? `${d.getMonth() + 1}/${d.getDate()}`
          : undefined,
      });
    }
    return data;
  }, [habits, completions, period]);

  // Monthly calendar dates
  const completedDates = useMemo(() => {
    const dates = new Set<string>();
    for (const habitComps of Object.values(completions)) {
      for (const c of habitComps) {
        dates.add(c.completed_date);
      }
    }
    return dates;
  }, [completions]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      <Header title="Statistics" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {/* Period selector */}
        <View className="mb-4 flex-row gap-2">
          {(['week', 'month', 'year'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              className={`flex-1 items-center rounded-xl py-2 ${
                period === p ? 'bg-indigo-500' : 'bg-white dark:bg-slate-800'
              }`}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  period === p ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Completion Rate */}
        <Card className="mb-4 items-center">
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Today's Progress
          </Text>
          <CompletionRate rate={overallRate} size={120} />
        </Card>

        {/* Weekly Heatmap */}
        <Card className="mb-4">
          <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            Activity Heatmap
          </Text>
          <WeeklyHeatmap completionData={heatmapData} weeks={12} />
        </Card>

        {/* Top Streaks */}
        {topStreaks.length > 0 && (
          <Card className="mb-4">
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Top Streaks 🔥
            </Text>
            {topStreaks.map((streak, i) => {
              const habit = habits.find((h) => h.id === streak.habit_id);
              if (!habit) return null;
              return (
                <View key={streak.habit_id} className="mb-2 flex-row items-center">
                  <Text className="mr-2 text-lg">{habit.icon}</Text>
                  <Text className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                    {habit.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="flame" size={16} color="#F59E0B" />
                    <Text className="ml-1 font-bold text-amber-500">
                      {streak.current_streak}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Completion Trend */}
        <Card className="mb-4">
          <StreakChart data={streakChartData} title="Completion Rate (%)" />
        </Card>

        {/* Monthly Calendar */}
        <Card className="mb-4">
          <MonthlyCalendar
            completedDates={completedDates}
            month={now.getMonth()}
            year={now.getFullYear()}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
