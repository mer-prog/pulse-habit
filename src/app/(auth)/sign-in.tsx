import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BrutalInput } from '@/components/brutal/BrutalInput';
import { BrutalButton } from '@/components/brutal/BrutalButton';
import { OffsetShadow } from '@/components/brutal/OffsetShadow';
import { useAuthStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToastStore } from '@/stores/toastStore';
import { brutal, fontFamily, useTheme } from '@/constants/theme';
import { MAX_EMAIL_LENGTH } from '@/constants/config';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setUser = useAuthStore((s) => s.setUser);
  const addToast = useToastStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (email.length > MAX_EMAIL_LENGTH) newErrors.email = 'Email is too long';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email';
    if (!password.trim()) newErrors.password = 'Password is required';
    // Note: No min-length check on sign-in — existing users may have shorter passwords.
    // Password strength is enforced at sign-up only.
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email ?? email, name: data.user.user_metadata?.name ?? null, avatar_url: data.user.user_metadata?.avatar_url ?? null });
        }
      } else {
        setUser({ id: 'local', email, name: email.split('@')[0] ?? 'User', avatar_url: null });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderTopWidth: 80, borderTopColor: brutal.accent, borderLeftWidth: 80, borderLeftColor: 'transparent' }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderBottomWidth: 60, borderBottomColor: colors.ink, borderRightWidth: 60, borderRightColor: 'transparent' }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ paddingHorizontal: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <OffsetShadow offset={brutal.shadowOffset}>
              <View style={{ width: 72, height: 72, backgroundColor: brutal.accent, borderWidth: 3, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 36, color: '#FFFFFF' }}>⚡</Text>
              </View>
            </OffsetShadow>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Text style={{ fontSize: 36, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink, letterSpacing: -1 }}>PULSE</Text>
              <Text style={{ fontSize: 36, fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent, letterSpacing: -1 }}>HABIT</Text>
            </View>
            <Text style={{ fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 }}>
              SMART HABIT & STREAK TRACKER
            </Text>
          </View>

          <BrutalInput label="EMAIL" placeholder="you@example.com" value={email} onChange={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} />
          <BrutalInput label="PASSWORD" placeholder="••••••••" value={password} onChange={setPassword} secureTextEntry error={errors.password} />

          <View style={{ marginTop: 4, marginBottom: 24 }}>
            <BrutalButton title="SIGN IN →" onPress={handleSignIn} loading={loading} fullWidth size="lg" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{ flex: 1, height: 2, backgroundColor: colors.border }} />
            <Text style={{ fontSize: brutal.fontSize.sm, fontFamily: fontFamily.mono, fontWeight: '700', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1 }}>OR</Text>
            <View style={{ flex: 1, height: 2, backgroundColor: colors.border }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
            {['G', '🍎', '⌨'].map((icon, i) => (
              <OffsetShadow key={i} offset={brutal.shadowOffsetSm} style={{ flex: 1 }}>
                <View style={{ height: 48, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20, fontFamily: fontFamily.heading, fontWeight: '700', color: colors.ink }}>{icon}</Text>
                </View>
              </OffsetShadow>
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontFamily: fontFamily.body, color: colors.inkMuted }}>No account? </Text>
            <Pressable onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={{ fontSize: 13, fontFamily: fontFamily.heading, fontWeight: '700', color: brutal.accent, textDecorationLine: 'underline', textDecorationStyle: 'solid' }}>SIGN UP</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
