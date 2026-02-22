import { useCallback } from 'react';
import { FlatList, type ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import { HabitCard } from './HabitCard';
import { EmptyState } from '@/components/common/EmptyState';
import type { HabitWithStreak } from '@/types';

interface HabitListProps {
  habits: HabitWithStreak[];
  onToggle: (habitId: string) => void;
  onLongPress?: (habit: HabitWithStreak) => void;
}

const ITEM_HEIGHT = 88; // Approximate card height for getItemLayout

export function HabitList({ habits, onToggle, onLongPress }: HabitListProps) {
  const router = useRouter();

  const renderItem: ListRenderItem<HabitWithStreak> = useCallback(
    ({ item }) => (
      <HabitCard
        habit={item}
        onToggle={() => onToggle(item.id)}
        onPress={() => router.push(`/habit/${item.id}`)}
        onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      />
    ),
    [onToggle, onLongPress, router]
  );

  const keyExtractor = useCallback((item: HabitWithStreak) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  if (habits.length === 0) {
    return (
      <EmptyState
        icon="add-circle-outline"
        title="No habits yet"
        description="Create your first habit to start tracking your progress!"
        actionLabel="Create Habit"
        onAction={() => router.push('/habit/new')}
      />
    );
  }

  return (
    <FlatList
      data={habits}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    />
  );
}
