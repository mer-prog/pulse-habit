import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, Alert,
  Image, FlatList, Modal as RNModal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { StreakRing } from '@/components/habits/StreakRing';
import { BrutalButton, BrutalInput, OffsetShadow, BrutalTag } from '@/components/brutal';
import { brutal, fontFamily, useTheme, categoryColors } from '@/constants/theme';
import { CATEGORY_MAP } from '@/constants/categories';
import { useHabitStore } from '@/stores/habitStore';
import { useStreak } from '@/hooks/useStreak';
import * as db from '@/lib/database';
import { hapticWarning, hapticSuccess } from '@/lib/haptics';
import { HABIT_ICONS, HABIT_COLORS } from '@/constants/config';
import type { Completion } from '@/types';

function BrutalMonthlyCalendar({
  completedDates, month, year, color,
}: { completedDates: Set<string>; month: number; year: number; color: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const DAY_LABELS = dayKeys.map((k) => t(`weekdaysShort.${k}`));

  const { weeks, monthLabel } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = new Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push(d);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) { while (currentWeek.length < 7) currentWeek.push(null); weeks.push(currentWeek); }
    const monthName = t(`months.${month}`);
    const monthLabel = t('date.monthYear', { monthName, year }).toUpperCase();
    return { weeks, monthLabel };
  }, [month, year, completedDates, t]);

  const formatDate = (day: number): string => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <View>
      <Text style={{ textAlign: 'center', fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 10 }}>{monthLabel}</Text>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: brutal.fontSize.xs, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted }}>{label}</Text>
          </View>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row' }}>
          {week.map((day, di) => {
            const isCompleted = day ? completedDates.has(formatDate(day)) : false;
            const isToday = day !== null && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            return (
              <View key={`${wi}-${di}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 3 }}>
                {day !== null ? (
                  <View style={{
                    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isCompleted ? color : 'transparent',
                    borderWidth: isToday ? 2 : 0, borderColor: isToday ? color : 'transparent',
                  }}>
                    <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: isCompleted ? '#FFFFFF' : colors.inkSoft }}>{day}</Text>
                  </View>
                ) : <View style={{ width: 30, height: 30 }} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const habit = useHabitStore((s) => s.habits.find((h) => h.id === id));
  const EMPTY_COMPLETIONS: Completion[] = [];
  const completions = useHabitStore((s) => s.completions[id ?? '']) ?? EMPTY_COMPLETIONS;
  const streak = useStreak(id ?? '');
  const updateHabitInStore = useHabitStore((s) => s.updateHabitInStore);
  const removeHabit = useHabitStore((s) => s.removeHabit);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    if (habit) { setEditName(habit.name); setEditIcon(habit.icon); setEditColor(habit.color); }
  }, [habit]);

  const now = new Date();
  const completedDates = useMemo(() => new Set(completions.map((c) => c.completed_date)), [completions]);
  const photosTimeline = useMemo(() => completions.filter((c) => c.photo_uri).sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime()), [completions]);

  const catDef = habit ? CATEGORY_MAP[habit.category] : null;

  const handleDelete = () => {
    Alert.alert(t('habit.deleteHabit'), t('habit.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          await hapticWarning();
          if (id) { await db.deleteHabit(database, id); removeHabit(id); }
          router.back();
        },
      },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!id || !editName.trim()) return;
    await db.updateHabit(database, id, { name: editName.trim(), icon: editIcon, color: editColor });
    updateHabitInStore(id, { name: editName.trim(), icon: editIcon, color: editColor });
    await hapticSuccess();
    setEditModalVisible(false);
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0] && id) {
      const today = db.getDateString(new Date());
      await db.addCompletionNote(database, id, today, null, result.assets[0].uri);
    }
  };

  if (!habit || !id) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: colors.inkMuted, fontFamily: fontFamily.mono }}>{t('common.loading')}</Text></View>;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontSize: 22, color: colors.ink }}>←</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => setEditModalVisible(true)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card }}>
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.ink }}>{t('common.edit')}</Text>
          </Pressable>
          <Pressable onPress={handleDelete} style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: brutal.rose, backgroundColor: isDark ? '#1A0808' : '#FFF5F5' }}>
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: brutal.rose }}>{t('common.delete')}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Habit Info */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Text style={{ fontSize: 42, marginBottom: 8 }}>{habit.icon}</Text>
          <Text style={{ fontSize: brutal.fontSize['2xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{habit.name}</Text>
          {catDef && (
            <View style={{ marginTop: 8 }}>
              <BrutalTag color={catDef.color}>{t(`categories.${catDef.key}`).toUpperCase()}</BrutalTag>
            </View>
          )}
        </View>

        {/* Streak Ring */}
        <OffsetShadow offset={brutal.shadowOffset}>
          <View style={{ borderWidth: 3, borderColor: colors.border, backgroundColor: colors.card, padding: 20, alignItems: 'center', marginBottom: 16 }}>
            <StreakRing
              progress={streak.current_streak > 0 ? Math.min(streak.current_streak / 30, 1) : 0}
              size={160} strokeWidth={12} color={habit.color}
              streakCount={streak.current_streak} label={t('today.dayStreak')}
            />
            <View style={{ flexDirection: 'row', marginTop: 16, width: '100%' }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: brutal.fontSize['2xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{streak.current_streak}</Text>
                <Text style={{ fontSize: brutal.fontSize.xs, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted, letterSpacing: 1 }}>{t('habit.current')}</Text>
              </View>
              <View style={{ width: 2, backgroundColor: colors.border }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: brutal.fontSize['2xl'], fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{streak.longest_streak}</Text>
                <Text style={{ fontSize: brutal.fontSize.xs, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted, letterSpacing: 1 }}>{t('habit.longestStreak')}</Text>
              </View>
            </View>
          </View>
        </OffsetShadow>

        {/* Calendar */}
        <OffsetShadow offset={brutal.shadowOffsetSm}>
          <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
            <BrutalMonthlyCalendar completedDates={completedDates} month={now.getMonth()} year={now.getFullYear()} color={habit.color} />
          </View>
        </OffsetShadow>

        {/* Photo Timeline */}
        {photosTimeline.length > 0 && (
          <OffsetShadow offset={brutal.shadowOffsetSm}>
            <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 10 }}>{t('habit.photoTimeline')}</Text>
              <FlatList
                horizontal data={photosTimeline} keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={{ marginRight: 10 }}>
                    <Image source={{ uri: item.photo_uri! }} style={{ width: 72, height: 72, borderWidth: 2, borderColor: colors.border }} resizeMode="cover" />
                    <Text style={{ marginTop: 2, textAlign: 'center', fontSize: brutal.fontSize.xs, fontFamily: fontFamily.monoRegular, color: colors.inkMuted }}>{item.completed_date.slice(5)}</Text>
                  </View>
                )}
              />
            </View>
          </OffsetShadow>
        )}

        <BrutalButton title={t('habit.addPhoto')} onPress={handleAddPhoto} color={colors.ink} textColor={isDark ? colors.bg : colors.bg} fullWidth />
      </ScrollView>

      {/* Edit Modal */}
      <RNModal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 3, borderBottomColor: colors.border, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: brutal.fontSize.xl, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{t('habit.editHabit')}</Text>
            <Pressable onPress={() => setEditModalVisible(false)} hitSlop={8}>
              <Text style={{ fontSize: 22, color: colors.ink }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <BrutalInput label={t('habit.nameLabel')} value={editName} onChangeText={setEditName} placeholder={t('habit.habitNameDefault')} />

            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 8 }}>{t('habit.icon')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {HABIT_ICONS.map((ic) => (
                <Pressable key={ic} onPress={() => setEditIcon(ic)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: editIcon === ic ? brutal.accent : colors.border, backgroundColor: editIcon === ic ? (isDark ? '#2A1A0A' : '#FFF3E0') : colors.card }}>
                  <Text style={{ fontSize: 20 }}>{ic}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 8 }}>{t('habit.color')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {HABIT_COLORS.map((c) => (
                <Pressable key={c} onPress={() => setEditColor(c)} style={{ width: 38, height: 38, backgroundColor: c, borderWidth: editColor === c ? 3 : 2, borderColor: editColor === c ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  {editColor === c && <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>✓</Text>}
                </Pressable>
              ))}
            </View>

            <BrutalButton title={t('habit.saveChanges')} onPress={handleSaveEdit} fullWidth />
          </ScrollView>
        </View>
      </RNModal>
    </SafeAreaView>
  );
}

