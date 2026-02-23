import { View, ViewStyle, StyleProp } from 'react-native';
import { brutal, useTheme } from '@/constants/theme';
import { OffsetShadow } from './OffsetShadow';

interface BrutalCardProps {
  children: React.ReactNode;
  borderColor?: string;
  shadowSize?: 'sm' | 'md' | 'lg';
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BrutalCard({
  children,
  borderColor,
  shadowSize = 'sm',
  pressed = false,
  style,
}: BrutalCardProps) {
  const { colors } = useTheme();
  const offset =
    shadowSize === 'lg' ? brutal.shadowOffset
    : brutal.shadowOffsetSm;

  const borderWidth =
    shadowSize === 'lg' ? brutal.borderWidth.lg
    : brutal.borderWidth.md;

  return (
    <OffsetShadow offset={offset} pressed={pressed}>
      <View
        style={[
          {
            backgroundColor: colors.card,
            borderWidth,
            borderColor: borderColor ?? colors.border,
            padding: brutal.space.lg,
          },
          style,
        ]}
      >
        {children}
      </View>
    </OffsetShadow>
  );
}
