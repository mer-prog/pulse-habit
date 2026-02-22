import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToastStore } from '@/stores/toastStore';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

export default function SignInScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const addToast = useToastStore((s) => s.addToast);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
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
          setUser({
            id: data.user.id,
            email: data.user.email ?? email,
            name: data.user.user_metadata?.name ?? null,
            avatar_url: data.user.user_metadata?.avatar_url ?? null,
          });
        }
      } else {
        // Offline mode — create local user
        setUser({
          id: 'local',
          email,
          name: email.split('@')[0] ?? 'User',
          avatar_url: null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      addToast('error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50 dark:bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          className="px-8"
        >
          {/* Logo */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500">
              <Ionicons name="pulse" size={40} color="#FFFFFF" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              PulseHabit
            </Text>
            <Text className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Smart Habit & Streak Tracker
            </Text>
          </View>

          {/* Form */}
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
          />

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            fullWidth
          />

          {/* Social login UI (portfolio placeholder) */}
          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <Text className="mx-4 text-sm text-slate-400">or continue with</Text>
            <View className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </View>

          <View className="flex-row justify-center gap-4">
            {(['logo-google', 'logo-apple', 'logo-github'] as const).map((icon) => (
              <TouchableOpacity
                key={icon}
                className="h-12 w-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700"
                activeOpacity={0.7}
              >
                <Ionicons name={icon} size={24} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign up link */}
          <View className="mt-8 flex-row justify-center">
            <Text className="text-sm text-slate-500">
              {"Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text className="text-sm font-semibold text-indigo-500">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
