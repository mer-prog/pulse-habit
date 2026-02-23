import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { brutal, fontFamily } from '@/constants/theme';

function TabIcon({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 6,
        gap: 2,
      }}
    >
      <Text style={{ fontSize: 18, color: focused ? brutal.accent : brutal.inkMuted }}>
        {icon}
      </Text>
      <Text
        style={{
          fontSize: 9,
          fontFamily: fontFamily.mono,
          fontWeight: '700',
          letterSpacing: 1,
          color: focused ? brutal.white : brutal.inkMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: brutal.bg,
          borderTopWidth: 3,
          borderTopColor: brutal.ink,
          height: 68,
          paddingBottom: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveBackgroundColor: brutal.ink,
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarItemStyle: {
          borderRightWidth: 1,
          borderRightColor: brutal.borderLight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◉" label="TODAY" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="☰" label="HABITS" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◔" label="STATS" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="○" label="ME" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

