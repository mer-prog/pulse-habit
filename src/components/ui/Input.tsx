import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-xl border px-4 py-3 text-base text-slate-900 dark:text-slate-100 ${
          error
            ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
        }`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error && (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      )}
    </View>
  );
}
