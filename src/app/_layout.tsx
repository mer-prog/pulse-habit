import '../../global.css';
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
import { useSync } from '@/hooks/useSync';
import { useSettingsStore } from '@/stores/settingsStore';
import { migrateDatabase } from '@/lib/database';
import { DB_NAME } from '@/constants/config';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const segments = useSegments();
  const router = useRouter();

  // Supabase session check + onAuthStateChange listener
  useEffect(() => {
    initialize();
  }, []);

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

function SyncManager() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { sync } = useSync();

  // Sync when auth state is ready, with delayed retry for session restoration
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log('[SyncManager] Auth ready, triggering sync...');
      sync();

      // Retry after 3s in case Supabase session wasn't restored yet
      const retryTimer = setTimeout(() => {
        console.log('[SyncManager] Retry sync (session may be ready now)');
        sync();
      }, 3000);

      return () => clearTimeout(retryTimer);
    }
  }, [isAuthenticated, isLoading]);

  return null;
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
            <SyncManager />
            <ToastContainer />
          </SQLiteProvider>
        </Suspense>
      </ErrorBoundary>
      <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}
