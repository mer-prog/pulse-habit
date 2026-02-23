import { memo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { BrutalCheckbox } from '@/components/brutal/BrutalCheckbox';
import { BrutalTag } from '@/components/brutal/BrutalTag';
import { brutal, fontFamily, categoryColors, useTheme } from '@/constants/theme';
import type { HabitWithStreak } from '@/types';

interface BrutalHabitCardProps {
  habit: HabitWithStreak;
  onToggle: () => void;
  onPress: () => void;
}

function BrutalHabitCardInner({ habit, onToggle, onPress }: BrutalHabitCardProps) {
  const [pressed, setPressed] = useState(false);
  const { colors } = useTheme();
  const isComplete = habit.isCompletedToday;
  const catColor = categoryColors[habit.category] || colors.inkMuted;
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
        <View
          style={{
            position: 'absolute',
            top: offset, left: offset, right: -offset, bottom: -offset,
            backgroundColor: colors.shadow,
          }}
        />
        <View
          style={{
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            backgroundColor: isComplete ? colors.bgAlt : colors.card,
            borderWidth: brutal.borderWidth.md,
            borderColor: isComplete ? catColor : colors.border,
            overflow: 'hidden',
            transform: [
              { translateX: pressed || isComplete ? offset - pressedOffset : 0 },
              { translateY: pressed || isComplete ? offset - pressedOffset : 0 },
            ],
          }}
        >
          <View
            style={{
              position: 'absolute', top: 0, right: 0,
              width: 0, height: 0,
              borderTopWidth: 16, borderTopColor: catColor,
              borderLeftWidth: 16, borderLeftColor: 'transparent',
            }}
          />

          <Text style={{ fontSize: 26 }}>{habit.icon}</Text>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: brutal.fontSize.lg,
                fontFamily: fontFamily.heading,
                fontWeight: '700',
                color: isComplete ? colors.inkMuted : colors.ink,
                textDecorationLine: isComplete ? 'line-through' : 'none',
                textDecorationStyle: 'solid',
              }}
            >
              {habit.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <BrutalTag color={catColor} small>{habit.category}</BrutalTag>
              {streak > 0 && (
                <Text style={{ fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono, fontWeight: '700', color: brutal.accent }}>
                  🔥{streak}d
                </Text>
              )}
              {habit.reminder_time && (
                <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: colors.inkMuted }}>
                  {habit.reminder_time}
                </Text>
              )}
            </View>
          </View>

          <BrutalCheckbox checked={isComplete} onToggle={onToggle} color={catColor} />
        </View>
      </Pressable>
    </View>
  );
}

export const BrutalHabitCard = memo(BrutalHabitCardInner);
