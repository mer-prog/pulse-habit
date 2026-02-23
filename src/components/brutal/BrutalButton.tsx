import { useState } from 'react';
import { Text, Pressable, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { brutal, fontFamily } from '@/constants/theme';
import { OffsetShadow } from './OffsetShadow';
import { hapticLight } from '@/lib/haptics';

interface BrutalButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BrutalButton({
  title,
  onPress,
  color = brutal.accent,
  textColor = '#FFFFFF',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
}: BrutalButtonProps) {
  const [pressed, setPressed] = useState(false);

  const padding = {
    sm: { h: 16, v: 8 },
    md: { h: 20, v: 10 },
    lg: { h: 28, v: 14 },
  }[size];

  const fontSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  const handlePress = async () => {
    if (disabled || loading) return;
    await hapticLight();
    onPress();
  };

  return (
    <OffsetShadow
      offset={brutal.shadowOffset}
      pressed={pressed}
      style={[fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }, style]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={disabled || loading}
        style={{
          backgroundColor: color,
          borderWidth: brutal.borderWidth.md,
          borderColor: brutal.ink,
          paddingHorizontal: padding.h,
          paddingVertical: padding.v,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text
            style={{
              fontSize,
              fontFamily: fontFamily.heading,
              fontWeight: '700',
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </OffsetShadow>
  );
}

