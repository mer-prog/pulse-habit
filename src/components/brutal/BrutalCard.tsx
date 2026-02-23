import { View, ViewStyle, StyleProp } from 'react-native';
import { brutal } from '@/constants/theme';
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
  borderColor = brutal.ink,
  shadowSize = 'sm',
  pressed = false,
  style,
}: BrutalCardProps) {
  const offset =
    shadowSize === 'lg' ? brutal.shadowOffset
    : shadowSize === 'md' ? brutal.shadowOffsetSm
    : brutal.shadowOffsetSm;

  const borderWidth =
    shadowSize === 'lg' ? brutal.borderWidth.lg
    : brutal.borderWidth.md;

  return (
    <OffsetShadow offset={offset} pressed={pressed}>
      <View
        style={[
          {
            backgroundColor: '#FFFFFF',
            borderWidth,
            borderColor,
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

