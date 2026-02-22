import '../../../global.css';
import { useEffect, Suspense } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ToastContainer } from '@/components/common/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { migrateDatabase } from '@/lib/database';
import { DB_NAME } from '@/constants/config';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);

  const effectiveTheme =
    themeMode === 'system' ? colorScheme ?? 'light' : themeMode;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <SQLiteProvider databaseName={DB_NAME} onInit={migrateDatabase} useSuspense>
            <AuthGuard>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor:
                      effectiveTheme === 'dark' ? '#0F172A' : '#F8FAFC',
                  },
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="habit/[id]"
                  options={{ presentation: 'card' }}
                />
                <Stack.Screen
                  name="habit/new"
                  options={{ presentation: 'modal' }}
                />
              </Stack>
            </AuthGuard>
            <ToastContainer />
          </SQLiteProvider>
        </Suspense>
      </ErrorBoundary>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}
