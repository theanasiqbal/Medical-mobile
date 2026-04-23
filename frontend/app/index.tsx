import { Redirect } from 'expo-router';
import { useAuth } from '../context/auth-context';
import React from 'react';

export default function Index() {
  const { token, isLoading } = useAuth();

  // Wait for authentication state to be loaded from AsyncStorage
  if (isLoading) {
    return null;
  }

  // If token exists, user is logged in, send them to the main tabs
  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, take them to the login screen
  return <Redirect href="/(auth)/login" />;
}
