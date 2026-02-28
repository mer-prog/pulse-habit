import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTranslation } from 'react-i18next';
import { BrutalInput } from '@/components/brutal/BrutalInput';
import { BrutalButton } from '@/components/brutal/BrutalButton';
import { OffsetShadow } from '@/components/brutal/OffsetShadow';
import { useAuthStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToastStore } from '@/stores/toastStore';
import { brutal, fontFamily, useTheme } from '@/constants/theme';
import { MIN_PASSWORD_LENGTH, MAX_NAME_LENGTH, MAX_EMAIL_LENGTH } from '@/constants/config';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const addToast = useToastStore((s) => s.addToast);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('auth.errors.nameRequired');
    else if (name.trim().length > MAX_NAME_LENGTH) newErrors.name = t('auth.errors.nameMax', { count: MAX_NAME_LENGTH });
    if (!email.trim()) newErrors.email = t('auth.errors.emailRequired');
    else if (email.length > MAX_EMAIL_LENGTH) newErrors.email = t('auth.errors.emailTooLong');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t('auth.errors.emailInvalid');
    if (!password.trim()) newErrors.password = t('auth.errors.passwordRequired');
    else if (password.length < MIN_PASSWORD_LENGTH) newErrors.password = t('auth.errors.passwordMin', { count: MIN_PASSWORD_LENGTH });
    else if (!/[A-Z]/.test(password)) newErrors.password = t('auth.errors.passwordUppercase');
    else if (!/[0-9]/.test(password)) newErrors.password = t('auth.errors.passwordNumber');
    if (password !== confirmPassword) newErrors.confirmPassword = t('auth.errors.passwordMismatch');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email ?? email, name, avatar_url: null });
          addToast('success', t('auth.accountCreated'));
        }
      } else {
        setUser({ id: 'local', email, name, avatar_url: null });
        addToast('success', t('auth.accountCreatedOffline'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.signUpFailed');
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTopWidth: 80, borderTopColor: brutal.success, borderLeftWidth: 80, borderLeftColor: 'transparent' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderBottomWidth: 60, borderBottomColor: colors.ink, borderRightWidth: 60, borderRightColor: 'transparent' }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 32, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, letterSpacing: -1 }}>{t('auth.create')}</Text>
              <Text style={{ fontSize: 32, fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent, letterSpacing: -1 }}>.</Text>
            </View>
            <Text style={{ fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 }}>
              {t('auth.startTracking')}
            </Text>
          </View>

          <BrutalInput label={t('auth.name')} placeholder={t('auth.namePlaceholder')} value={name} onChange={setName} autoCapitalize="words" error={errors.name} />
          <BrutalInput label={t('auth.email')} placeholder={t('auth.emailPlaceholder')} value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} />
          <BrutalInput label={t('auth.password')} placeholder={t('auth.passwordMinPlaceholder')} value={password} onChange={setPassword} secureTextEntry error={errors.password} />
          <BrutalInput label={t('auth.confirmPassword')} placeholder={t('auth.confirmPasswordPlaceholder')} value={confirmPassword} onChange={setConfirmPassword} secureTextEntry error={errors.confirmPassword} />

          <View style={{ marginTop: 4, marginBottom: 28 }}>
            <BrutalButton title={t('auth.createAccount')} onPress={handleSignUp} loading={loading} fullWidth size="lg" color={brutal.success} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontFamily: fontFamily.body, color: colors.inkMuted }}>{t('auth.hasAccount')}</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontSize: 13, fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent, textDecorationLine: 'underline', textDecorationStyle: 'solid' }}>{t('auth.signIn').replace(' →', '')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
