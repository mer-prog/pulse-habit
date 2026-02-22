import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface StreakRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  streakCount?: number;
  showPulse?: boolean;
  label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function StreakRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#6366F1',
  streakCount,
  showPulse = false,
  label,
}: StreakRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProgress = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [progress]);

  useEffect(() => {
    if (showPulse) {
      scale.value = withSequence(
        withTiming(1.15, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [showPulse]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size }, containerStyle]}
      className="items-center justify-center"
    >
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      <View className="absolute items-center">
        {streakCount !== undefined && (
          <Text className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {streakCount}
          </Text>
        )}
        {label && (
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            {label}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
