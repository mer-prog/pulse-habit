import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore } from '@/stores/toastStore';
import type { ToastType } from '@/types';

const TOAST_CONFIG: Record<
  ToastType,
  { icon: keyof typeof Ionicons.glyphMap; bgClass: string; iconColor: string }
> = {
  success: { icon: 'checkmark-circle', bgClass: 'bg-emerald-500', iconColor: '#FFFFFF' },
  error: { icon: 'alert-circle', bgClass: 'bg-red-500', iconColor: '#FFFFFF' },
  warning: { icon: 'warning', bgClass: 'bg-amber-500', iconColor: '#FFFFFF' },
  info: { icon: 'information-circle', bgClass: 'bg-blue-500', iconColor: '#FFFFFF' },
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute left-4 right-4 top-16 z-50">
      {toasts.map((toast) => {
        const config = TOAST_CONFIG[toast.type];
        return (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.duration(300)}
            exiting={FadeOutUp.duration(200)}
            className={`mb-2 flex-row items-center rounded-xl px-4 py-3 shadow-lg ${config.bgClass}`}
          >
            <Ionicons name={config.icon} size={20} color={config.iconColor} />
            <Text className="ml-2 flex-1 text-sm font-medium text-white">
              {toast.message}
            </Text>
            <TouchableOpacity
              onPress={() => removeToast(toast.id)}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}
