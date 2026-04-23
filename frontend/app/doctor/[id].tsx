import { useAuth } from "@/context/auth-context";
import { useDoctors } from "@/context/doctors-context";
import { useLanguage } from "@/context/language-context";
import { opdApi } from "@/lib/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, Stack } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PaymentSheet, PaymentMethod } from "@/components/common/payment-sheet";

const PRIMARY = "#2A5FB7";
const PRIMARY_DARK = "#1a4a9f";
const PRIMARY_SOFT = "rgba(42,95,183,0.12)";

const getInitials = (name: string) => {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

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
    const localKey = `${year}-${month}-${day}`;
    days.push({ key: localKey, day: dayNames[d.getUTCDay()], date: d.getUTCDate(), month: monthNames[d.getUTCMonth()] });
  }
  return days;
}

type DocAsset = DocumentPicker.DocumentPickerAsset;

// ─── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 16, fontWeight: "700", color: "#1F2937", marginBottom: 12 }}>
      {title}
    </Text>
  );
}

// ─── Fee Pill ────────────────────────────────────────────────────────────────
function FeePill({ label, amount, accent }: { label: string; amount: number; accent?: boolean }) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: accent ? "#EEF2FF" : "#F9FAFB",
      borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10,
      borderWidth: 1, borderColor: accent ? "#C7D2FE" : "#E5E7EB",
    }}>
      <MaterialCommunityIcons
        name={accent ? "lightning-bolt" : "cash"}
        size={13}
        color={accent ? "#4F46E5" : "#6B7280"}
      />
      <Text style={{ fontSize: 12, fontWeight: "600", color: accent ? "#4F46E5" : "#6B7280" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: "800", color: accent ? "#4F46E5" : "#1F2937" }}>
        Rs. {amount.toLocaleString()}
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function BookDoctorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useLanguage();
  const { profile } = useAuth();

  const { doctors } = useDoctors();
  const doctor = useMemo(() => doctors.find((d) => d.id === id), [id, doctors]);

  const freshDates = React.useMemo(() => getNextDays(7), []);
  const [selectedDate, setSelectedDate] = useState(freshDates[0]?.key ?? "");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [docTab, setDocTab] = useState<"medical" | "prescription" | "imaging">("medical");
  const [medicalDocs, setMedicalDocs] = useState<DocAsset[]>([]);
  const [prescriptionDocs, setPrescriptionDocs] = useState<DocAsset[]>([]);
  const [imagingDocs, setImagingDocs] = useState<DocAsset[]>([]);

  const [booking, setBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any>(null);

  // Booked slots
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Payment sheet
  const [showPayment, setShowPayment] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    if (!id || !selectedDate) return;
    let cancelled = false;
    setSlotsLoading(true);
    setBookedSlots([]);
    opdApi.getBookedSlots(id, selectedDate).then((res) => {
      if (cancelled) return;
      if (res.data?.bookedSlots) setBookedSlots(res.data.bookedSlots);
      setSlotsLoading(false);
    }).catch(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [id, selectedDate]);

  useEffect(() => {
    if (freshDates.length > 0 && !freshDates.some((d) => d.key === selectedDate)) {
      setSelectedDate(freshDates[0].key);
    }
  }, [freshDates, selectedDate]);

  const availableSlots = React.useMemo(() => {
    const slots: { h: number; m: number; str: string }[] = [];
    for (let minutes = 540; minutes <= 1020; minutes += 15) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const period = h >= 12 ? "PM" : "AM";
      let displayH = h > 12 ? h - 12 : h;
      if (displayH === 0) displayH = 12;
      slots.push({ h, m, str: `${displayH.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}` });
    }
    const now = new Date();
    const istNow = new Date(now.getTime() + 5.5 * 3600000);
    const todayKey = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, "0")}-${String(istNow.getUTCDate()).padStart(2, "0")}`;
    if (selectedDate === todayKey) {
      const cH = istNow.getUTCHours(), cM = istNow.getUTCMinutes();
      return slots.filter((s) => s.h > cH || (s.h === cH && s.m > cM)).map((s) => s.str);
    }
    return slots.map((s) => s.str);
  }, [selectedDate]);

  if (!doctor) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-lg text-foreground">Doctor not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary">{t("back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const emergencyFee = doctor.emergency_fee ?? 0;
  const consultFee = isEmergency ? emergencyFee : (doctor.fee ?? 0);
  const platformFee = 0;
  const totalFee = consultFee + platformFee;

  const selectedDateObj = freshDates.find((d) => d.key === selectedDate);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*", "application/pdf"], multiple: true });
      if (result.canceled) return;
      if (docTab === "medical") setMedicalDocs((prev) => [...prev, ...result.assets]);
      else if (docTab === "prescription") setPrescriptionDocs((prev) => [...prev, ...result.assets]);
      else setImagingDocs((prev) => [...prev, ...result.assets]);
    } catch (err) { console.error("Pick error:", err); }
  };

  const removeDoc = (category: "medical" | "prescription" | "imaging", index: number) => {
    if (category === "medical") setMedicalDocs((prev) => prev.filter((_, i) => i !== index));
    else if (category === "prescription") setPrescriptionDocs((prev) => prev.filter((_, i) => i !== index));
    else setImagingDocs((prev) => prev.filter((_, i) => i !== index));
  };

  // Called by the new PaymentSheet after user hits "Pay & Book"
  const handleBookAppointment = async (paymentMethod: PaymentMethod, input: string) => {
    if (!selectedSlot || !profile?.name) return;

    setBooking(true);
    setShowPayment(false);
    try {
      const uploadCategory = async (docs: DocAsset[]) => {
        const urls: string[] = [];
        for (const doc of docs) {
          const res = await opdApi.uploadDocument(
            { uri: doc.uri, name: doc.name, type: doc.mimeType || "application/octet-stream" },
            profile.id || profile.phone || profile.name || "guest"
          );
          if (res.error || !res.data?.url) throw new Error(res.error ?? "Upload failed");
          urls.push(res.data.url);
        }
        return urls;
      };

      const [mUrls, pUrls, iUrls] = await Promise.all([
        uploadCategory(medicalDocs),
        uploadCategory(prescriptionDocs),
        uploadCategory(imagingDocs),
      ]);

      const bookRes = await opdApi.bookOpdOnline({
        patientName: profile.name,
        citizenId: profile.id,
        phone: profile.phone,
        age: String(profile.age ?? ""),
        gender: profile.gender,
        address: profile.address,
        doctorId: id,
        doctorName: doctor.name,
        specialty: doctor.specialties?.name ?? doctor.specialty_id ?? "General Physician",
        hospitalId: doctor.hospital_id,
        date: selectedDate,
        time: selectedSlot,
        notes: notes.trim() || undefined,
        medicalReports: mUrls,
        prescriptions: pUrls,
        imaging: iUrls,
        appointmentType: "Online OPD",
        feePaid: totalFee,
        paymentMethod: paymentMethod,
      });

      if (bookRes.error || !bookRes.data) throw new Error(bookRes.error ?? "Booking failed");

      setBookedAppointment(bookRes.data.appointment);
      setShowConfirm(true);
    } catch (err: any) {
      Alert.alert("Booking Failed", err?.message ?? "Failed to book appointment. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  // Open payment sheet (validates slot selection first)
  const handleProceedToPayment = () => {
    if (!selectedSlot) return;
    if (!profile?.name) {
      Alert.alert("Profile", "Please complete your profile first.");
      router.replace("/(tabs)/profile");
      return;
    }
    setShowPayment(true);
  };

  const handleEmergencyRequest = async () => {
    if (!profile?.name) {
      Alert.alert("Profile", "Please complete your profile first.");
      router.replace("/(tabs)/profile");
      return;
    }

    setBooking(true);
    try {
      const uploadCategory = async (docs: DocAsset[]) => {
        const urls: string[] = [];
        for (const doc of docs) {
          const res = await opdApi.uploadDocument(
            { uri: doc.uri, name: doc.name || "doc", type: doc.mimeType || "application/pdf" },
            profile.id
          );
          if (res.data?.url) urls.push(res.data.url);
        }
        return urls;
      };

      const mUrls = await uploadCategory(medicalDocs);
      const pUrls = await uploadCategory(prescriptionDocs);
      const iUrls = await uploadCategory(imagingDocs);

      const bookRes = await opdApi.requestEmergencyAppointment({
        patientName: profile.name,
        citizenId: profile.id,
        phone: profile.phone,
        age: profile.age,
        gender: profile.gender,
        address: profile.address,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.specialties?.name || "General",
        hospitalId: doctor.hospital_id,
        notes,
        medicalReports: mUrls,
        prescriptions: pUrls,
        imaging: iUrls,
      });

      if (bookRes.error || !bookRes.data) throw new Error(bookRes.error ?? "Booking failed");

      setShowConfirm(true);
      setTimeout(() => {
        setShowConfirm(false);
        router.replace("/(tabs)/appointments");
      }, 3000);
    } catch (e: any) {
      Alert.alert("Emergency Error", e.message || "Failed to request emergency appointment.");
    } finally {
      setBooking(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[PRIMARY, PRIMARY_DARK]}
        style={{ paddingTop: 8, paddingBottom: 16, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <Pressable onPress={() => router.back()} style={{ margin: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>{t("bookAppointment")}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

        {/* ── Doctor Card ── */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", margin: 16, borderRadius: 16, padding: 14, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 }}>
          {doctor.image ? (
            <Image source={{ uri: doctor.image }} style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#E5E7EB" }} />
          ) : (
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: PRIMARY_SOFT, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(42,95,183,0.2)" }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: PRIMARY }}>{getInitials(doctor.name || "DR")}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1F2937", marginBottom: 2 }}>{doctor.name}</Text>
            <Text style={{ fontSize: 13, color: PRIMARY, fontWeight: "600", marginBottom: 10 }}>{doctor.specialties?.name || "Specialist"}</Text>
            {/* Fee pills */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {consultFee > 0 && <FeePill label="Consultation" amount={consultFee} />}
              {emergencyFee > 0 && <FeePill label="Emergency" amount={emergencyFee} accent />}
            </View>
          </View>
        </View>

        {/* ── Notes ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", paddingHorizontal: 12 }}>
            <TextInput
              style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: "#1F2937", height: 90, textAlignVertical: "top" as any }}
              placeholder="Describe your symptoms / notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {/* ── Mode Toggle (Regular vs Emergency) ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", backgroundColor: "#E5E7EB", padding: 4, borderRadius: 12 }}>
            <Pressable
              onPress={() => setIsEmergency(false)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: !isEmergency ? "#fff" : "transparent",
                shadowColor: !isEmergency ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: !isEmergency ? 0.05 : 0,
                shadowRadius: 2,
                elevation: !isEmergency ? 1 : 0,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: !isEmergency ? PRIMARY : "#6B7280" }}>Regular OPD</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsEmergency(true)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 8,
                backgroundColor: isEmergency ? "#fff" : "transparent",
                shadowColor: isEmergency ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isEmergency ? 0.05 : 0,
                shadowRadius: 2,
                elevation: isEmergency ? 1 : 0,
                flexDirection: "row",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Text style={{ fontSize: 13 }}>🚨</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: isEmergency ? "#DC2626" : "#6B7280" }}>Emergency</Text>
            </Pressable>
          </View>
        </View>

        {isEmergency ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <View style={{ backgroundColor: "#FEF2F2", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#DC2626" }}>Emergency Priority</Text>
              </View>
              <Text style={{ fontSize: 13, color: "#991B1B", lineHeight: 20 }}>
                This will jump the queue and alert the doctor instantly. You don&apos;t pick a time slot. Wait for the doctor to accept the request, after which you will be notified to pay and join the call.
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* ── Date ── */}
            <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
              <SectionHeader title={t("selectDate")} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {freshDates.map((d) => {
              const active = selectedDate === d.key;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => { setSelectedDate(d.key); setSelectedSlot(null); }}
                  style={{ alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: active ? PRIMARY : "#fff", minWidth: 56, borderWidth: 1.5, borderColor: active ? PRIMARY : "#E5E7EB" }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#fff" : "#6B7280" }}>{d.day}</Text>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: active ? "#fff" : "#1F2937", marginVertical: 2 }}>{d.date}</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: active ? "#fff" : "#6B7280" }}>{d.month}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Time Slots ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <SectionHeader title={t("selectTimeSlot")} />
          {slotsLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text style={{ fontSize: 13, color: "#6B7280" }}>Checking availability...</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => {
                  const active = selectedSlot === slot;
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => { if (!isBooked) setSelectedSlot((prev) => (prev === slot ? null : slot)); }}
                      disabled={isBooked}
                      style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, alignItems: "center", backgroundColor: isBooked ? "#F3F4F6" : active ? PRIMARY : "#fff", borderWidth: 1.5, borderColor: isBooked ? "#E5E7EB" : active ? PRIMARY : "#E5E7EB" }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: isBooked ? "#D1D5DB" : active ? "#fff" : "#374151" }}>
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })
              ) : (
                <View style={{ width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 20, gap: 8 }}>
                  <MaterialCommunityIcons name="clock-outline" size={24} color="#9CA3AF" />
                  <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "500" }}>No slots available for today</Text>
                </View>
              )}
            </View>
          )}
        </View>
          </>
        )}

        {/* ── Upload Documents ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <SectionHeader title="Upload Documents" />
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 12, marginTop: -8 }}>These will be viewable by the doctor.</Text>
          <View style={{ flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 12 }}>
            {(["medical", "prescription", "imaging"] as const).map((tab) => {
              const active = docTab === tab;
              const label = tab === "medical" ? "Medical Report" : tab === "prescription" ? "Prescription" : "Imaging";
              return (
                <Pressable key={tab} onPress={() => setDocTab(tab)} style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8, backgroundColor: active ? "#fff" : "transparent" }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: active ? PRIMARY : "#6B7280" }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB", minHeight: 90 }}>
            {(docTab === "medical" ? medicalDocs : docTab === "prescription" ? prescriptionDocs : imagingDocs).map((doc, idx) => (
              <View key={`${doc.uri}-${idx}`} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", padding: 10, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: "#F3F4F6" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <MaterialCommunityIcons name={doc.mimeType?.includes("pdf") ? "file-pdf-box" : "image"} size={20} color="#6B7280" />
                  <Text style={{ fontSize: 13, color: "#374151", flex: 1 }} numberOfLines={1}>{doc.name}</Text>
                </View>
                <Pressable onPress={() => removeDoc(docTab, idx)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={PRIMARY} />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={handlePickDocument} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderWidth: 2, borderColor: PRIMARY_SOFT, borderStyle: "dashed", borderRadius: 12, marginTop: 8 }}>
              <MaterialCommunityIcons name="plus-circle-outline" size={22} color={PRIMARY} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: PRIMARY }}>Add Document</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Bar (Proceed to Pay / Request Emergency) ── */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: "#F3F4F6", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 6 }}>
        {isEmergency ? (
          <Pressable onPress={handleEmergencyRequest} disabled={booking} style={{ opacity: booking ? 0.7 : 1, borderRadius: 14, overflow: "hidden" }}>
            <LinearGradient colors={["#EF4444", "#DC2626"]} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 }}>
              {booking ? <ActivityIndicator color="#fff" size="small" /> : <MaterialCommunityIcons name="lightning-bolt" size={20} color="#fff" />}
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                {booking ? "Requesting..." : `Request Emergency · Rs. ${totalFee.toLocaleString()}`}
              </Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <>
            {/* Fee summary row */}
            {consultFee > 0 && selectedSlot && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, backgroundColor: "#F0F4FF", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, color: "#6B7280", fontWeight: "600" }}>Consultation Fee</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: PRIMARY }}>Rs. {consultFee.toLocaleString()}</Text>
              </View>
            )}
            <Pressable
              onPress={handleProceedToPayment}
              disabled={!selectedSlot || booking}
              style={{ opacity: !selectedSlot || booking ? 0.7 : 1, borderRadius: 14, overflow: "hidden" }}
            >
              <LinearGradient
                colors={selectedSlot && !booking ? [PRIMARY, PRIMARY_DARK] : ["#D1D5DB", "#D1D5DB"]}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15 }}
              >
                {booking
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <MaterialCommunityIcons name={selectedSlot ? "credit-card-outline" : "calendar"} size={20} color="#fff" />
                }
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                  {booking
                    ? "Processing..."
                    : selectedSlot
                    ? consultFee > 0 ? `Proceed to Pay · Rs. ${totalFee.toLocaleString()}` : `${t("bookAppointment")} · ${selectedSlot}`
                    : t("selectTimeSlot")}
                </Text>
              </LinearGradient>
            </Pressable>
          </>
        )}
      </View>

      {/* ═══════════════ PAYMENT SHEET MODAL ═══════════════ */}
      <PaymentSheet
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        onPay={handleBookAppointment}
        isProcessing={booking}
        summary={{
          doctorName: doctor.name,
          doctorImage: doctor.image,
          doctorSpecialty: doctor.specialties?.name,
          dateStr: `${selectedDateObj?.day}, ${selectedDateObj?.date} ${selectedDateObj?.month}`,
          timeStr: selectedSlot ?? "",
          typeStr: "Online OPD",
          consultFee: consultFee,
          platformFee: platformFee,
        }}
      />

      {/* ═══════════════ BOOKING CONFIRMED MODAL ═══════════════ */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 24, alignItems: "center", width: "100%", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 }}>
            <LinearGradient colors={["#22C55E", "#16A34A"]} style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <MaterialCommunityIcons name="check" size={40} color="#fff" />
            </LinearGradient>
            <Text style={{ fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 6 }}>{t("appointmentSuccess")}</Text>
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>{t("appointmentSuccessMsg")}</Text>

            <View style={{ width: "100%", backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <ConfirmRow icon="account-outline" label={t("doctor")} value={doctor.name} />
              <ConfirmRow icon="medical-bag" label="Specialization" value={doctor.specialties?.name || "Specialist"} />
              <ConfirmRow icon="calendar" label={t("date")} value={`${selectedDateObj?.day}, ${selectedDateObj?.date} ${selectedDateObj?.month}`} />
              <ConfirmRow icon="clock-outline" label={t("selectTime")} value={selectedSlot ?? ""} />
              {consultFee > 0 && <ConfirmRow icon="cash" label="Fee Paid" value={`Rs. ${totalFee.toLocaleString()}`} />}
              {bookedAppointment?.id ? <ConfirmRow icon="barcode" label="Appointment ID" value={String(bookedAppointment.id)} /> : null}
            </View>

            <Pressable
              onPress={() => { setShowConfirm(false); router.replace("/(tabs)/doctors"); }}
              style={{ backgroundColor: PRIMARY, paddingVertical: 14, paddingHorizontal: 48, borderRadius: 14 }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>{t("ok")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SummaryRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <MaterialCommunityIcons name={icon} size={16} color="#9CA3AF" />
      <Text style={{ fontSize: 13, color: "#6B7280", width: 50 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1F2937", flex: 1 }}>{value}</Text>
    </View>
  );
}

function ConfirmRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: PRIMARY_SOFT, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
        <MaterialCommunityIcons name={icon} size={16} color={PRIMARY} />
      </View>
      <Text style={{ fontSize: 12, color: "#6B7280", width: 110, paddingTop: 5 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1F2937", flex: 1, paddingTop: 5 }} numberOfLines={2}>{value}</Text>
    </View>
  );
}
