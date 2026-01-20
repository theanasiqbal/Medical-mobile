import HealthCard from "@/components/common/health-card";
import QuickActionCard from "@/components/common/quic-action-card";
import { useLanguage } from "@/context/language-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HomeScreenProps {
  onCardClick?: (cardType: string) => void;
}

export default function HomeScreen({ onCardClick }: HomeScreenProps) {
  const { t, language } = useLanguage();

  const upcomingTests = [
    {
      name:
        language === "en"
          ? "Complete Blood Count (CBC)"
          : "संपूर्ण रक्त गणना (CBC)",
      frequency: t("monthly"),
      priority: "high",
    },
    {
      name: language === "en" ? "Lipid Profile" : "लिपिड प्रोफाइल",
      frequency: t("quarterly"),
      priority: "medium",
    },
    {
      name:
        language === "en" ? "Thyroid Function Test" : "थायराइड कार्य परीक्षण",
      frequency: t("yearly"),
      priority: "medium",
    },
    {
      name: language === "en" ? "Vitamin D Level" : "विटामिन D स्तर",
      frequency: t("yearly"),
      priority: "low",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-lg mx-auto px-4 pt-6 pb-4"
      >
        {/* Welcome Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-1">
            {t("welcome")}
          </Text>
          <Text className="text-muted-foreground">
            {t("dashboardSubtitle")}
          </Text>
        </View>

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
          onPress={() => router.push("/(tabs)/labs")}
        >
          <Text className="text-primary-foreground font-semibold">
            {t("bookSampleCollection")}
          </Text>
        </Pressable>

        {/* Offer Banner */}
        <HealthCard className="mb-8 overflow-hidden border border-primary/20 rounded-xl">
          <LinearGradient
            colors={["rgba(42, 95, 183,0.12)", "rgba(7, 134, 89,0.12)"]} // from-primary/10 → to-secondary/10 equivalent
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 16 }}
          >
            <Text className="font-semibold text-primary mb-1">
              {t("specialOffer")}
            </Text>
            <Text className="text-sm text-foreground/80">
              {t("discountText")}
            </Text>
          </LinearGradient>
        </HealthCard>

        {/* Upcoming Recommended Tests */}
        <View>
          <Text className="text-lg font-semibold text-foreground mb-4">
            {t("recommendedTests")}
          </Text>
          <View className="gap-3">
            {upcomingTests.map((test, idx) => (
              <HealthCard key={idx} className="p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-medium text-foreground">
                      {test.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-1">
                      {test.frequency}
                    </Text>
                  </View>

                  <View
                    className={`px-2 py-1 rounded-full ${
                      test.priority === "high"
                        ? "bg-red-100 dark:bg-red-950"
                        : test.priority === "medium"
                        ? "bg-yellow-100 dark:bg-yellow-950"
                        : "bg-green-100 dark:bg-green-950"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        test.priority === "high"
                          ? "text-red-700 dark:text-red-200"
                          : test.priority === "medium"
                          ? "text-yellow-700 dark:text-yellow-200"
                          : "text-green-700 dark:text-green-200"
                      }`}
                    >
                      {test.priority === "high"
                        ? t("urgent")
                        : test.priority === "medium"
                        ? t("medium")
                        : t("low")}
                    </Text>
                  </View>
                </View>
              </HealthCard>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
