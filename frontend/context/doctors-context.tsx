import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { doctorApi, DoctorDb } from "@/lib/api";

interface DoctorsContextType {
  doctors: DoctorDb[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DoctorsContext = createContext<DoctorsContextType | undefined>(undefined);

export function DoctorsProvider({ children }: { children: ReactNode }) {
  const [doctors, setDoctors] = useState<DoctorDb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDoctors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await doctorApi.getAll();
      if (res.data?.success && res.data.doctors) {
        setDoctors(res.data.doctors);
      } else {
        setError(res.error || "Failed to load doctors");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  return (
    <DoctorsContext.Provider value={{ doctors, isLoading, error, refresh: loadDoctors }}>
      {children}
    </DoctorsContext.Provider>
  );
}

export function useDoctors() {
  const context = useContext(DoctorsContext);
  if (!context) {
    throw new Error("useDoctors must be used within DoctorsProvider");
  }
  return context;
}
