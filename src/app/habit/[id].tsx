import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StreakRing } from '@/components/habits/StreakRing';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { MonthlyCalendar } from '@/components/stats/MonthlyCalendar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CategoryBadge } from '@/components/habits/CategoryBadge';
import { useHabitStore } from '@/stores/habitStore';
import { useStreak } from '@/hooks/useStreak';
import * as db from '@/lib/database';
import { hapticWarning, hapticSuccess } from '@/lib/haptics';
import { colors } from '@/constants/colors';
import { HABIT_ICONS, HABIT_COLORS } from '@/constants/config';
import type { Completion } from '@/types';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const EMPTY_COMPLETIONS: Completion[] = [];
  const completions = useHabitStore((s) => s.completions[id ?? '']) ?? EMPTY_COMPLETIONS;
  const streak = useStreak(id ?? '');
  const updateHabitInStore = useHabitStore((s) => s.updateHabitInStore);
  const removeHabit = useHabitStore((s) => s.removeHabit);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    if (habit) {
      setEditName(habit.name);
      setEditIcon(habit.icon);
      setEditColor(habit.color);
    }
  }, [habit]);

  const now = new Date();

  const completedDates = useMemo(
    () => new Set(completions.map((c) => c.completed_date)),
    [completions]
  );

  const photosTimeline = useMemo(
    () =>
      completions
        .filter((c) => c.photo_uri)
        .sort(
          (a, b) =>
            new Date(b.completed_date).getTime() -
            new Date(a.completed_date).getTime()
        ),
    [completions]
  );

  const handleDelete = () => {
    Alert.alert('Delete Habit', 'This action cannot be undone. All data for this habit will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await hapticWarning();
          if (id) {
            await db.deleteHabit(database, id);
            removeHabit(id);
          }
          router.back();
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!id || !editName.trim()) return;
    await db.updateHabit(database, id, {
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
    });
    updateHabitInStore(id, {
      name: editName.trim(),
      icon: editIcon,
      color: editColor,
    });
    await hapticSuccess();
    setEditModalVisible(false);
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0] && id) {
      const today = db.getDateString(new Date());
      await db.addCompletionNote(database, id, today, null, result.assets[0].uri);
    }
  };

  if (!habit || !id) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color="#64748B" />
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setEditModalVisible(true)}
            className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800"
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20"
          >
            <Ionicons name="trash" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Habit Info */}
        <View className="items-center py-4">
          <Text className="mb-2 text-4xl">{habit.icon}</Text>
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {habit.name}
          </Text>
          <View className="mt-2">
            <CategoryBadge category={habit.category} size="medium" />
          </View>
        </View>

        {/* Streak Ring */}
        <Card className="mb-4 items-center">
          <StreakRing
            progress={streak.current_streak > 0 ? Math.min(streak.current_streak / 30, 1) : 0}
            size={160}
            strokeWidth={12}
            color={habit.color}
            streakCount={streak.current_streak}
            label="day streak"
          />
          <View className="mt-4 flex-row">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {streak.current_streak}
              </Text>
              <Text className="text-xs text-slate-500">Current</Text>
            </View>
            <View className="w-px bg-slate-200 dark:bg-slate-700" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {streak.longest_streak}
              </Text>
              <Text className="text-xs text-slate-500">Longest</Text>
            </View>
          </View>
        </Card>

        {/* Calendar */}
        <Card className="mb-4">
          <MonthlyCalendar
            completedDates={completedDates}
            month={now.getMonth()}
            year={now.getFullYear()}
            color={habit.color}
          />
        </Card>

        {/* Photo Timeline */}
        {photosTimeline.length > 0 && (
          <Card className="mb-4">
            <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
              Photo Timeline
            </Text>
            <FlatList
              horizontal
              data={photosTimeline}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View className="mr-3">
                  <Image
                    source={{ uri: item.photo_uri! }}
                    className="h-20 w-20 rounded-xl"
                    resizeMode="cover"
                  />
                  <Text className="mt-1 text-center text-xs text-slate-400">
                    {item.completed_date.slice(5)}
                  </Text>
                </View>
              )}
            />
          </Card>
        )}

        {/* Add Photo button */}
        <Button
          title="Add Photo"
          onPress={handleAddPhoto}
          variant="secondary"
          fullWidth
        />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title="Edit Habit"
      >
        <ScrollView className="px-5 pt-4">
          <Input
            label="Name"
            value={editName}
            onChangeText={setEditName}
            placeholder="Habit name"
          />

          <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Icon
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {HABIT_ICONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                onPress={() => setEditIcon(icon)}
                className={`h-10 w-10 items-center justify-center rounded-lg ${
                  editIcon === icon ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <Text className="text-xl">{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Color
          </Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {HABIT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setEditColor(c)}
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  editColor === c ? 'border-2 border-slate-900 dark:border-white' : ''
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </View>

          <Button title="Save Changes" onPress={handleSaveEdit} fullWidth />
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}
