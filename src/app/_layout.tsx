import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '@/stores/authStore';
import { useSync } from '@/hooks/useSync';
import { ToastContainer } from '@/components/common/Toast';
import { migrateDatabase } from '@/lib/database';
import { DB_NAME } from '@/constants/config';
import { brutal, useTheme } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

function SyncManager() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { sync } = useSync();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      if (__DEV__) console.log('[SyncManager] Auth ready, triggering sync...');
      sync();
      const retryTimer = setTimeout(() => {
        if (__DEV__) console.log('[SyncManager] Retry sync (session may be ready now)');
        sync();
      }, 3000);
      return () => clearTimeout(retryTimer);
    }
  }, [isAuthenticated, isLoading]);

  return null;
}

function AppContent() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const { colors, statusBarStyle } = useTheme();

  useEffect(() => {
    void initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={brutal.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="habit/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="habit/new" options={{ presentation: 'modal' }} />
      </Stack>
      <SyncManager />
      <ToastContainer />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SQLiteProvider databaseName={DB_NAME} onInit={migrateDatabase}>
          <AppContent />
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
