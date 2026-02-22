import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text className="mb-2 text-center text-lg font-bold text-slate-900 dark:text-slate-100">
        {title}
      </Text>
      {description && (
        <Text className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="rounded-xl bg-indigo-500 px-6 py-3"
          activeOpacity={0.8}
        >
          <Text className="font-semibold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
