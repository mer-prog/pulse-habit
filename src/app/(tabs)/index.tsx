import { useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { StreakRing } from '@/components/habits/StreakRing';
import { HabitList } from '@/components/habits/HabitList';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useHabits } from '@/hooks/useHabits';
import { colors } from '@/constants/colors';

export default function TodayScreen() {
  const router = useRouter();
  const {
    habits,
    isLoading,
    completedCount,
    totalCount,
    completionRate,
    today,
    loadHabits,
    toggleCompletion,
  } = useHabits();

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  const dateDisplay = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [today]);

  const allCompleted = totalCount > 0 && completedCount === totalCount;

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(400)} className="px-5 pt-4">
        <Text className="text-sm text-slate-500 dark:text-slate-400">
          {dateDisplay}
        </Text>
        <Text className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
          Today
        </Text>
      </Animated.View>

      {/* Progress Ring */}
      <Animated.View
        entering={FadeIn.delay(200).duration(400)}
        className="items-center py-6"
      >
        <StreakRing
          progress={completionRate}
          size={140}
          strokeWidth={10}
          color={allCompleted ? colors.success : colors.primary}
          showPulse={allCompleted}
        />
        <Text className="mt-3 text-base font-medium text-slate-700 dark:text-slate-300">
          {completedCount}/{totalCount} completed
        </Text>
        {allCompleted && totalCount > 0 && (
          <Text className="mt-1 text-sm font-semibold text-emerald-500">
            All done! Great job! 🎉
          </Text>
        )}
      </Animated.View>

      {/* Habit List */}
      <HabitList
        habits={habits}
        onToggle={(id) => void toggleCompletion(id)}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/habit/new')}
        className="absolute bottom-24 right-5 h-14 w-14 items-center justify-center rounded-full bg-indigo-500 shadow-lg"
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
