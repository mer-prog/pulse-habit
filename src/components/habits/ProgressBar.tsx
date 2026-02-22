import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  color = '#6366F1',
  height = 6,
}: ProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 600,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      className="w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      style={{ height }}
    >
      <Animated.View
        className="h-full rounded-full"
        style={[{ backgroundColor: color }, animatedStyle]}
      />
    </View>
  );
}
