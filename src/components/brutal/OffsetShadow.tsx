import { View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { brutal } from '@/constants/theme';

interface OffsetShadowProps {
  children: React.ReactNode;
  offset?: number;
  color?: string;
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps any component with a brutalist offset shadow.
 * When `pressed` is true, shadow collapses and content shifts.
 */
export function OffsetShadow({
  children,
  offset = brutal.shadowOffset,
  color = brutal.ink,
  pressed = false,
  style,
}: OffsetShadowProps) {
  const translate = useSharedValue(0);
  const shadowOpacity = useSharedValue(1);

  const currentOffset = pressed ? brutal.shadowOffsetPressed : offset;

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(pressed ? offset - currentOffset : 0, { duration: 80 }) },
      { translateY: withTiming(pressed ? offset - currentOffset : 0, { duration: 80 }) },
    ],
  }));

  return (
    <View style={[{ position: 'relative' }, style]}>
      {/* Shadow layer */}
      <View
        style={{
          position: 'absolute',
          top: offset,
          left: offset,
          right: -offset,
          bottom: -offset,
          backgroundColor: color,
        }}
      />
      {/* Content layer */}
      <Animated.View style={[{ position: 'relative' }, contentStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

