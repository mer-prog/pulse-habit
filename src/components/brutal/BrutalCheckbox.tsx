import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { hapticSuccess } from '@/lib/haptics';
import { brutal } from '@/constants/theme';

interface BrutalCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  color?: string;
  size?: number;
}

export function BrutalCheckbox({
  checked,
  onToggle,
  color = brutal.ink,
  size = 28,
}: BrutalCheckboxProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (!checked) {
      await hapticSuccess();
      scale.value = withSequence(
        withTiming(1.25, { duration: 80, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 120, easing: Easing.inOut(Easing.ease) })
      );
    }
    onToggle();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          animatedStyle,
          {
            width: size,
            height: size,
            borderWidth: 3,
            borderColor: checked ? color : brutal.ink,
            backgroundColor: checked ? color : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {checked && (
          <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 14 14" fill="none">
            <Path
              d="M3 7.5L5.5 10L11 4"
              stroke="#FFFFFF"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </Animated.View>
    </Pressable>
  );
}

