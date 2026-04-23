import { AuthProvider, useAuth } from '@/context/auth-context';
import { AppointmentsProvider } from '@/context/appointments-context';
import { DoctorsProvider } from '@/context/doctors-context';
import { LanguageProvider } from '@/context/language-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { patientApi } from '@/lib/api';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from "@rn-primitives/portal";
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from "react";
import 'react-native-reanimated';
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Ensure that reloading on `/` keeps a back button present.
  initialRouteName: 'index',
};

/** Inner component that has access to AuthContext */
function RootNavigator() {
  const { token, isLoading } = useAuth();
  const segments = useSegments();
  const colorScheme = useColorScheme();
  const { expoPushToken } = usePushNotifications();
  console.log('[DEBUG] Expo Push Token:', expoPushToken?.data || 'NULL');

  useEffect(() => {
    if (token && expoPushToken?.data) {
      patientApi.updatePushToken(expoPushToken.data, token).catch((e) => console.log('Failed to save push token:', e));
    }
  }, [token, expoPushToken]);

  useEffect(() => {
    if (isLoading) return; // wait until AsyncStorage has been read

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      // Not logged in — send to login screen
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Already logged in — skip auth screens
      router.replace('/(tabs)');
    }

    // Hide splash screen once we've decided where the user should go
    // and the first frame has rendered.
    SplashScreen.hideAsync();
  }, [token, isLoading, segments]);

  // While we are loading auth state, don't render the navigation stack.
  // This keeps the splash screen visible and prevents defaulting to the login screen.
  if (isLoading) {
    return null;
  }

  return (
    <LanguageProvider>
      <DoctorsProvider>
        <AppointmentsProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
          <PortalHost />
        </ThemeProvider>
        </AppointmentsProvider>
      </DoctorsProvider>
    </LanguageProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
