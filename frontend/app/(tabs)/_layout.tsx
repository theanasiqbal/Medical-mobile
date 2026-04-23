import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useLanguage } from '@/context/language-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useLanguage()

  const colors = {
    light: {
      background: '#ffffff',
      border: '#e5e7eb',
      activeTint: '#2a5fb7',
      inactiveTint: '#9ca3af',
    },
    dark: {
      background: '#1f2937',
      border: '#374151',
      activeTint: '#3b82f6',
      inactiveTint: '#6b7280',
    }
  };

  const currentColors = colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentColors.activeTint,
        tabBarInactiveTintColor: currentColors.inactiveTint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: currentColors.background,
          borderTopColor: currentColors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: t("doctors"),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="doctor" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t("reports"),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document-outline" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: t("summary"),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="brain" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="labs"
        options={{
          title: t("labs"),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="flask" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prescription-dispatch"
        options={{
          title: t("pharmacy"),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={28} color={color} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t("myAppointments"),
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-outline" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}