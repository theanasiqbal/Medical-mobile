import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

/**
 * Layout for the (auth) route group.
 * Full-screen stack, no navigation header, light status bar.
 */
export default function AuthLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-otp" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="complete-profile" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
