import HealthCard from "@/components/common/health-card";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

interface LoaderOverlayProps {
  loadingState: "idle" | "uploading" | "notifying";
  t: (key: string) => string;
}

export function LoaderOverlay({ loadingState, t }: LoaderOverlayProps) {
  if (loadingState === "idle") return null;

  return (
    <View className="absolute inset-0 bg-background/80 z-50 items-center justify-center p-4">
      <HealthCard className="p-8 w-full max-w-xs items-center justify-center border-primary/20 shadow-lg">
        <ActivityIndicator size="large" color="#2563eb" className="mb-4" />
        <Text className="text-lg font-semibold text-foreground text-center">
          {loadingState === "uploading"
            ? t("uploadingPrescription")
            : t("notifyingPharmacy")}
        </Text>
        <Text className="text-sm text-muted-foreground text-center mt-2">
          {t("pleaseWait")}
        </Text>
      </HealthCard>
    </View>
  );
}
