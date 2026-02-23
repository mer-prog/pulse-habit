import { View, Text } from 'react-native';
import { brutal, fontFamily } from '@/constants/theme';

interface BrutalTagProps {
  children: string;
  color?: string;
  variant?: 'filled' | 'outline';
  small?: boolean;
}

export function BrutalTag({
  children,
  color = brutal.ink,
  variant = 'outline',
  small = false,
}: BrutalTagProps) {
  const isFilled = variant === 'filled';

  return (
    <View
      style={{
        paddingHorizontal: small ? 6 : 10,
        paddingVertical: small ? 2 : 3,
        backgroundColor: isFilled ? color : 'transparent',
        borderWidth: isFilled ? 0 : brutal.borderWidth.md,
        borderColor: color,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: small ? brutal.fontSize.xs : brutal.fontSize.sm,
          fontFamily: fontFamily.mono,
          fontWeight: '700',
          color: isFilled ? brutal.white : color,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

/** Convenience: black filled tag */
export function BlackTag({ children }: { children: string }) {
  return <BrutalTag variant="filled" color={brutal.ink}>{children}</BrutalTag>;
}

