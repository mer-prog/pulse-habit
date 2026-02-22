import { TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useEffect } from 'react';
import { hapticSuccess } from '@/lib/haptics';

interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  color?: string;
  size?: number;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export function AnimatedCheckbox({
  checked,
  onToggle,
  color = '#6366F1',
  size = 28,
}: AnimatedCheckboxProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(checked ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    if (checked) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 100 }),
        withTiming(1, { duration: 150 })
      );
    }
  }, [checked]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = async () => {
    if (!checked) await hapticSuccess();
    onToggle();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <AnimatedSvg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        style={animatedStyle}
      >
        {/* Background circle */}
        <Circle
          cx="14"
          cy="14"
          r="13"
          stroke={color}
          strokeWidth="2"
          fill={checked ? color : 'transparent'}
        />
        {/* Checkmark */}
        <Animated.View style={checkStyle}>
          <Svg width={size} height={size} viewBox="0 0 28 28" style={{ position: 'absolute' }}>
            <Path
              d="M8 14.5L12 18.5L20 10.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </AnimatedSvg>
    </TouchableOpacity>
  );
}
