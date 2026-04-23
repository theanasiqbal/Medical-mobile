import HealthCard from "@/components/common/health-card";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { AISummary, summaryApi } from "@/lib/api";
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
  const { token } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingLatest, setIsFetchingLatest] = useState(false);
  const [summaryData, setSummaryData] = useState<AISummary | null>(null);

  // Fetch latest summary on mount
  React.useEffect(() => {
    const fetchLatest = async () => {
      if (!token) return;
      setIsFetchingLatest(true);
      try {
        const { data } = await summaryApi.getLatest(token);
        if (data?.success && data.summary) {
          setSummaryData(data.summary);
        }
      } catch (err) {
        console.error("[Summary] Error fetching latest:", err);
      } finally {
        setIsFetchingLatest(false);
      }
    };

    fetchLatest();
  }, [token]);

  const handleRegenerate = async () => {
    if (!token || isGenerating) return;

    setIsGenerating(true);
    try {
      console.log("[Summary] Generating summary...");
      const { data, error, status } = await summaryApi.generateSummary(token);
      console.log(`[Summary] Response status: ${status}`);

      if (error) {
        console.error(`[Summary] API Error: ${error}`);
        throw new Error(error);
      }

      if (data?.success) {
        console.log("[Summary] Summary generated successfully");
        setSummaryData(data.summary);
      } else {
        console.warn("[Summary] API returned success: false or no data");
      }
    } catch (err: any) {
      console.error("[Summary] generation catch error:", err.message);
      Alert.alert("Analysis Failed", err.message || "Failed to analyze reports. Ensure you have uploaded documents in the last 6 months.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!summaryData) return;
    try {
      const message = `Health Summary Report\n\nHealth Score: ${summaryData.healthScore}/100\nStatus: ${summaryData.statusMessage}\n\nFindings: ${summaryData.keyFindings.map(f => `${f.title}: ${f.value}`).join(', ')}`;
      await Share.share({
        message,
        title: "My Health AI Summary",
      });
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

          {/* Initial Loading State */}
          {isFetchingLatest && !summaryData && (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#2563eb" />
              <Text className="text-muted-foreground mt-4 font-medium">Loading your summary...</Text>
            </View>
          )}

          {/* AI Status / Loader */}
          {!isFetchingLatest && (isGenerating ? (
            <HealthCard className="p-8 mb-6 bg-primary/5 border-primary/30 items-center justify-center">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="text-base font-bold text-primary mt-4 text-center">
                AI is analyzing your reports...
              </Text>
              <Text className="text-xs text-muted-foreground mt-2 text-center">
                This may take a few seconds depending on the number of files.
              </Text>
            </HealthCard>
          ) : !summaryData ? (
             <HealthCard className="p-8 mb-6 border-dashed border-2 border-slate-200 bg-slate-50 items-center justify-center">
                <MaterialCommunityIcons name="brain" size={48} color="#94a3b8" />
                <Text className="text-lg font-bold text-slate-700 mt-4 text-center">
                  No Summary Yet
                </Text>
                <Text className="text-sm text-slate-500 mt-2 text-center mb-6">
                  Tap the button below to analyze your reports from the last 6 months using AI.
                </Text>
                <Pressable
                  onPress={handleRegenerate}
                  className="bg-primary px-6 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">Generate Analysis</Text>
                </Pressable>
             </HealthCard>
          ) : (
            <>
              {/* Overall Health Score */}
              <LinearGradient
                colors={["#f0fdf4", "#d1fae5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl overflow-hidden mb-6"
              >
                <View className="p-6 items-center">
                  <Text className="text-muted-foreground mb-2">
                    {t("healthScore")}
                  </Text>
                  <Text className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {summaryData.healthScore}/100
                  </Text>
                  <Text className="text-sm text-muted-foreground text-center font-medium">
                    {summaryData.statusMessage}
                  </Text>
                </View>
              </LinearGradient>

              {/* Key Findings */}
              {summaryData.keyFindings?.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <MaterialCommunityIcons name="chart-bar" size={20} color="#2563eb" />
                    <Text className="text-lg font-semibold text-foreground">{t("keyFindings")}</Text>
                  </View>
                  <View className="gap-2">
                    {summaryData.keyFindings.map((finding, idx) => (
                      <HealthCard key={idx} className="p-4">
                        <Text className="font-medium text-foreground">{finding.title}</Text>
                        <Text className="text-sm text-muted-foreground mt-1">{finding.value}</Text>
                      </HealthCard>
                    ))}
                  </View>
                </View>
              )}

              {/* Deficiencies */}
              {summaryData.deficiencies?.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#ea580c" />
                    <Text className="text-lg font-semibold text-foreground">{t("deficiencies")}</Text>
                  </View>
                  <View className="gap-2">
                    {summaryData.deficiencies.map((d, idx) => (
                      <HealthCard key={idx} className="p-4 border-orange-200 dark:border-orange-800">
                        <Text className="font-medium text-foreground">{d.title}</Text>
                        <Text className="text-sm text-muted-foreground mt-1">{d.value}</Text>
                      </HealthCard>
                    ))}
                  </View>
                </View>
              )}

              {/* Lifestyle & Diet Suggestions */}
              {summaryData.lifestyleSuggestions?.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center gap-2 mb-3">
                    <MaterialCommunityIcons name="leaf" size={20} color="#16a34a" />
                    <Text className="text-lg font-semibold text-foreground">{t("lifestyle")}</Text>
                  </View>
                  <View className="gap-2">
                    {summaryData.lifestyleSuggestions.map((suggestion, idx) => (
                      <HealthCard key={idx} className="p-4">
                        <Text className="text-sm text-foreground">• {suggestion}</Text>
                      </HealthCard>
                    ))}
                  </View>
                </View>
              )}

              {/* Recommended Tests */}
              {summaryData.recommendedTests?.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-foreground mb-3">{t("monthlyTests")}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {summaryData.recommendedTests.map((test, idx) => (
                      <View key={idx} style={{ width: "48%" }}>
                        <HealthCard className="p-3 items-center">
                          <Text className="text-sm font-medium text-foreground">{test}</Text>
                        </HealthCard>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              </>
            )
          )}

          {/* Action Buttons */}
          <View className="gap-3 mb-6 mt-4">
            <Pressable
              onPress={handleRegenerate}
              disabled={isGenerating}
              className="health-button-primary w-full flex-row items-center justify-center gap-2"
              style={{ opacity: isGenerating ? 0.5 : 1 }}
            >
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
              <Text className="text-primary-foreground font-medium">
                {summaryData ? t("regenerate") : "Start AI Analysis"}
              </Text>
            </Pressable>

            {summaryData && (
              <>
                <Pressable
                  onPress={handleShare}
                  className="health-button-secondary w-full flex-row items-center justify-center gap-2"
                >
                  <MaterialCommunityIcons name="share-variant" size={18} color="#2563eb" />
                  <Text className="text-primary font-medium">{t("share")}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
