import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { brutal, fontFamily, useTheme } from '@/constants/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6, gap: 2 }}>
      <Text style={{ fontSize: 18, color: focused ? brutal.accent : colors.inkMuted }}>{icon}</Text>
      <Text
        style={{
          fontSize: 9,
          fontFamily: fontFamily.mono,
          fontWeight: '700',
          letterSpacing: 1,
          color: focused ? (isDark ? colors.ink : colors.white) : colors.inkMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopWidth: 3,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveBackgroundColor: isDark ? colors.bgAlt : colors.ink,
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarItemStyle: {
          borderRightWidth: 1,
          borderRightColor: colors.borderLight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="◉" label={t('tabs.today')} focused={focused} /> }}
      />
      <Tabs.Screen
        name="habits"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="☰" label={t('tabs.habits')} focused={focused} /> }}
      />
      <Tabs.Screen
        name="stats"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="◔" label={t('tabs.stats')} focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="○" label={t('tabs.me')} focused={focused} /> }}
      />
    </Tabs>
  );
}

