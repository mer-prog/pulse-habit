import Svg, { Rect, Defs, Pattern, Line } from 'react-native-svg';
import { View, ViewStyle, StyleProp, DimensionValue } from 'react-native';

interface HatchPatternProps {
  width: DimensionValue;
  height: number;
  color: string;
  colorAlt: string;
  stripeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders a diagonal hatching stripe pattern via SVG.
 * Used inside progress bars and highlight areas.
 */
export function HatchPattern({
  width,
  height,
  color,
  colorAlt,
  stripeWidth = 8,
  style,
}: HatchPatternProps) {
  const gap = stripeWidth * 2;

  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]}>
      <Svg width="100%" height={height}>
        <Defs>
          <Pattern
            id="hatch"
            patternUnits="userSpaceOnUse"
            width={gap}
            height={gap}
            patternTransform="rotate(45)"
          >
            <Rect width={stripeWidth} height={gap} fill={color} />
            <Rect x={stripeWidth} width={stripeWidth} height={gap} fill={colorAlt} />
          </Pattern>
        </Defs>
        <Rect width="100%" height={height} fill={`url(#hatch)`} />
      </Svg>
    </View>
  );
}

