import { View, Text } from 'react-native';
import { brutal, fontFamily, useTheme } from '@/constants/theme';
import { OffsetShadow } from './OffsetShadow';
import { HatchPattern } from './HatchPattern';

interface BrutalProgressProps {
  done: number;
  total: number;
}

export function BrutalProgress({ done, total }: BrutalProgressProps) {
  const { colors } = useTheme();
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;
  const barColor = allDone ? brutal.success : brutal.accent;
  const barColorAlt = allDone ? brutal.successAlt : brutal.accentAlt;

  return (
    <OffsetShadow offset={brutal.shadowOffset}>
      <View
        style={{
          borderWidth: brutal.borderWidth.lg,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 5,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 4,
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono, fontWeight: '700', textTransform: 'uppercase', color: colors.ink }}>
            PROGRESS
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fontFamily.heading, fontWeight: '700', color: allDone ? brutal.success : brutal.accent }}>
            {pct}%
          </Text>
        </View>

        <View style={{ height: 16, backgroundColor: colors.bgAlt, overflow: 'hidden' }}>
          <View style={{ width: `${pct}%`, height: '100%' }}>
            <HatchPattern width="100%" height={16} color={barColor} colorAlt={barColorAlt} />
          </View>
        </View>

        {allDone && (
          <View style={{ marginTop: 6, backgroundColor: brutal.success, paddingVertical: 4, paddingHorizontal: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              ✓ PERFECT DAY — ALL HABITS DONE
            </Text>
          </View>
        )}
      </View>
    </OffsetShadow>
  );
}
