import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrutalButton, BrutalInput, OffsetShadow } from '@/components/brutal';
import { brutal, fontFamily, useTheme } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import { useNotifications } from '@/hooks/useNotifications';
import { hapticSuccess } from '@/lib/haptics';
import { CATEGORIES } from '@/constants/categories';
import { HABIT_ICONS, HABIT_COLORS, WEEKDAYS, DEFAULT_REMINDER_TIME } from '@/constants/config';
import type { HabitCategory, HabitFrequency } from '@/types';

export default function NewHabitScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { createHabit } = useHabits();
  const { requestPermissions } = useNotifications();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#6366F1');
  const [category, setCategory] = useState<HabitCategory>('other');

  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(DEFAULT_REMINDER_TIME);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    if (!name.trim()) { setErrors({ name: 'Name is required' }); return false; }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const toggleDay = (day: number) => {
    setTargetDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      if (reminderEnabled) await requestPermissions();
      await createHabit({
        name: name.trim(),
        description: description.trim() || null,
        icon, color, category, frequency,
        target_days: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : targetDays,
        reminder_time: reminderEnabled ? reminderTime : null,
        reminder_enabled: reminderEnabled,
        is_archived: false,
        sort_order: 0,
      });
      await hapticSuccess();
      router.back();
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Text style={{ fontSize: 22, color: colors.ink }}>{step === 1 ? '✕' : '←'}</Text>
        </Pressable>
        <Text style={{ fontSize: brutal.fontSize.base, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.ink, letterSpacing: 1 }}>
          NEW HABIT ({step}/3)
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step indicator */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 16 }}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={{ flex: 1, height: 4, backgroundColor: s <= step ? brutal.accent : colors.borderLight, borderWidth: 1, borderColor: s <= step ? brutal.accent : colors.border }} />
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {step === 1 && (
          <View>
            <BrutalInput label="HABIT NAME" placeholder="e.g., Morning Jog" value={name} onChangeText={setName} error={errors.name} />
            <BrutalInput label="DESCRIPTION (OPTIONAL)" placeholder="What is this habit about?" value={description} onChangeText={setDescription} multiline numberOfLines={2} />

            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 8 }}>ICON</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {HABIT_ICONS.map((i) => (
                <Pressable key={i} onPress={() => setIcon(i)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: icon === i ? brutal.accent : colors.border, backgroundColor: icon === i ? (isDark ? '#2A1A0A' : '#FFF3E0') : colors.card }}>
                  <Text style={{ fontSize: 22 }}>{i}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 8 }}>COLOR</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {HABIT_COLORS.map((c) => (
                <Pressable key={c} onPress={() => setColor(c)} style={{ width: 38, height: 38, backgroundColor: c, borderWidth: color === c ? 3 : 2, borderColor: color === c ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  {color === c && <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>✓</Text>}
                </Pressable>
              ))}
            </View>

            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 8 }}>CATEGORY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.key;
                return (
                  <Pressable key={cat.key} onPress={() => setCategory(cat.key)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderWidth: 2, borderColor: isActive ? cat.color : colors.border, backgroundColor: isActive ? cat.color : colors.card }}>
                    <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: isActive ? '#FFFFFF' : colors.ink, letterSpacing: 0.5 }}>{cat.label.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={{ fontSize: brutal.fontSize.lg, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, marginBottom: 16 }}>How often?</Text>
            {([
              { key: 'daily' as const, label: 'EVERY DAY', desc: 'Build a daily routine' },
              { key: 'weekly' as const, label: 'SPECIFIC DAYS', desc: 'Choose which days' },
              { key: 'custom' as const, label: 'CUSTOM', desc: 'Flexible schedule' },
            ]).map((opt) => {
              const isActive = frequency === opt.key;
              return (
                <Pressable key={opt.key} onPress={() => setFrequency(opt.key)} style={{ marginBottom: 10, padding: 14, borderWidth: 2, borderColor: isActive ? brutal.accent : colors.border, backgroundColor: isActive ? (isDark ? '#1A1008' : '#FFF8F0') : colors.card }}>
                  <Text style={{ fontSize: brutal.fontSize.base, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{opt.label}</Text>
                  <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: colors.inkMuted, marginTop: 2 }}>{opt.desc}</Text>
                </Pressable>
              );
            })}
            {frequency !== 'daily' && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkSoft, letterSpacing: 1, marginBottom: 10 }}>SELECT DAYS</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {WEEKDAYS.map((day) => {
                    const isActive = targetDays.includes(day.key);
                    return (
                      <Pressable key={day.key} onPress={() => toggleDay(day.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 2, borderColor: isActive ? brutal.accent : colors.border, backgroundColor: isActive ? brutal.accent : colors.card }}>
                        <Text style={{ fontSize: brutal.fontSize.xs, fontFamily: fontFamily.mono, fontWeight: '700', color: isActive ? '#FFFFFF' : colors.ink }}>{day.label.charAt(0)}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={{ fontSize: brutal.fontSize.lg, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, marginBottom: 16 }}>Set a Reminder</Text>
            <OffsetShadow offset={brutal.shadowOffsetSm}>
              <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: brutal.fontSize.base, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>⏰ Daily Reminder</Text>
                  <Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ false: colors.borderLight, true: brutal.accent }} thumbColor={reminderEnabled ? '#FFFFFF' : colors.inkMuted} />
                </View>
                {reminderEnabled && (
                  <View style={{ marginTop: 12 }}>
                    <BrutalInput label="TIME (HH:MM)" placeholder="09:00" value={reminderTime} onChangeText={setReminderTime} keyboardType="numbers-and-punctuation" />
                  </View>
                )}
              </View>
            </OffsetShadow>

            <OffsetShadow offset={brutal.shadowOffsetSm}>
              <View style={{ borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, padding: 14, marginTop: 16 }}>
                <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted, letterSpacing: 1, marginBottom: 10 }}>PREVIEW</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderWidth: 2, borderColor: colors.border, backgroundColor: `${color}20`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 24 }}>{icon}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: brutal.fontSize.lg, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{name || 'Habit Name'}</Text>
                    <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.monoRegular, color: colors.inkMuted }}>
                      {frequency === 'daily' ? 'Every day' : `${targetDays.length} days/week`}{reminderEnabled ? ` · ${reminderTime}` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            </OffsetShadow>
          </View>
        )}
      </ScrollView>

      <View style={{ borderTopWidth: 3, borderTopColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.bg }}>
        {step < 3 ? (
          <BrutalButton title="NEXT" onPress={handleNext} fullWidth />
        ) : (
          <BrutalButton title="CREATE HABIT" onPress={handleCreate} loading={loading} fullWidth />
        )}
      </View>
    </SafeAreaView>
  );
}

