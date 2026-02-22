import { View, Text } from 'react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-2 pt-4">
      <View className="flex-1">
        <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </View>
  );
}
