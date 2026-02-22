import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { hapticLight } from '@/lib/haptics';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: 'bg-indigo-500 active:bg-indigo-600',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-slate-200 dark:bg-slate-700 active:bg-slate-300',
    text: 'text-slate-900 dark:text-slate-100',
  },
  danger: {
    container: 'bg-red-500 active:bg-red-600',
    text: 'text-white',
  },
  ghost: {
    container: 'bg-transparent active:bg-slate-100 dark:active:bg-slate-800',
    text: 'text-indigo-500',
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const styles = variantStyles[variant];

  const handlePress = async () => {
    await hapticLight();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`items-center justify-center rounded-xl px-6 py-3.5 ${styles.container} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'ghost' ? '#6366F1' : '#FFFFFF'} />
      ) : (
        <Text className={`text-base font-semibold ${styles.text}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
