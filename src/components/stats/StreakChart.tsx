import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { colors } from '@/constants/colors';

interface StreakDataPoint {
  value: number;
  label?: string;
}

interface StreakChartProps {
  data: StreakDataPoint[];
  title?: string;
  height?: number;
}

export function StreakChart({
  data,
  title = 'Streak Trend',
  height = 200,
}: StreakChartProps) {
  if (data.length === 0) {
    return (
      <View className="items-center justify-center py-8">
        <Text className="text-sm text-slate-400">No data available</Text>
      </View>
    );
  }

  return (
    <View>
      {title && (
        <Text className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </Text>
      )}
      <LineChart
        data={data}
        height={height}
        width={280}
        color={colors.primary}
        thickness={2}
        dataPointsColor={colors.primary}
        dataPointsRadius={4}
        startFillColor={`${colors.primary}30`}
        endFillColor={`${colors.primary}05`}
        areaChart
        curved
        hideRules
        yAxisTextStyle={{ color: '#94A3B8', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 10 }}
        noOfSections={4}
        spacing={40}
      />
    </View>
  );
}
