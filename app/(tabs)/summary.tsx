
import HealthCard from "@/components/common/health-card";
import { useLanguage } from "@/context/language-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Share,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HealthSummaryScreen() {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

//   const handleDownload = async () => {
//     try {
//       // Create a simple text report
//       const reportContent = `
// Health Summary Report
// ====================

// Health Score: 78/100
// Status: Good - Maintain current health habits

// Key Findings:
// - Blood Pressure: 120/80 mmHg - Normal range
// - Cholesterol Level: 180 mg/dL - Slightly elevated
// - Blood Sugar: 95 mg/dL - Normal fasting level

// Potential Deficiencies:
// - Vitamin D: Below optimal levels
// - Iron Level: Borderline low

// Lifestyle Suggestions:
// - Increase intake of green vegetables and whole grains
// - Exercise 30 minutes daily
// - Reduce sodium intake
// - Get 7-8 hours of quality sleep
//       `;

//       const fileUri = FileSystem.documentDirectory + "health-summary.txt";
//       await FileSystem.writeAsStringAsync(fileUri, reportContent);

//       // Check if sharing is available
//       const isSharingAvailable = await Sharing.isAvailableAsync();
//       if (isSharingAvailable) {
//         await Sharing.shareAsync(fileUri);
//       } else {
//         Alert.alert("Success", "Report saved to device");
//       }
//     } catch (error) {
//       console.error("Error downloading report:", error);
//       Alert.alert("Error", "Failed to download report");
//     }
//   };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message:
          "Health Summary Report\n\nHealth Score: 78/100\nStatus: Good - Maintain current health habits",
        title: "My Health Summary",
      });

      if (result.action === Share.sharedAction) {
        console.log("Shared successfully");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      Alert.alert("Error", "Failed to share report");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
    <ScrollView>
      <View className="w-full max-w-lg mx-auto px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-foreground mb-6">
          {t("healthSummary")}
        </Text>

        {/* AI Loading Animation */}
        {isGenerating && (
          <HealthCard className="p-6 mb-6 bg-primary/5 border-primary/30">
            <View className="flex-row items-center gap-3">
              <View className="relative w-6 h-6">
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
              <Text className="text-sm font-medium text-primary">
                Processing your report with AI...
              </Text>
            </View>
          </HealthCard>
        )}

        {/* Overall Health Score */}
        <LinearGradient
          colors={["#f0fdf4", "#d1fae5"]} // light mode colors
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl overflow-hidden mb-6"
        >
          <View className="p-6 items-center">
            <Text className="text-muted-foreground mb-2">
              {t("healthScore")}
            </Text>
            <Text className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
              78/100
            </Text>
            <Text className="text-sm text-muted-foreground text-center">
              Good - Maintain current health habits
            </Text>
          </View>
        </LinearGradient>

        {/* Key Findings */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialCommunityIcons
              name="chart-bar"
              size={20}
              color="#2563eb"
            />
            <Text className="text-lg font-semibold text-foreground">
              {t("keyFindings")}
            </Text>
          </View>
          <View className="gap-2">
            <HealthCard className="p-4">
              <Text className="font-medium text-foreground">
                Blood Pressure
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                120/80 mmHg - Normal range
              </Text>
            </HealthCard>
            <HealthCard className="p-4">
              <Text className="font-medium text-foreground">
                Cholesterol Level
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                180 mg/dL - Slightly elevated
              </Text>
            </HealthCard>
            <HealthCard className="p-4">
              <Text className="font-medium text-foreground">Blood Sugar</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                95 mg/dL - Normal fasting level
              </Text>
            </HealthCard>
          </View>
        </View>

        {/* Potential Deficiencies */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#ea580c"
            />
            <Text className="text-lg font-semibold text-foreground">
              {t("deficiencies")}
            </Text>
          </View>
          <View className="gap-2">
            <HealthCard className="p-4 border-orange-200 dark:border-orange-800">
              <Text className="font-medium text-foreground">Vitamin D</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Below optimal levels - Increase sunlight exposure
              </Text>
            </HealthCard>
            <HealthCard className="p-4 border-orange-200 dark:border-orange-800">
              <Text className="font-medium text-foreground">Iron Level</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Borderline low - Include iron-rich foods in diet
              </Text>
            </HealthCard>
          </View>
        </View>

        {/* Lifestyle & Diet Suggestions */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <MaterialCommunityIcons name="leaf" size={20} color="#16a34a" />
            <Text className="text-lg font-semibold text-foreground">
              {t("lifestyle")}
            </Text>
          </View>
          <View className="gap-2">
            <HealthCard className="p-4">
              <Text className="text-sm text-foreground">
                • Increase intake of green vegetables and whole grains
              </Text>
            </HealthCard>
            <HealthCard className="p-4">
              <Text className="text-sm text-foreground">
                • Exercise 30 minutes daily for cardiovascular health
              </Text>
            </HealthCard>
            <HealthCard className="p-4">
              <Text className="text-sm text-foreground">
                • Reduce sodium intake to maintain blood pressure
              </Text>
            </HealthCard>
            <HealthCard className="p-4">
              <Text className="text-sm text-foreground">
                • Get 7-8 hours of quality sleep every night
              </Text>
            </HealthCard>
          </View>
        </View>

        {/* Recommended Tests */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            {t("monthlyTests")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {[
              "CBC",
              "Lipid Panel",
              "Thyroid",
              "HbA1c",
              "Vitamins",
              "Kidney Panel",
            ].map((test, idx) => (
              <View key={idx} style={{ width: "48%" }}>
                <HealthCard className="p-3 items-center">
                  <Text className="text-sm font-medium text-foreground">
                    {test}
                  </Text>
                </HealthCard>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mb-6">
          <Pressable
            onPress={handleRegenerate}
            disabled={isGenerating}
            className="health-button-primary w-full flex-row items-center justify-center gap-2"
            style={{ opacity: isGenerating ? 0.5 : 1 }}
          >
            <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
            <Text className="text-primary-foreground font-medium">
              {t("regenerate")}
            </Text>
          </Pressable>

          <Pressable
            // onPress={handleDownload}
            className="health-button-secondary w-full flex-row items-center justify-center gap-2"
          >
            <MaterialCommunityIcons name="download" size={18} color="#2563eb" />
            <Text className="text-primary font-medium">{t("download")}</Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="health-button-secondary w-full flex-row items-center justify-center gap-2"
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={18}
              color="#2563eb"
            />
            <Text className="text-primary font-medium">{t("share")}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}
