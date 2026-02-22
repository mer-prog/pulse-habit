import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useHabits } from '@/hooks/useHabits';
import { useNotifications } from '@/hooks/useNotifications';
import { hapticSuccess } from '@/lib/haptics';
import { CATEGORIES } from '@/constants/categories';
import { HABIT_ICONS, HABIT_COLORS, WEEKDAYS, DEFAULT_REMINDER_TIME } from '@/constants/config';
import type { HabitCategory, HabitFrequency } from '@/types';

export default function NewHabitScreen() {
  const router = useRouter();
  const { createHabit } = useHabits();
  const { requestPermissions, scheduleForHabit } = useNotifications();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#6366F1');
  const [category, setCategory] = useState<HabitCategory>('other');

  // Step 2: Frequency
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  // Step 3: Reminder
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      setErrors({ name: 'Name is required' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  const toggleDay = (day: number) => {
    setTargetDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (reminderEnabled) {
        await requestPermissions();
      }

      const id = await createHabit({
        name: name.trim(),
        description: description.trim() || null,
        icon,
        color,
        category,
        frequency,
        target_days: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : targetDays,
        reminder_time: reminderEnabled ? reminderTime : null,
        reminder_enabled: reminderEnabled,
        is_archived: false,
        sort_order: 0,
      });

      await hapticSuccess();
      router.back();
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-900" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <TouchableOpacity onPress={handleBack} hitSlop={8}>
          <Ionicons
            name={step === 1 ? 'close' : 'arrow-back'}
            size={24}
            color="#64748B"
          />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
          New Habit ({step}/3)
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step indicator */}
      <View className="flex-row gap-2 px-5 pb-4">
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s <= step ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {step === 1 && (
          <View>
            <Input
              label="Habit Name"
              placeholder="e.g., Morning Jog"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <Input
              label="Description (optional)"
              placeholder="What is this habit about?"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            {/* Icon selection */}
            <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Icon
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {HABIT_ICONS.map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setIcon(i)}
                  className={`h-11 w-11 items-center justify-center rounded-xl ${
                    icon === i ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <Text className="text-2xl">{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color selection */}
            <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Color
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-3">
              {HABIT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    color === c ? 'border-2 border-slate-900 dark:border-white' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Ionicons name="checkmark" size={18} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Category selection */}
            <Text className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Category
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  className={`rounded-full px-4 py-2 ${
                    category === cat.key
                      ? 'bg-indigo-500'
                      : 'bg-white dark:bg-slate-800'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      category === cat.key
                        ? 'text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              How often?
            </Text>

            {/* Frequency options */}
            {([
              { key: 'daily' as const, label: 'Every Day', desc: 'Build a daily routine' },
              { key: 'weekly' as const, label: 'Specific Days', desc: 'Choose which days' },
              { key: 'custom' as const, label: 'Custom', desc: 'Flexible schedule' },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setFrequency(opt.key)}
                className={`mb-3 rounded-2xl border-2 p-4 ${
                  frequency === opt.key
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <Text className="font-semibold text-slate-900 dark:text-slate-100">
                  {opt.label}
                </Text>
                <Text className="mt-0.5 text-sm text-slate-500">{opt.desc}</Text>
              </TouchableOpacity>
            ))}

            {/* Day selection for weekly/custom */}
            {frequency !== 'daily' && (
              <View className="mt-4">
                <Text className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select days
                </Text>
                <View className="flex-row gap-2">
                  {WEEKDAYS.map((day) => (
                    <TouchableOpacity
                      key={day.key}
                      onPress={() => toggleDay(day.key)}
                      className={`flex-1 items-center rounded-xl py-3 ${
                        targetDays.includes(day.key)
                          ? 'bg-indigo-500'
                          : 'bg-white dark:bg-slate-800'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          targetDays.includes(day.key)
                            ? 'text-white'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Set a Reminder
            </Text>

            <Card>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="notifications" size={20} color="#6366F1" />
                  <Text className="ml-2 text-base text-slate-900 dark:text-slate-100">
                    Daily Reminder
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                  thumbColor={reminderEnabled ? '#6366F1' : '#F1F5F9'}
                />
              </View>

              {reminderEnabled && (
                <View className="mt-4">
                  <Input
                    label="Time (HH:MM)"
                    placeholder="09:00"
                    value={reminderTime}
                    onChangeText={setReminderTime}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              )}
            </Card>

            {/* Preview */}
            <Card className="mt-4">
              <Text className="mb-2 text-xs font-medium uppercase text-slate-400">
                Preview
              </Text>
              <View className="flex-row items-center">
                <View
                  className="mr-3 h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Text className="text-2xl">{icon}</Text>
                </View>
                <View>
                  <Text className="font-semibold text-slate-900 dark:text-slate-100">
                    {name || 'Habit Name'}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {frequency === 'daily'
                      ? 'Every day'
                      : `${targetDays.length} days/week`}
                    {reminderEnabled ? ` • ${reminderTime}` : ''}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View className="border-t border-slate-200 px-5 py-4 dark:border-slate-700">
        {step < 3 ? (
          <Button title="Next" onPress={handleNext} fullWidth />
        ) : (
          <Button
            title="Create Habit"
            onPress={handleCreate}
            loading={loading}
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}
