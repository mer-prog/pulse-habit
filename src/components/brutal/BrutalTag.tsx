import { View, Text } from 'react-native';
import { brutal, fontFamily, useTheme } from '@/constants/theme';

interface BrutalTagProps {
  children: string;
  color?: string;
  variant?: 'filled' | 'outline';
  small?: boolean;
}

export function BrutalTag({
  children,
  color,
  variant = 'outline',
  small = false,
}: BrutalTagProps) {
  const { colors } = useTheme();
  const tagColor = color ?? colors.ink;
  const isFilled = variant === 'filled';

  return (
    <View
      style={{
        paddingHorizontal: small ? 6 : 10,
        paddingVertical: small ? 2 : 3,
        backgroundColor: isFilled ? tagColor : 'transparent',
        borderWidth: isFilled ? 0 : brutal.borderWidth.md,
        borderColor: tagColor,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: small ? brutal.fontSize.xs : brutal.fontSize.sm,
          fontFamily: fontFamily.mono,
          fontWeight: '700',
          color: isFilled ? '#FFFFFF' : tagColor,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

export function BlackTag({ children }: { children: string }) {
  const { colors } = useTheme();
  return <BrutalTag variant="filled" color={colors.ink}>{children}</BrutalTag>;
}
