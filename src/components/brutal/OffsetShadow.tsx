import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { brutal, useTheme } from '@/constants/theme';

interface OffsetShadowProps {
  children: React.ReactNode;
  offset?: number;
  color?: string;
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function OffsetShadow({
  children,
  offset = brutal.shadowOffset,
  color,
  pressed = false,
  style,
}: OffsetShadowProps) {
  const { colors } = useTheme();
  const shadowColor = color ?? colors.shadow;
  const currentOffset = pressed ? brutal.shadowOffsetPressed : offset;

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(pressed ? offset - currentOffset : 0, { duration: 80 }) },
      { translateY: withTiming(pressed ? offset - currentOffset : 0, { duration: 80 }) },
    ],
  }));

  return (
    <View style={[{ position: 'relative' }, style]}>
      <View
        style={{
          position: 'absolute',
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          backgroundColor: shadowColor,
        }}
      />
      <Animated.View style={[{ position: 'relative' }, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}
