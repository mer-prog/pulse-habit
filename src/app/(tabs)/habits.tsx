import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '@/components/common/Header';
import { HabitCard } from '@/components/habits/HabitCard';
import { EmptyState } from '@/components/common/EmptyState';
import { CategoryBadge } from '@/components/habits/CategoryBadge';
import { useHabits } from '@/hooks/useHabits';
import { CATEGORIES } from '@/constants/categories';
import { hapticWarning } from '@/lib/haptics';
import type { HabitCategory, HabitWithStreak } from '@/types';

export default function HabitsScreen() {
  const router = useRouter();
  const { habits, toggleCompletion, archiveHabit, deleteHabit } = useHabits();
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const allHabits = useHabits().habits;

  const filteredHabits = useMemo(() => {
    let list = allHabits;
    if (selectedCategory !== 'all') {
      list = list.filter((h) => h.category === selectedCategory);
    }
    return list;
  }, [allHabits, selectedCategory]);

  const handleLongPress = useCallback(
    (habit: HabitWithStreak) => {
      Alert.alert(habit.name, 'Choose an action', [
        {
          text: 'Archive',
          onPress: async () => {
            await hapticWarning();
            await archiveHabit(habit.id);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Delete Habit', 'This action cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await hapticWarning();
                  await deleteHabit(habit.id);
                },
              },
            ]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [archiveHabit, deleteHabit]
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      <Header
        title="Habits"
        subtitle={`${filteredHabits.length} habits`}
        right={
          <TouchableOpacity
            onPress={() => router.push('/habit/new')}
            className="h-10 w-10 items-center justify-center rounded-full bg-indigo-500"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory('all')}
          className={`rounded-full px-4 py-2 ${
            selectedCategory === 'all'
              ? 'bg-indigo-500'
              : 'bg-white dark:bg-slate-800'
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selectedCategory === 'all'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            All
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setSelectedCategory(cat.key)}
            className={`rounded-full px-4 py-2 ${
              selectedCategory === cat.key
                ? 'bg-indigo-500'
                : 'bg-white dark:bg-slate-800'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selectedCategory === cat.key
                  ? 'text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Habit List */}
      {filteredHabits.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No habits found"
          description={
            selectedCategory !== 'all'
              ? 'No habits in this category'
              : 'Create your first habit to get started!'
          }
          actionLabel="Create Habit"
          onAction={() => router.push('/habit/new')}
        />
      ) : (
        <FlatList
          data={filteredHabits}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onToggle={() => void toggleCompletion(item.id)}
              onPress={() => router.push(`/habit/${item.id}`)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
