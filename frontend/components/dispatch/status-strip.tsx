import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface StatusStripProps {
  t: (key: string) => string;
}

export function StatusStrip({ t }: StatusStripProps) {
  const statuses = [
    {
      label: t("pendingReview"),
      active: true,
      completed: false,
      icon: "clock-outline" as const,
    },
    {
      label: t("acceptedByPharmacy"),
      active: false,
      completed: false,
      icon: "check-circle-outline" as const,
    },
    {
      label: t("preparingMedicines"),
      active: false,
      completed: false,
      icon: "pill" as const,
    },
    {
      label: t("outForDelivery"),
      active: false,
      completed: false,
      icon: "truck-delivery-outline" as const,
    },
    {
      label: t("delivered"),
      active: false,
      completed: false,
      icon: "home-outline" as const,
    },
  ];

  return (
    <View className="w-full mb-6 relative">
      <View className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-border z-0" />

      {statuses.map((status, index) => (
        <View
          key={index}
          className="flex-row items-center mb-8 last:mb-0 relative z-10"
        >
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-4 
              ${status.active
                ? "bg-primary border-2 border-primary/20"
                : status.completed
                  ? "bg-primary"
                  : "bg-card border border-border"
              }`}
          >
            <MaterialCommunityIcons
              name={status.icon}
              size={20}
              color={status.active || status.completed ? "#fff" : "#9ca3af"}
            />
          </View>
          <View className="flex-1">
            <Text
              className={`text-base font-medium ${status.active ? "text-primary" : "text-muted-foreground"}`}
            >
              {status.label}
            </Text>
            {status.active && (
              <Text className="text-xs text-muted-foreground mt-0.5">
                {t("waitingForPharmacy")}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
