import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { PROFILE_STORAGE_KEY, TOKEN_STORAGE_KEY } from '@/constants/auth';

const LOGGED_OUT_KEY = 'user_logged_out';

export type PatientProfile = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  address: string;
  phone: string;
};

interface AuthContextType {
  token: string | null;
  profile: PatientProfile | null;
  isLoading: boolean;
  login: (token: string, profile?: PatientProfile | null) => Promise<void>;
  setProfile: (profile: PatientProfile | null) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfileState] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const wasLoggedOut = await AsyncStorage.getItem(LOGGED_OUT_KEY);
        if (wasLoggedOut === 'true') {
          setToken(null);
          setProfileState(null);
        } else {
          const stored = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
          setToken(stored);

          const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
          if (storedProfile) {
            try {
              setProfileState(JSON.parse(storedProfile) as PatientProfile);
            } catch {
              setProfileState(null);
            }
          }
        }
      } catch {
        setToken(null);
        setProfileState(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setProfile = useCallback(async (next: PatientProfile | null) => {
    if (!next) {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      setProfileState(null);
      return;
    }
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    setProfileState(next);
  }, []);

  const login = useCallback(async (newToken: string, nextProfile?: PatientProfile | null) => {
    await AsyncStorage.removeItem(LOGGED_OUT_KEY);        // clear logout flag
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    if (typeof nextProfile !== 'undefined') {
      await setProfile(nextProfile);
    }
  }, [setProfile]);

  const logout = useCallback(async () => {
    await AsyncStorage.setItem(LOGGED_OUT_KEY, 'true');   // mark explicit logout
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    setToken(null);
    setProfileState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, profile, isLoading, login, setProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}