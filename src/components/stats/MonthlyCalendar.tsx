import { View, Text } from 'react-native';
import { useMemo } from 'react';

interface MonthlyCalendarProps {
  completedDates: Set<string>; // YYYY-MM-DD
  month: number; // 0-11
  year: number;
  color?: string;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthlyCalendar({
  completedDates,
  month,
  year,
  color = '#6366F1',
}: MonthlyCalendarProps) {
  const { weeks, monthLabel } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = new Array(startOffset).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    const monthLabel = firstDay.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return { weeks, monthLabel };
  }, [month, year, completedDates]);

  const formatDate = (day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <View>
      <Text className="mb-3 text-center text-base font-semibold text-slate-900 dark:text-slate-100">
        {monthLabel}
      </Text>
      {/* Day labels */}
      <View className="mb-1 flex-row">
        {DAY_LABELS.map((label) => (
          <View key={label} className="flex-1 items-center">
            <Text className="text-xs text-slate-400">{label}</Text>
          </View>
        ))}
      </View>
      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, di) => {
            const isCompleted = day ? completedDates.has(formatDate(day)) : false;
            const isToday =
              day !== null &&
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <View
                key={`${wi}-${di}`}
                className="flex-1 items-center py-1"
              >
                {day !== null ? (
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isToday ? 'border-2' : ''
                    }`}
                    style={{
                      backgroundColor: isCompleted ? color : 'transparent',
                      borderColor: isToday ? color : 'transparent',
                    }}
                  >
                    <Text
                      className={`text-sm ${
                        isCompleted
                          ? 'font-semibold text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </Text>
                  </View>
                ) : (
                  <View className="h-8 w-8" />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
