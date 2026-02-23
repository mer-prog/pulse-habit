import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BrutalInput } from '@/components/brutal/BrutalInput';
import { BrutalButton } from '@/components/brutal/BrutalButton';
import { OffsetShadow } from '@/components/brutal/OffsetShadow';
import { useAuthStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToastStore } from '@/stores/toastStore';
import { brutal, fontFamily } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
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
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Min 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email ?? email,
            name,
            avatar_url: null,
          });
          addToast('success', 'Account created!');
        }
      } else {
        setUser({ id: 'local', email, name, avatar_url: null });
        addToast('success', 'Account created (offline)');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: brutal.bg }}
    >
      {/* Corner decorations */}
      <View
        style={{
          position: 'absolute', top: 0, right: 0,
          width: 0, height: 0,
          borderTopWidth: 80, borderTopColor: brutal.success,
          borderLeftWidth: 80, borderLeftColor: 'transparent',
        }}
      />
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 0, height: 0,
          borderBottomWidth: 60, borderBottomColor: brutal.ink,
          borderRightWidth: 60, borderRightColor: 'transparent',
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={{ paddingHorizontal: 24 }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ flexDirection: 'row' }}>
              <Text
                style={{
                  fontSize: 32, fontFamily: fontFamily.heading,
                  fontWeight: '700', color: brutal.ink, letterSpacing: -1,
                }}
              >
                CREATE
              </Text>
              <Text
                style={{
                  fontSize: 32, fontFamily: fontFamily.heading,
                  fontWeight: '700', color: brutal.accent, letterSpacing: -1,
                }}
              >
                .
              </Text>
            </View>
            <Text
              style={{
                fontSize: brutal.fontSize.md, fontFamily: fontFamily.mono,
                fontWeight: '700', color: brutal.inkMuted,
                textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4,
              }}
            >
              START TRACKING YOUR HABITS
            </Text>
          </View>

          {/* Form */}
          <BrutalInput
            label="NAME"
            placeholder="Your name"
            value={name}
            onChange={setName}
            autoCapitalize="words"
            error={errors.name}
          />
          <BrutalInput
            label="EMAIL"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <BrutalInput
            label="PASSWORD"
            placeholder="At least 6 characters"
            value={password}
            onChange={setPassword}
            secureTextEntry
            error={errors.password}
          />
          <BrutalInput
            label="CONFIRM PASSWORD"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <View style={{ marginTop: 4, marginBottom: 28 }}>
            <BrutalButton
              title="CREATE ACCOUNT →"
              onPress={handleSignUp}
              loading={loading}
              fullWidth
              size="lg"
              color={brutal.success}
            />
          </View>

          {/* Sign in link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{ fontSize: 13, fontFamily: fontFamily.body, color: brutal.inkMuted }}
            >
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text
                style={{
                  fontSize: 13, fontFamily: fontFamily.heading,
                  fontWeight: '700', color: brutal.accent,
                  textDecorationLine: 'underline', textDecorationStyle: 'solid',
                }}
              >
                SIGN IN
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

