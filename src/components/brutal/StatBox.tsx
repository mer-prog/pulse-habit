import { View, Text } from 'react-native';
import { brutal, fontFamily, useTheme } from '@/constants/theme';
import { OffsetShadow } from './OffsetShadow';

interface StatBoxProps {
  label: string;
  value: string | number;
  accent?: string;
}

export function StatBox({ label, value, accent = brutal.accent }: StatBoxProps) {
  const { colors } = useTheme();

  return (
    <OffsetShadow offset={brutal.shadowOffsetSm} style={{ flex: 1 }}>
      <View
        style={{
          borderWidth: brutal.borderWidth.md,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingVertical: 12,
          paddingHorizontal: 8,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: brutal.fontSize['3xl'],
            fontFamily: fontFamily.heading,
            fontWeight: '700',
            color: accent,
            lineHeight: 28,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            fontSize: brutal.fontSize.xs,
            fontFamily: fontFamily.mono,
            fontWeight: '700',
            color: colors.inkMuted,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            marginTop: 4,
          }}
        >
          {label}
        </Text>
      </View>
    </OffsetShadow>
  );
}
