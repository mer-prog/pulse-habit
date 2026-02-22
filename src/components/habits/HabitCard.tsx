import { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedCheckbox } from '@/components/ui/AnimatedCheckbox';
import { CategoryBadge } from './CategoryBadge';
import type { HabitWithStreak } from '@/types';

interface HabitCardProps {
  habit: HabitWithStreak;
  onToggle: () => void;
  onPress: () => void;
  onLongPress?: () => void;
}

function HabitCardInner({ habit, onToggle, onPress, onLongPress }: HabitCardProps) {
  const flashOpacity = useSharedValue(0);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const handleToggle = () => {
    if (!habit.isCompletedToday) {
      flashOpacity.value = withSequence(
        withTiming(0.3, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
    }
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800"
    >
      {/* Flash overlay */}
      <Animated.View
        className="absolute inset-0 z-10 bg-emerald-400"
        style={flashStyle}
        pointerEvents="none"
      />

      <View className="flex-row items-center p-4">
        {/* Icon */}
        <View
          className="mr-3 h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          <Text className="text-2xl">{habit.icon}</Text>
        </View>

        {/* Content */}
        <View className="mr-3 flex-1">
          <Text className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {habit.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <CategoryBadge category={habit.category} />
            {habit.streak.current_streak > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="flame" size={14} color="#F59E0B" />
                <Text className="ml-0.5 text-xs font-medium text-amber-500">
                  {habit.streak.current_streak}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Checkbox */}
        <AnimatedCheckbox
          checked={habit.isCompletedToday}
          onToggle={handleToggle}
          color={habit.color}
        />
      </View>
    </TouchableOpacity>
  );
}

export const HabitCard = memo(HabitCardInner);
