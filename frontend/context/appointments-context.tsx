import React, { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { opdApi } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth-context";

interface AppointmentsContextType {
  appointments: any[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppts = useCallback(async (showLoading = false) => {
    if (!profile?.id) {
      setAppointments([]);
      return;
    }
    
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      const res = await opdApi.getMyAppointments(profile.id);
      if (res.data) {
        setAppointments(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.error || "Failed to load appointments");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [profile?.id]);

  // Initial load and Realtime subscription
  useEffect(() => {
    if (!profile?.id) return;

    fetchAppts(true);

    // Subscribe to REALTIME changes for this user's appointments
    const channel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('Appointment change detected:', payload.eventType);
          fetchAppts(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, fetchAppts]);

  // Refresh on app focus (foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        fetchAppts(false);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [fetchAppts]);

  return (
    <AppointmentsContext.Provider 
      value={{ 
        appointments, 
        isLoading, 
        error, 
        refresh: () => fetchAppts(true) 
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error("useAppointments must be used within AppointmentsProvider");
  }
  return context;
}
