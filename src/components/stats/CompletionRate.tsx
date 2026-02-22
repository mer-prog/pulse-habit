import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface CompletionRateProps {
  rate: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CompletionRate({
  rate,
  size = 100,
  strokeWidth = 8,
  color = '#10B981',
  label = 'Completion',
}: CompletionRateProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.min(Math.max(rate, 0), 1), {
      duration: 800,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [rate]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const percentage = Math.round(rate * 100);

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
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
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {percentage}%
          </Text>
        </View>
      </View>
      <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {label}
      </Text>
    </View>
  );
}
