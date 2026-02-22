import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useMemo } from 'react';
import { colors } from '@/constants/colors';

interface WeeklyHeatmapProps {
  completionData: Record<string, number>; // date -> count (0-1 for rate)
  weeks?: number;
  cellSize?: number;
  gap?: number;
}

export function WeeklyHeatmap({
  completionData,
  weeks = 12,
  cellSize = 14,
  gap = 3,
}: WeeklyHeatmapProps) {
  const { grid, dayLabels } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const grid: { date: string; value: number; col: number; row: number }[] = [];

    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + (6 - dayOfWeek));

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = formatDate(d);
      const col = Math.floor(i / 7);
      const row = i % 7;
      grid.push({
        date: dateStr,
        value: completionData[dateStr] ?? 0,
        col,
        row,
      });
    }

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    return { grid, dayLabels };
  }, [completionData, weeks]);

  const width = weeks * (cellSize + gap) + 30;
  const height = 7 * (cellSize + gap) + 10;

  return (
    <View>
      <View className="flex-row">
        {/* Day labels */}
        <View style={{ width: 28 }}>
          {dayLabels.map((label, i) => (
            <Text
              key={i}
              className="text-xs text-slate-400"
              style={{ height: cellSize + gap, lineHeight: cellSize + gap }}
            >
              {label}
            </Text>
          ))}
        </View>
        <Svg width={width - 30} height={height}>
          {grid.map((cell) => (
            <Rect
              key={cell.date}
              x={cell.col * (cellSize + gap)}
              y={cell.row * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={3}
              fill={getHeatmapColor(cell.value)}
            />
          ))}
        </Svg>
      </View>
      {/* Legend */}
      <View className="mt-2 flex-row items-center justify-end gap-1">
        <Text className="mr-1 text-xs text-slate-400">Less</Text>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <View
            key={v}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: getHeatmapColor(v),
            }}
          />
        ))}
        <Text className="ml-1 text-xs text-slate-400">More</Text>
      </View>
    </View>
  );
}

function getHeatmapColor(value: number): string {
  if (value <= 0) return '#E2E8F0';
  if (value <= 0.25) return '#C7D2FE';
  if (value <= 0.5) return '#A5B4FC';
  if (value <= 0.75) return '#818CF8';
  return colors.primary;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
