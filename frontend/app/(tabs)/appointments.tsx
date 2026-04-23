import HealthCard from "@/components/common/health-card";
import { useAuth } from "@/context/auth-context";
import { useDoctors } from "@/context/doctors-context";
import { useAppointments } from "@/context/appointments-context";
import { useLanguage } from "@/context/language-context";
import { opdApi } from "@/lib/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PaymentSheet, PaymentMethod } from "@/components/common/payment-sheet";
import { doctorApi } from "@/lib/api";

const PRIMARY = "#2A5FB7";

type Appointment = {
  id: string;
  patient_name?: string | null;
  patient_id?: string | null;
  date?: string | null;
  time?: string | null;
  doctor?: string | null;
  specialty?: string | null;
  type?: string | null;
  status?: string | null;
  phone?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  unique_citizen_card_number?: string | null;
  prescription_id?: string | null;
  hospital_id?: string | null;
  doctor_id?: string | null;
  reschedule_requested_date?: string | null;
  reschedule_requested_time?: string | null;
  reschedule_status?: string | null;
  reschedule_used?: boolean | null;  // true once the patient's one-time reschedule is consumed
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseAppointmentDateTime = (dateStr?: string | null, timeStr?: string | null) => {
  if (!dateStr || !timeStr) return null;
  try {
    let hours = 0;
    let mins = 0;
    const isPM = timeStr.toLowerCase().includes("pm");
    const isAM = timeStr.toLowerCase().includes("am");
    const match = timeStr.match(/(\d+)[:.:](\d+)/);

    let aptTime: Date;
    if (match) {
      hours = parseInt(match[1], 10);
      mins = parseInt(match[2], 10);
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
      aptTime = new Date(dateStr);
      aptTime.setHours(hours, mins, 0, 0);
    } else {
      aptTime = new Date(`${dateStr}T${timeStr}`);
    }
    return isNaN(aptTime.getTime()) ? null : aptTime;
  } catch {
    return null;
  }
};

const isJoinEnabled = (dateStr?: string | null, timeStr?: string | null, type?: string | null) => {
  if (String(type).toLowerCase().includes("emergency")) {
    return true; // Always allow joining emergency once scheduled
  }
  const aptTime = parseAppointmentDateTime(dateStr, timeStr);
  if (!aptTime) return false;
  const now = new Date();
  const diffMins = (aptTime.getTime() - now.getTime()) / (1000 * 60);
  return diffMins <= 5 && diffMins >= -15;
};

const getStatusStyles = (status: string) => {
  const s = status.toLowerCase();
  if (s === "completed" || s === "done")
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" };
  if (s === "scheduled")
    return { bg: "bg-blue-50", text: "text-[#2A5FB7]", border: "border-blue-100" };
  if (s === "cancelled" || s === "rejected")
    return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100" };
  if (s === "pending")
    return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100" };
  if (s === "approved" || s === "awaiting payment")
    return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" };
  return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100" };
};

const getRescheduleStyles = (rescheduleStatus?: string | null) => {
  if (rescheduleStatus === "pending")
    return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "RESCHEDULE PENDING" };
  if (rescheduleStatus === "approved")
    return { bg: "bg-blue-50", text: "text-[#2A5FB7]", border: "border-blue-200", label: "RESCHEDULED" };
  if (rescheduleStatus === "rejected")
    return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "REQUEST REJECTED" };
  return null;
};

const isOnlineAppointment = (type?: string | null) => {
  if (!type) return false;
  const t = String(type).toLowerCase();
  return t.includes("online") || t.includes("video") || t.includes("tele") || t.includes("emergency");
};

// ─── Date / Slot helpers (reused from booking screen) ────────────────────────

function getNextDays(count: number) {
  const days: { key: string; day: string; date: number; month: string }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const now = new Date();
  const istMillis = now.getTime() + 5.5 * 3600000;
  const istToday = new Date(istMillis);

  for (let i = 0; i < count; i++) {
    const d = new Date(istToday);
    d.setUTCDate(istToday.getUTCDate() + i);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    days.push({
      key: `${year}-${month}-${day}`,
      day: dayNames[d.getUTCDay()],
      date: d.getUTCDate(),
      month: monthNames[d.getUTCMonth()],
    });
  }
  return days;
}

function getAvailableSlots(selectedDate: string): string[] {
  const slots: { h: number; m: number; str: string }[] = [];
  for (let minutes = 540; minutes <= 1020; minutes += 15) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    let displayH = h > 12 ? h - 12 : h;
    if (displayH === 0) displayH = 12;
    const slotStr = `${displayH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
    slots.push({ h, m, str: slotStr });
  }

  const now = new Date();
  const istNow = new Date(now.getTime() + 5.5 * 3600000);
  const todayKey = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, "0")}-${String(istNow.getUTCDate()).padStart(2, "0")}`;

  if (selectedDate === todayKey) {
    const currentH = istNow.getUTCHours();
    const currentM = istNow.getUTCMinutes();
    return slots
      .filter((s) => s.h > currentH || (s.h === currentH && s.m > currentM))
      .map((s) => s.str);
  }
  return slots.map((s) => s.str);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyAppointmentsScreen() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { doctors } = useDoctors();
  const { appointments, isLoading: contextLoading, error: contextError, refresh } = useAppointments();

  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null);

  // ── Payment state for emergencies ──
  const [showPayment, setShowPayment] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<Appointment | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [doctorFee, setDoctorFee] = useState(1000); // Fallback fee

  // ── Refresh state ──
  const [refreshing, setRefreshing] = useState(false);

  // ── Cancel state ──
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ── Reschedule state ──
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const freshDates = React.useMemo(() => getNextDays(7), []);
  const [rescheduleDate, setRescheduleDate] = useState(freshDates[0]?.key ?? "");
  const [rescheduleSlot, setRescheduleSlot] = useState<string | null>(null);
  const [rescheduleBookedSlots, setRescheduleBookedSlots] = useState<string[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Fetch booked slots for the reschedule modal when date/doctor changes
  useEffect(() => {
    if (!showRescheduleModal || !rescheduleTarget?.doctor_id || !rescheduleDate) return;
    let cancelled = false;
    setRescheduleSlotsLoading(true);
    setRescheduleBookedSlots([]);
    opdApi.getBookedSlots(rescheduleTarget.doctor_id, rescheduleDate).then((res) => {
      if (cancelled) return;
      if (res.data?.bookedSlots) setRescheduleBookedSlots(res.data.bookedSlots);
      setRescheduleSlotsLoading(false);
    }).catch(() => {
      if (!cancelled) setRescheduleSlotsLoading(false);
    });
    return () => { cancelled = true; };
  }, [showRescheduleModal, rescheduleTarget?.doctor_id, rescheduleDate]);

  const rescheduleAvailableSlots = React.useMemo(
    () => getAvailableSlots(rescheduleDate),
    [rescheduleDate]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // ── Cancel handler ──
  const handleCancel = (appt: Appointment) => {
    Alert.alert(
      "Cancel Appointment",
      `Are you sure you want to cancel your appointment with ${appt.doctor ?? "your doctor"} on ${appt.date} at ${appt.time}?`,
      [
        { text: "Keep Appointment", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            if (!profile?.id) return;
            setCancellingId(appt.id);
            const res = await opdApi.cancelAppointment(appt.id, profile.id);
            setCancellingId(null);
            if (res.error) {
              Alert.alert("Error", res.error);
            } else {
              refresh();
            }
          },
        },
      ]
    );
  };

  // ── Reschedule handler ──
  const openReschedule = (appt: Appointment) => {
    setRescheduleTarget(appt);
    setRescheduleDate(freshDates[0]?.key ?? "");
    setRescheduleSlot(null);
    setRescheduleBookedSlots([]);
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleSlot || !profile?.id) return;
    setSubmittingReschedule(true);
    const res = await opdApi.requestReschedule(
      rescheduleTarget.id,
      profile.id,
      rescheduleDate,
      rescheduleSlot
    );
    setSubmittingReschedule(false);
    if (res.error) {
      Alert.alert("Error", res.error);
      return;
    }
    setShowRescheduleModal(false);
    refresh();
    Alert.alert(
      "Request Sent",
      "Your reschedule request has been sent to the doctor for approval."
    );
  };

  // ── Payment Handler ──
  const handlePayEmergency = async (paymentMethod: PaymentMethod, input: string) => {
    if (!paymentTarget || !profile?.id) return;
    setPaymentProcessing(true);
    try {
      const res = await opdApi.payForAppointment(paymentTarget.id, profile.id, doctorFee, paymentMethod);
      if (res.error) throw new Error(res.error);
      
      setShowPayment(false);
      setPaymentTarget(null);
      Alert.alert("Payment Success", "Emergency approved and paid! You can now join the call.");
      refresh();
    } catch (e: any) {
      Alert.alert("Payment Failed", e.message || "Could not process payment.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white/80">
        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          className="w-10 h-10 items-center justify-center rounded-full bg-slate-50"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#2A5FB7" />
        </Pressable>
        <Text className="text-xl font-bold text-foreground ml-3">{t("myAppointments")}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-lg mx-auto px-4 pb-24 pt-2"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {contextLoading && appointments.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator />
            <Text className="text-muted-foreground mt-3">Loading appointments...</Text>
          </View>
        ) : contextError ? (
          <View className="py-10 items-center justify-center opacity-80">
            <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#64748b" />
            <Text className="text-muted-foreground mt-3 text-center">{contextError}</Text>
            <Pressable onPress={refresh} className="mt-4 px-4 py-2 rounded-full bg-primary">
              <Text className="text-primary-foreground font-semibold">{t("tryAgain") || "Try again"}</Text>
            </Pressable>
          </View>
        ) : appointments.length === 0 ? (
          <View className="py-10 items-center justify-center opacity-70">
            <MaterialCommunityIcons name="calendar-blank" size={48} color="#64748b" />
            <Text className="text-muted-foreground mt-3">No appointments yet.</Text>
          </View>
        ) : (
          <View className="gap-4">
            {appointments.map((a: any, idx: number) => {
              const aptTime = parseAppointmentDateTime(a.date, a.time);
              const now = new Date();
              const diffMins = aptTime ? (aptTime.getTime() - now.getTime()) / 60000 : 0;
              const isPast15 = diffMins < -15;
              const isFuture = diffMins > 0;
              const isCancelled = a?.status?.toLowerCase() === "cancelled";
              const isScheduled = a?.status?.toLowerCase() === "scheduled";
              const hasReschedulePending = a?.reschedule_status === "pending";
              const rescheduleUsed = a?.reschedule_used === true;

              // Effective status for main badge
              let effectiveStatus = a?.status || "Scheduled";
              if (isPast15 && effectiveStatus.toLowerCase() === "scheduled") {
                effectiveStatus = "Completed";
              }
              const statusColors = getStatusStyles(effectiveStatus);
              const rescheduleStyle = getRescheduleStyles(a?.reschedule_status);

              // Show action buttons only for future scheduled appointments
              const showActions = isScheduled && isFuture && !isPast15;

              return (
                <HealthCard key={a?.id ?? `${idx}`} className="p-5 mb-1 overflow-hidden">
                  {/* ── Header row ── */}
                  <View className="flex-row items-start justify-between gap-3 mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <MaterialCommunityIcons name="doctor" size={16} color="#2A5FB7" />
                        <Text className="font-bold text-lg text-foreground leading-tight">
                          {a?.doctor ?? "Doctor"}
                        </Text>
                      </View>
                      <Text className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                        {a?.specialty ?? "Medical Consultation"}
                      </Text>
                    </View>
                    <View className="items-end gap-1">
                      {/* Main status badge */}
                      <View className={`px-2.5 py-1 rounded-full border ${statusColors.bg} ${statusColors.border}`}>
                        <Text className={`text-xs font-bold ${statusColors.text} uppercase tracking-tighter`}>
                          {effectiveStatus}
                        </Text>
                      </View>
                      {/* Reschedule status badge */}
                      {rescheduleStyle && (
                        <View className={`px-2.5 py-1 rounded-full border ${rescheduleStyle.bg} ${rescheduleStyle.border}`}>
                          <Text className={`text-xs font-bold ${rescheduleStyle.text} uppercase tracking-tighter`}>
                            {rescheduleStyle.label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* ── Date / Time info ── */}
                  <View className="bg-slate-50/50 rounded-xl p-3 mb-4 border border-slate-50">
                    <View className="flex-row items-center gap-2 mb-2">
                      <MaterialCommunityIcons name="calendar-range" size={16} color="#64748b" />
                      <Text className="text-slate-600 font-medium">
                        {String(a.date)} · {String(a.time)}
                      </Text>
                    </View>
                    {/* Show pending reschedule request details */}
                    {hasReschedulePending && (
                      <View className="flex-row items-center gap-2 mb-2">
                        <MaterialCommunityIcons name="calendar-clock" size={16} color="#d97706" />
                        <Text className="text-amber-600 text-sm font-medium">
                          Requested: {a.reschedule_requested_date} · {a.reschedule_requested_time}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons name="information-outline" size={16} color="#64748b" />
                      <Text className="text-slate-500 text-sm">Type: {String(a.type)}</Text>
                    </View>
                  </View>

                  {/* ── Action Buttons (Cancel / Reschedule) ── */}
                  {showActions && !isCancelled && (
                    <View className="flex-row gap-3 mb-4">
                      {/* Reschedule button — hidden permanently if reschedule_used, greyed if pending */}
                      {!rescheduleUsed ? (
                        <Pressable
                          onPress={() => {
                            if (hasReschedulePending) {
                              Alert.alert("Pending Request", "A reschedule request is already pending doctor approval.");
                              return;
                            }
                            openReschedule(a);
                          }}
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: hasReschedulePending ? "#F3F4F6" : PRIMARY,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="calendar-edit"
                            size={16}
                            color={hasReschedulePending ? "#9CA3AF" : "#fff"}
                          />
                          <Text style={{ fontSize: 13, fontWeight: "700", color: hasReschedulePending ? "#9CA3AF" : "#fff" }}>
                            Reschedule
                          </Text>
                        </Pressable>
                      ) : (
                        /* Reschedule limit reached — show locked state */
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: "#F9FAFB",
                            borderWidth: 1,
                            borderColor: "#E5E7EB",
                          }}
                        >
                          <MaterialCommunityIcons name="calendar-lock" size={16} color="#D1D5DB" />
                          <Text style={{ fontSize: 13, fontWeight: "600", color: "#D1D5DB" }}>Reschedule Used</Text>
                        </View>
                      )}

                      {/* Cancel button */}
                      <Pressable
                        onPress={() => handleCancel(a)}
                        disabled={cancellingId === a.id}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: "#f43f5e",
                          backgroundColor: "#fff",
                          opacity: cancellingId === a.id ? 0.6 : 1,
                        }}
                      >
                        {cancellingId === a.id ? (
                          <ActivityIndicator size="small" color="#f43f5e" />
                        ) : (
                          <MaterialCommunityIcons name="calendar-remove" size={16} color="#f43f5e" />
                        )}
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#f43f5e" }}>
                          {cancellingId === a.id ? "Cancelling..." : "Cancel"}
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* ── Join Video / Prescription (existing logic) ── */}
                  {(() => {
                    if (isCancelled || effectiveStatus.toLowerCase() === "rejected") return null;

                    if (a.type === "Emergency" && effectiveStatus.toLowerCase() === "pending") {
                      return (
                        <View className="py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-amber-50 border border-amber-200">
                          <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#b45309" />
                          <Text className="font-bold text-amber-700">Awaiting Doctor Approval</Text>
                        </View>
                      );
                    }

                    const currentStatus = String(a?.status || "").toLowerCase().trim();
                    const isAwaiting = currentStatus === "awaiting payment";
                    const isApprovedEmergency = (String(a?.type || "").toLowerCase().trim() === "emergency" && currentStatus === "approved");
                    const needsPayment = isAwaiting || isApprovedEmergency;

                    if (needsPayment) {
                      return (
                        <View className="mt-2">
                          <View className="flex-row items-center gap-2 mb-3 px-1">
                            <MaterialCommunityIcons name="shield-check" size={18} color="#16a34a" />
                            <Text className="text-sm font-semibold text-green-700">
                              {isAwaiting 
                                ? "Payment is required for this appointment."
                                : "Doctor has accepted your emergency request!"}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => {
                              // Find doctor emergency fee from context
                              const doc = doctors.find(d => String(d.id) === String(a.doctor_id));
                              const fee = doc?.emergency_fee || 1000;
                              
                              setDoctorFee(fee); 
                              setPaymentTarget(a);
                              setShowPayment(true);
                            }}
                            className="py-3.5 rounded-xl flex-row items-center justify-center gap-2 bg-orange-600 shadow-sm"
                          >
                            <MaterialCommunityIcons name="credit-card" size={20} color="white" />
                            <Text className="font-bold text-base text-white">
                              Pay Rs. {doctors.find(d => String(d.id) === String(a.doctor_id))?.emergency_fee || 1000}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    }

                    if (isOnlineAppointment(a?.type) && !isPast15 && !isCancelled) {
                      return (
                        <Pressable
                          onPress={() => {
                            const enabled = isJoinEnabled(a?.date, a?.time, a?.type);
                            if (enabled) {
                              const url = `https://meet.jit.si/appointment-portal-${a.id}`;
                              if (Platform.OS === "web") {
                                window.open(url, "_blank");
                              } else {
                                Linking.openURL(url);
                              }
                            } else {
                              if (Platform.OS === "web") {
                                window.alert(t("joinVideoCallAlert") || "You can only join the call 5 minutes before the scheduled time.");
                              } else {
                                alert(t("joinVideoCallAlert") || "You can only join the call 5 minutes before the scheduled time.");
                              }
                            }
                          }}
                          className={`py-3.5 rounded-xl flex-row items-center justify-center gap-2 ${isJoinEnabled(a?.date, a?.time, a?.type) ? "bg-[#2A5FB7]" : "bg-slate-200"} shadow-sm`}
                        >
                          <MaterialCommunityIcons
                            name="video"
                            size={20}
                            color={isJoinEnabled(a?.date, a?.time, a?.type) ? "white" : "#94a3b8"}
                          />
                          <Text className={`font-bold text-base ${isJoinEnabled(a?.date, a?.time, a?.type) ? "text-white" : "text-slate-400"}`}>
                            {t("joinVideoCall") || "Join Video Call"}
                          </Text>
                        </Pressable>
                      );
                    }

                    if (isPast15 && a.prescriptions) {
                      const isExpanded = expandedPrescription === a.id;
                      const p = a.prescriptions;
                      return (
                        <View className="border border-blue-50 rounded-2xl overflow-hidden bg-white shadow-sm">
                          <Pressable
                            onPress={() => setExpandedPrescription(isExpanded ? null : a.id)}
                            className="flex-row items-center justify-between p-4 bg-blue-50/30"
                          >
                            <View className="flex-row items-center gap-3">
                              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                                <MaterialCommunityIcons name="file-document-edit" size={18} color="#2A5FB7" />
                              </View>
                              <Text className="font-bold text-[#2A5FB7] text-base">Digital Prescription</Text>
                            </View>
                            <MaterialCommunityIcons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={22}
                              color="#2A5FB7"
                            />
                          </Pressable>

                          {isExpanded && (
                            <View className="p-4">
                              <View className="flex-row justify-between items-center mb-4 bg-slate-50 p-2 rounded-lg">
                                <Text className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                                  Issued: {p.issued || "N/A"}
                                </Text>
                                <View className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                                  <Text className="text-[10px] font-bold text-emerald-600 uppercase">
                                    {p.status || "Active"}
                                  </Text>
                                </View>
                              </View>

                              <Text className="font-bold text-slate-800 mb-3 border-l-4 border-blue-200 pl-3">
                                Medications
                              </Text>
                              <View className="gap-3 mb-4">
                                {(Array.isArray(p.medications) ? p.medications : []).map((m: any, midx: number) => (
                                  <View
                                    key={midx}
                                    className="bg-slate-50/50 p-3 rounded-xl flex-row justify-between items-center border border-slate-100"
                                  >
                                    <View className="flex-1">
                                      <Text className="text-sm font-bold text-foreground">{m.medication}</Text>
                                      <Text className="text-xs text-muted-foreground mt-0.5 italic">{m.dosage}</Text>
                                    </View>
                                    <View className="bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                      <Text className="text-xs font-black text-[#2A5FB7]">x{m.quantity}</Text>
                                    </View>
                                  </View>
                                ))}
                              </View>

                              {p.instructions && (
                                <View className="mb-4 bg-amber-50/30 p-3 rounded-xl border border-amber-50">
                                  <Text className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                                    Doctor&apos;s Note
                                  </Text>
                                  <Text className="text-sm text-slate-600">{p.instructions}</Text>
                                </View>
                              )}

                              <View className="flex-row items-center justify-between pt-4 border-t border-slate-100 mt-2">
                                <View>
                                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Prescribed by</Text>
                                  <Text className="text-xs font-bold text-foreground">{p.doctor_name || a?.doctor}</Text>
                                </View>
                                <View className="items-end">
                                  <Text className="text-[10px] text-slate-400 font-bold uppercase">Duration</Text>
                                  <Text className="text-xs font-bold text-foreground">{p.duration}</Text>
                                </View>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    }
                    return null;
                  })()}
                </HealthCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ─── Reschedule Modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={showRescheduleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: 40,
              maxHeight: "85%",
            }}
          >
            {/* Handle bar */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 }} />

            {/* Title */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#1F2937" }}>Reschedule Appointment</Text>
              <Pressable onPress={() => setShowRescheduleModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              Select a new date and time. Your doctor will review and approve the change.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Doctor Info */}
              {rescheduleTarget && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F0F4FF", borderRadius: 12, padding: 12, marginBottom: 20 }}>
                  <MaterialCommunityIcons name="doctor" size={22} color={PRIMARY} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#1F2937" }}>{rescheduleTarget.doctor}</Text>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>Current: {rescheduleTarget.date} · {rescheduleTarget.time}</Text>
                  </View>
                </View>
              )}

              {/* Date Picker */}
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937", marginBottom: 12 }}>Select New Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4, marginBottom: 20 }}>
                {freshDates.map((d) => {
                  const active = rescheduleDate === d.key;
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => {
                        setRescheduleDate(d.key);
                        setRescheduleSlot(null);
                      }}
                      style={{
                        alignItems: "center",
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        borderRadius: 14,
                        backgroundColor: active ? PRIMARY : "#fff",
                        minWidth: 56,
                        borderWidth: 1.5,
                        borderColor: active ? PRIMARY : "#E5E7EB",
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#fff" : "#6B7280" }}>{d.day}</Text>
                      <Text style={{ fontSize: 20, fontWeight: "800", color: active ? "#fff" : "#1F2937", marginVertical: 2 }}>{d.date}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#fff" : "#6B7280" }}>{d.month}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Time Slot Picker */}
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937", marginBottom: 12 }}>Select New Time</Text>
              {rescheduleSlotsLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12, marginBottom: 20 }}>
                  <ActivityIndicator size="small" color={PRIMARY} />
                  <Text style={{ fontSize: 13, color: "#6B7280" }}>Checking availability...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
                  {rescheduleAvailableSlots.length > 0 ? (
                    rescheduleAvailableSlots.map((slot) => {
                      const active = rescheduleSlot === slot;
                      const isBooked = rescheduleBookedSlots.includes(slot);
                      return (
                        <Pressable
                          key={slot}
                          onPress={() => { if (!isBooked) setRescheduleSlot((p) => (p === slot ? null : slot)); }}
                          disabled={isBooked}
                          style={{
                            paddingVertical: 9,
                            paddingHorizontal: 14,
                            borderRadius: 10,
                            alignItems: "center",
                            backgroundColor: isBooked ? "#F3F4F6" : active ? PRIMARY : "#fff",
                            borderWidth: 1.5,
                            borderColor: isBooked ? "#E5E7EB" : active ? PRIMARY : "#E5E7EB",
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: "600", color: isBooked ? "#D1D5DB" : active ? "#fff" : "#374151" }}>
                            {slot}
                          </Text>
                          {isBooked && (
                            <Text style={{ fontSize: 9, fontWeight: "700", color: "#D1D5DB", marginTop: 1, letterSpacing: 0.5 }}>
                              BOOKED
                            </Text>
                          )}
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={{ width: "100%", alignItems: "center", paddingVertical: 16, gap: 6 }}>
                      <MaterialCommunityIcons name="clock-outline" size={24} color="#9CA3AF" />
                      <Text style={{ fontSize: 14, color: "#6B7280" }}>No available slots for this day</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmitReschedule}
                disabled={!rescheduleSlot || submittingReschedule}
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                  opacity: !rescheduleSlot || submittingReschedule ? 0.6 : 1,
                }}
              >
                <LinearGradient
                  colors={rescheduleSlot && !submittingReschedule ? [PRIMARY, "#1a4a9f"] : ["#D1D5DB", "#D1D5DB"]}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    paddingVertical: 15,
                    borderRadius: 14,
                  }}
                >
                  {submittingReschedule ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <MaterialCommunityIcons name="calendar-check" size={20} color="#fff" />
                  )}
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                    {submittingReschedule
                      ? "Submitting..."
                      : rescheduleSlot
                      ? `Request ${rescheduleSlot}`
                      : "Select a time slot"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═════════ PAYMENT MODAL ═════════ */}
      <PaymentSheet
        visible={showPayment}
        onClose={() => {
          setShowPayment(false);
          setPaymentTarget(null);
        }}
        onPay={handlePayEmergency}
        isProcessing={paymentProcessing}
        summary={{
          doctorName: paymentTarget?.doctor || undefined,
          doctorSpecialty: paymentTarget?.specialty || undefined,
          dateStr: "Immediate",
          typeStr: "Emergency OPD",
          consultFee: doctorFee,
          platformFee: 0,
        }}
      />
    </SafeAreaView>
  );
}
