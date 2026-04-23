import { BACKEND_URL } from '@/constants/auth';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiOptions {
  method?: HttpMethod;
  body?: Record<string, unknown>;
  token?: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Thin fetch wrapper for calling the Medical App backend.
 * Automatically sets JSON headers and handles token injection.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: response.status,
        error: json.message ?? json.error ?? 'Something went wrong',
      };
    }

    return { status: response.status, data: json as T };
  } catch (err) {
    // Network error (server down, wrong IP, etc.)
    return {
      status: 0,
      error: 'Cannot reach the server. Check your WiFi connection and BACKEND_URL.',
    };
  }
}

// ─── Typed Auth API helpers ───────────────────────────────────────────────────

export interface SendOtpResponse {
  success: boolean;
  message: string;
  retryAfter?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  token: string;
  isNewUser: boolean;
}

export const authApi = {
  sendOtp: (phone: string) =>
    apiRequest<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: { phone },
    }),

  verifyOtp: (phone: string, otp: string) =>
    apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, otp },
    }),
};

export interface UpdateProfileData {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  address: string;
}

export const patientApi = {
  updateProfile: (data: UpdateProfileData, token: string) =>
    apiRequest<{ success: boolean; message: string }>('/patient/profile', {
      method: 'PUT',
      body: data as unknown as Record<string, unknown>,
      token,
    }),

  getProfile: (token: string) =>
    apiRequest<{ success: boolean; profile: UpdateProfileData & { phone: string; id: string } }>('/patient/profile', {
      method: 'GET',
      token,
    }),

  updatePushToken: (pushToken: string, token: string) =>
    apiRequest<{ success: boolean }>('/patient/push-token', {
      method: 'PATCH',
      body: { expo_push_token: pushToken },
      token,
    }),

  getNotifications: (token: string) =>
    apiRequest<{ success: boolean; notifications: any[] }>('/patient/notifications', {
      method: 'GET',
      token,
    }),

  markNotificationRead: (id: string, token: string) =>
    apiRequest<{ success: boolean }>(`/patient/notifications/${id}/read`, {
      method: 'PATCH',
      token,
    }),
};

export interface DoctorDb {
  id: string;
  name: string;
  image: string | null;
  hospital_id: string | null;
  specialty_id: string | null;
  specialties: { name: string } | null;
  fee?: number | null;
  emergency_fee?: number | null;
}

export const doctorApi = {
  getAll: (token?: string) =>
    apiRequest<{ success: boolean; doctors: DoctorDb[] }>('/doctors', {
      method: 'GET',
      token,
    }),
};

// ─── OPD / Appointment helpers (proxied by our backend) ───────────────────────
export type OpdUploadResponse = { url: string };

export type OpdBookResponse = {
  success: boolean;
  message: string;
  appointment: any;
};

export type OpdBookedSlotsResponse = {
  success: boolean;
  bookedSlots: string[];
};

export type OpdCancelResponse = {
  success: boolean;
  appointment: any;
};

export type OpdRescheduleResponse = {
  success: boolean;
  message: string;
  appointment: any;
};

export const opdApi = {
  getDoctors: () => apiRequest<any[]>('/opd/doctors', { method: 'GET' }),

  getMyAppointments: (citizenId: string) =>
    apiRequest<any>(`/opd/appointments/uccn/${encodeURIComponent(citizenId)}`, { method: 'GET' }),

  uploadDocument: async (file: { uri: string; name: string; type: string }, patientId: string) => {
    try {
      const form = new FormData();
      form.append('file', file as any);
      form.append('patientId', patientId);
      form.append('bucket', 'uploads');

      const response = await fetch(`${BACKEND_URL}/opd/upload`, {
        method: 'POST',
        body: form,
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { status: response.status, error: json.message ?? json.error ?? 'Upload failed' };
      }
      return { status: response.status, data: json as OpdUploadResponse };
    } catch {
      return { status: 0, error: 'Cannot reach the server. Check your WiFi connection and BACKEND_URL.' };
    }
  },

  bookOpdOnline: (data: Record<string, unknown>) =>
    apiRequest<OpdBookResponse>('/opd/opd-online', {
      method: 'POST',
      body: data,
    }),

  requestEmergencyAppointment: (data: Record<string, unknown>) =>
    apiRequest<OpdBookResponse>('/opd/appointments/emergency', {
      method: 'POST',
      body: data,
    }),

  payForAppointment: (appointmentId: string, patientId: string, feePaid: number, paymentMethod: string) =>
    apiRequest<OpdBookResponse>(`/opd/appointments/${appointmentId}/pay`, {
      method: 'PATCH',
      body: { patientId, feePaid, paymentMethod },
    }),

  getBookedSlots: (doctorId: string, date: string) =>
    apiRequest<OpdBookedSlotsResponse>(
      `/opd/booked-slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`
    ),

  cancelAppointment: (appointmentId: string, patientId: string) =>
    apiRequest<OpdCancelResponse>(`/opd/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      body: { patientId },
    }),

  requestReschedule: (
    appointmentId: string,
    patientId: string,
    newDate: string,
    newTime: string
  ) =>
    apiRequest<OpdRescheduleResponse>(`/opd/appointments/${appointmentId}/reschedule`, {
      method: 'POST',
      body: { patientId, newDate, newTime },
    }),
};

// ─── Reports helpers ─────────────────────────────────────────────────────────
export interface ReportData {
  id: string;
  patient_id: string;
  type: string;
  name: string;
  date: string;
  path: string;
  created_at: string;
  updated_at: string;
}

export const reportsApi = {
  getAll: (token: string) =>
    apiRequest<{ success: boolean; reports: ReportData[] }>('/reports', {
      method: 'GET',
      token,
    }),

  uploadReport: async (
    file: any,
    category: string,
    type: string,
    date: string,
    token: string
  ) => {
    try {
      const form = new FormData();
      form.append('file', file as any);
      form.append('category', category); // "blood", "urine", etc.
      form.append('type', type);         // Name/title of report
      form.append('date', date);

      const response = await fetch(`${BACKEND_URL}/reports/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { status: response.status, error: json.message ?? json.error ?? 'Upload failed' };
      }
      return { status: response.status, data: { success: true, report: json.report as ReportData } };
    } catch (err) {
      console.error('[uploadReport] fetch error:', err);
      return { status: 0, error: 'Cannot reach the server. Check your WiFi connection and BACKEND_URL.' };
    }
  },
};

// ─── Summary helpers ─────────────────────────────────────────────────────────
export interface AISummary {
  healthScore: number;
  statusMessage: string;
  keyFindings: { title: string; value: string }[];
  deficiencies: { title: string; value: string }[];
  lifestyleSuggestions: string[];
  recommendedTests: string[];
}

export const summaryApi = {
  generateSummary: (token: string) =>
    apiRequest<{ success: boolean; summary: AISummary }>('/summary/generate', {
      method: 'GET',
      token,
    }),

  getLatest: (token: string) =>
    apiRequest<{ success: boolean; summary: AISummary | null; lastUpdated: string | null }>('/summary/latest', {
      method: 'GET',
      token,
    }),
};

// ─── Imaging Studies helpers ───────────────────────────────────────────────────
export interface ImagingStudy {
  id: string;
  patient_id: string;
  patient_name: string | null;
  study_type: string | null;
  body_part: string | null;
  modality: string | null;
  date: string;
  month: string;
  year: string;
  ai_flag: boolean;
  ai_analysis: string | null;
  doctor: string | null;
  thumbnail: string;
  report_id: string | null;
  created_at: string;
  updated_at: string;
}

export const imagingApi = {
  getAll: (token: string) =>
    apiRequest<{ success: boolean; studies: ImagingStudy[] }>('/imaging', {
      method: 'GET',
      token,
    }),

  upload: async (
    file: any,
    metadata: { body_part: string; modality: string; report_id?: string },
    token: string
  ) => {
    try {
      const form = new FormData();
      form.append('file', file as any);
      form.append('body_part', metadata.body_part);
      form.append('modality', metadata.modality);
      if (metadata.report_id) form.append('report_id', metadata.report_id);

      const response = await fetch(`${BACKEND_URL}/imaging/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { status: response.status, error: json.message ?? json.error ?? 'Upload failed' };
      }
      return { status: response.status, data: { success: true, study: json.study as ImagingStudy } };
    } catch (err) {
      console.error('[imagingApi.upload] fetch error:', err);
      return { status: 0, error: 'Cannot reach the server.' };
    }
  },

  attachToReport: (studyId: string, reportId: string, token: string) =>
    apiRequest<{ success: boolean; study: ImagingStudy }>('/imaging/attach', {
      method: 'POST',
      body: { studyId, reportId },
      token,
    }),

  summarize: (studyId: string, token: string) =>
    apiRequest<{ success: boolean; analysis: string }>(`/imaging/${studyId}/summarize`, {
      method: 'POST',
      token,
    }),
};
