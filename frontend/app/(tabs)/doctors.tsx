import HealthCard from "@/components/common/health-card";
import { useDoctors } from "@/context/doctors-context";
import { useLanguage } from "@/context/language-context";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Map to uniquely identify specialties for the filter chips
const SPECIALTIES = [
  "all",
  "generalPhysician",
  "cardiologist",
  "orthopedic",
  "dermatologist",
  "pediatrician",
  "dentist"
];

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function DoctorsScreen() {
  const { t } = useLanguage();
  const { doctors, isLoading } = useDoctors();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  const filteredDoctors = useMemo(() => {
    if (selectedSpecialty === "all") return doctors;
    return doctors.filter((doc) => doc.specialty_id === selectedSpecialty);
  }, [selectedSpecialty, doctors]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 pt-6 pb-2">
        <Text className="text-3xl font-bold text-foreground mb-4">
          {t("doctors")}
        </Text>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mb-2"
          contentContainerStyle={{ paddingRight: 20, gap: 8 }}
        >
          {SPECIALTIES.map((specialty) => {
            const isSelected = selectedSpecialty === specialty;
            return (
              <Pressable
                key={specialty}
                onPress={() => setSelectedSpecialty(specialty)}
                className={`px-4 py-2 rounded-full border ${isSelected
                  ? "bg-primary border-primary"
                  : "bg-transparent border-slate-200 dark:border-slate-800"
                  }`}
              >
                <Text
                  className={`font-medium ${isSelected ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                >
                  {t(specialty)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-lg mx-auto px-4 pb-24 pt-4"
      >
        <View className="gap-4">
          {filteredDoctors.map((doc) => (
            <HealthCard key={doc.id} className="p-4">
              <Pressable
                className="flex-row items-center gap-4"
                onPress={() => router.push({ pathname: "/doctor/[id]", params: { id: doc.id } })}
              >
                {doc.image ? (
                  <Image
                    source={{ uri: doc.image }}
                    className="w-20 h-20 rounded-full bg-slate-100"
                  />
                ) : (
                  <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center border border-primary/20">
                    <Text className="text-primary font-bold text-xl">
                      {getInitials(doc.name || "DR")}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-semibold text-lg text-foreground mb-1">
                    {doc.name}
                  </Text>
                  <Text className="text-primary font-medium mb-2">
                    {doc.specialties?.name || "Specialist"}
                  </Text>
                  {/* Fee row */}
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

          {filteredDoctors.length === 0 && !isLoading && (
            <View className="py-12 items-center justify-center opacity-60">
              <MaterialCommunityIcons name="doctor" size={48} color="#64748b" className="mb-4" />
              <Text className="text-lg text-foreground font-medium text-center">
                No doctors found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
