import { memo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BrutalCheckbox } from '@/components/brutal/BrutalCheckbox';
import { BrutalTag } from '@/components/brutal/BrutalTag';
import { brutal, fontFamily, categoryColors } from '@/constants/theme';
import type { HabitWithStreak } from '@/types';

interface BrutalHabitCardProps {
  habit: HabitWithStreak;
  onToggle: () => void;
  onPress: () => void;
}

function BrutalHabitCardInner({ habit, onToggle, onPress }: BrutalHabitCardProps) {
  const [pressed, setPressed] = useState(false);
  const isComplete = habit.isCompletedToday;
  const catColor = categoryColors[habit.category] || brutal.inkMuted;
  const streak = habit.streak?.current_streak ?? 0;

  const offset = brutal.shadowOffsetSm;
  const pressedOffset = brutal.shadowOffsetPressed;

  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{ position: 'relative' }}
      >
        {/* Shadow layer */}
        <View
          style={{
            position: 'absolute',
            top: offset,
            left: offset,
            right: -offset,
            bottom: -offset,
            backgroundColor: brutal.ink,
          }}
        />

        {/* Card content */}
        <View
          style={{
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: isComplete ? brutal.bgAlt : '#FFFFFF',
            borderWidth: brutal.borderWidth.md,
            borderColor: isComplete ? catColor : brutal.ink,
            overflow: 'hidden',
            transform: [
              { translateX: pressed || isComplete ? offset - pressedOffset : 0 },
              { translateY: pressed || isComplete ? offset - pressedOffset : 0 },
            ],
          }}
        >
          {/* Category triangle (top-right corner) */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderTopWidth: 16,
              borderTopColor: catColor,
              borderLeftWidth: 16,
              borderLeftColor: 'transparent',
            }}
          />

          {/* Icon */}
          <Text style={{ fontSize: 26 }}>{habit.icon}</Text>

          {/* Content */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: brutal.fontSize.lg,
                fontFamily: fontFamily.heading,
                fontWeight: '700',
                color: isComplete ? brutal.inkMuted : brutal.ink,
                textDecorationLine: isComplete ? 'line-through' : 'none',
                textDecorationStyle: 'solid',
              }}
            >
              {habit.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginTop: 3,
              }}
            >
              <BrutalTag color={catColor} small>
                {habit.category}
              </BrutalTag>
              {streak > 0 && (
                <Text
                  style={{
                    fontSize: brutal.fontSize.md,
                    fontFamily: fontFamily.mono,
                    fontWeight: '700',
                    color: brutal.accent,
                  }}
                >
                  🔥{streak}d
                </Text>
              )}
              {habit.reminder_time && (
                <Text
                  style={{
                    fontSize: brutal.fontSize.sm,
                    fontFamily: fontFamily.monoRegular,
                    color: brutal.inkMuted,
                  }}
                >
                  {habit.reminder_time}
                </Text>
              )}
            </View>
          </View>

          {/* Checkbox */}
          <BrutalCheckbox
            checked={isComplete}
            onToggle={onToggle}
            color={catColor}
          />
        </View>
      </Pressable>
    </View>
  );
}

export const BrutalHabitCard = memo(BrutalHabitCardInner);

