import HealthCard from "@/components/common/health-card";
import QuickActionCard from "@/components/common/quic-action-card";
import { useAuth } from "@/context/auth-context";
import { useAppointments } from "@/context/appointments-context";
import { useLanguage } from "@/context/language-context";
import { patientApi } from "@/lib/api";
import { useDoctors } from "@/context/doctors-context";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const parseAppointmentDateTime = (dateStr?: string | null, timeStr?: string | null) => {
  if (!dateStr || !timeStr) return null;
  try {
    let hours = 0;
    let mins = 0;
    const isPM = timeStr.toLowerCase().includes('pm');
    const isAM = timeStr.toLowerCase().includes('am');
    const match = timeStr.match(/(\d+)[:.](\d+)/);

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
  if (String(type).toLowerCase().includes('emergency')) {
    return true; // Always allow joining emergency once scheduled
  }
  const aptTime = parseAppointmentDateTime(dateStr, timeStr);
  if (!aptTime) return false;
  const now = new Date();
  const diffMins = (aptTime.getTime() - now.getTime()) / (1000 * 60);
  return diffMins <= 5 && diffMins >= -15;
};

const isOnlineAppointment = (type?: string | null) => {
  if (!type) return false;
  const t = String(type).toLowerCase();
  return t.includes('online') || t.includes('video') || t.includes('tele') || t.includes('emergency');
};

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function HomeScreen({ onCardClick }: any) {
  const { t, language } = useLanguage();
  const { token, profile } = useAuth();
  const { appointments } = useAppointments();
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const scheduled = appointments.filter(a => {
      const isScheduled = a.status === 'Scheduled' || String(a.status).toLowerCase() === 'scheduled';
      if (!isScheduled) return false;

      const aptTime = parseAppointmentDateTime(a.date, a.time);
      if (!aptTime) return false;

      // Hide if more than 15 minutes past
      const diffMins = (aptTime.getTime() - now.getTime()) / (1000 * 60);
      return diffMins >= -15;
    });

    scheduled.sort((a, b) => {
      const aptA = parseAppointmentDateTime(a.date, a.time)?.getTime() ?? 0;
      const aptB = parseAppointmentDateTime(b.date, b.time)?.getTime() ?? 0;
      return aptA - aptB;
    });

    return scheduled.slice(0, 2);
  }, [appointments]);

  useEffect(() => {
    if (!token) return;
    async function fetchName() {
      const res = await patientApi.getProfile(token!);
      if (res.data?.success && res.data.profile?.name) {
        const firstName = res.data.profile.name.split(' ')[0];
        setUserName(firstName);
      }
    }
    fetchName();
  }, [token]);

  const { doctors } = useDoctors();

  const displayedDoctors = searchQuery.trim() === ''
    ? doctors.slice(0, 3)
    : doctors.filter(doc => {
      const nameMatch = doc.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const specMatch = doc.specialties?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      // Fallback: Check if we have language translations for the specialty_id
      const tSpecMatch = doc.specialty_id ? t(doc.specialty_id).toLowerCase().includes(searchQuery.toLowerCase()) : false;
      return nameMatch || specMatch || tSpecMatch;
    });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-lg mx-auto px-4 pt-6 pb-4"
      >
        {/* Welcome Header */}
        <View className="mb-6 flex-row justify-between items-start">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-foreground mb-1">
              {userName ? `${t("welcome")}, ${userName}` : t("welcome")}
            </Text>
            <Text className="text-muted-foreground">
              {t("dashboardSubtitle")}
            </Text>
          </View>
          <Pressable 
            onPress={() => router.push("/notifications")}
            className="h-12 w-12 items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#64748b" />
            <View className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 mb-8 shadow-sm">
          <MaterialCommunityIcons name="magnify" size={24} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-base text-foreground"
            placeholder={language === 'en' ? "Search doctor, specialty, symptoms..." : "डॉक्टर, विशेषता, लक्षण खोजें..."}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#cbd5e1" />
            </Pressable>
          )}
        </View>

        {/* Only show Quick Actions and Main CTA if not searching */}
        {searchQuery.trim() === '' && (
          <>
            {/* Quick Actions */}
            <View className="flex-row flex-wrap gap-3 mb-8">
              <View className="w-[48%]">
                <QuickActionCard
                  iconName="upload"
                  label={t("uploadReport")}
                  description={t("addPhotos")}
                  bgColor="bg-blue-50 dark:bg-blue-950"
                  iconColor="text-blue-600 dark:text-blue-400"
                  onPress={() => onCardClick?.("uploadModal")}
                />
              </View>
              <View className="w-[48%]">
                <QuickActionCard
                  iconName="file-document-outline"
                  label={t("myReports")}
                  description={t("viewReports")}
                  bgColor="bg-green-50 dark:bg-green-950"
                  iconColor="text-green-600 dark:text-green-400"
                  onPress={() => router.push("/(tabs)/reports")}
                />
              </View>
              <View className="w-[48%]">
                <QuickActionCard
                  iconName="lightning-bolt"
                  label={t("healthSummary")}
                  description={t("aiInsights")}
                  bgColor="bg-purple-50 dark:bg-purple-950"
                  iconColor="text-purple-600 dark:text-purple-400"
                  onPress={() => router.push("/(tabs)/summary")}
                />
              </View>
              <View className="w-[48%]">
                <QuickActionCard
                  iconName="calendar"
                  label={t("bookTests")}
                  description={t("homeCollection")}
                  bgColor="bg-orange-50 dark:bg-orange-950"
                  iconColor="text-orange-600 dark:text-orange-400"
                  onPress={() => router.push("/(tabs)/labs")}
                />
              </View>
            </View>

            {/* Primary CTA */}
            <Pressable
              className="health-button-primary w-full mb-8 bg-primary rounded-xl p-4 items-center"
              onPress={() => router.push("/(tabs)/doctors")}
            >
              <Text className="text-primary-foreground font-semibold">
                {language === 'en' ? 'Book Appointment' : 'अपॉइंटमेंट बुक करें'}
              </Text>
            </Pressable>
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <View className="mb-8">
                <Text className="text-lg font-semibold text-foreground mb-4">
                  {t("myAppointments") || "Upcoming Appointments"}
                </Text>
                <View className="gap-3">
                  {upcomingAppointments.map((a: any, idx: number) => (
                    <HealthCard key={a?.id ?? `${idx}`} className="p-4">
                      <View className="flex-row items-start justify-between gap-3 mb-2">
                        <View className="flex-1">
                          <Text className="font-semibold text-foreground">
                            {a?.doctor ?? "Doctor"}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {a?.specialty ?? ""}
                          </Text>
                        </View>
                        {a?.status ? (
                          <View className="px-2 py-1 rounded-lg bg-muted">
                            <Text className="text-xs font-medium text-foreground">{String(a.status)}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-sm text-muted-foreground mb-3">
                        {(a?.date ? String(a.date) : "")}
                        {a?.time ? ` · ${String(a.time)}` : ""}
                        {a?.type ? ` · ${String(a.type)}` : ""}
                      </Text>

                      {isOnlineAppointment(a?.type) ? (
                        <Pressable
                          onPress={() => {
                            const enabled = isJoinEnabled(a?.date, a?.time, a?.type);
                            if (enabled) {
                              const url = `https://meet.jit.si/appointment-portal-${a.id}`;
                              if (Platform.OS === 'web') {
                                window.open(url, '_blank');
                              } else {
                                Linking.openURL(url);
                              }
                            } else {
                              if (Platform.OS === 'web') {
                                window.alert(t("joinVideoCallAlert") || "You can only join the call 5 minutes before the scheduled time.");
                              } else {
                                alert(t("joinVideoCallAlert") || "You can only join the call 5 minutes before the scheduled time.");
                              }
                            }
                          }}
                          className={`py-2.5 rounded-lg items-center ${isJoinEnabled(a?.date, a?.time) ? 'bg-[#2A5FB7]' : 'bg-slate-200'}`}
                        >
                          <Text className={`font-semibold ${isJoinEnabled(a?.date, a?.time) ? 'text-white' : 'text-slate-400'}`}>
                            {t("joinVideoCall") || "Join Video Call"}
                          </Text>
                        </Pressable>
                      ) : null}
                    </HealthCard>
                  ))}
                </View>
              </View>
            )}


          </>
        )}

        {/* Recommended / Searched Doctors */}
        <View>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-foreground">
              {searchQuery.trim() === '' ? t("recommendedDoctors") : t("doctors")}
            </Text>
            {searchQuery.trim() === '' && (
              <Pressable onPress={() => router.push("/(tabs)/doctors")}>
                <Text className="text-primary font-medium">{t("all")}</Text>
              </Pressable>
            )}
          </View>
          <View className="gap-4">
            {displayedDoctors.map((doc) => (
              <HealthCard key={doc.id} className="p-4">
                <Pressable
                  className="flex-row items-center gap-4"
                  onPress={() => router.push({ pathname: "/doctor/[id]", params: { id: doc.id } })}
                >
                  {doc.image ? (
                    <Image
                      source={{ uri: doc.image }}
                      className="w-16 h-16 rounded-full bg-slate-100"
                    />
                  ) : (
                    <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
                      <Text className="text-primary font-bold text-lg">
                        {getInitials(doc.name || "DR")}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-lg text-foreground">
                      {doc.name}
                    </Text>
                    <Text className="text-muted-foreground mb-2">
                      {doc.specialties?.name || "Specialist"}
                    </Text>
                    {/* Fee pills */}
                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {doc.fee != null && doc.fee > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0F4FF", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#C7D2FE" }}>
                          <MaterialCommunityIcons name="cash" size={11} color="#4F46E5" />
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#4F46E5" }}>Rs. {doc.fee.toLocaleString()}</Text>
                        </View>
                      )}
                      {doc.emergency_fee != null && doc.emergency_fee > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#FDE68A" }}>
                          <MaterialCommunityIcons name="lightning-bolt" size={11} color="#D97706" />
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#D97706" }}>Emergency Rs. {doc.emergency_fee.toLocaleString()}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </HealthCard>
            ))}

            {displayedDoctors.length === 0 && (
              <View className="py-8 items-center justify-center opacity-60">
                <MaterialCommunityIcons name="doctor" size={48} color="#64748b" className="mb-4" />
                <Text className="text-lg text-foreground font-medium text-center">
                  No doctors found matching &quot;{searchQuery}&quot;
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
