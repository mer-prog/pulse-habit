import { View, Text } from 'react-native';
import { CATEGORY_MAP } from '@/constants/categories';
import type { HabitCategory } from '@/types';

interface CategoryBadgeProps {
  category: HabitCategory;
  size?: 'small' | 'medium';
}

export function CategoryBadge({ category, size = 'small' }: CategoryBadgeProps) {
  const def = CATEGORY_MAP[category];
  const label = def?.label ?? category;
  const color = def?.color ?? '#64748B';

  return (
    <View
      className={`items-center justify-center rounded-full ${
        size === 'small' ? 'px-2.5 py-0.5' : 'px-3 py-1'
      }`}
      style={{ backgroundColor: `${color}20` }}
    >
      <Text
        className={`font-medium ${size === 'small' ? 'text-xs' : 'text-sm'}`}
        style={{ color }}
      >
        {label}
      </Text>
    </View>
  );
}
