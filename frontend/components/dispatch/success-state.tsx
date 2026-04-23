import HealthCard from "@/components/common/health-card";
import { StatusStrip } from "@/components/dispatch/status-strip";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, Text, View } from "react-native";

interface SuccessStateProps {
  onTrackOrder?: () => void;
  t: (key: string) => string;
}

export function SuccessState({ onTrackOrder, t }: SuccessStateProps) {
  const handleTrackOrder = () => {
    Alert.alert(
      "Coming Soon",
      "Order tracking feature will be available in the next update.",
    );
    if (onTrackOrder) onTrackOrder();
  };

  return (
    <View className="flex-1 px-4 py-8 items-center justify-center">
      <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-6">
        <MaterialCommunityIcons name="check" size={40} color="#059669" />
      </View>

      <Text className="text-2xl font-bold text-foreground mb-2 text-center">
        {t("prescriptionSentSuccessfully")}
      </Text>
      <Text className="text-muted-foreground text-center mb-8">
        {t("processingShortly")}
      </Text>

      <HealthCard className="w-full p-4 mb-8">
        <View className="gap-3">
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">{t("orderId")}:</Text>
            <Text className="font-semibold text-foreground">RX-2026-00124</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">{t("status")}:</Text>
            <Text className="font-semibold text-emerald-600">
              {t("pendingReview")}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">{t("pharmacy")}:</Text>
            <Text className="font-semibold text-foreground">
              Central Pharmacy
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground">
              {t("estimatedDispatch")}:
            </Text>
            <Text className="font-semibold text-foreground">
              Within 15 Minutes
            </Text>
          </View>
        </View>
      </HealthCard>

      <StatusStrip t={t} />

      <Pressable
        onPress={handleTrackOrder}
        className="health-button-primary w-full mt-auto"
      >
        <Text className="text-primary-foreground font-medium text-center text-lg">
          {t("trackOrder")}
        </Text>
      </Pressable>
    </View>
  );
}
