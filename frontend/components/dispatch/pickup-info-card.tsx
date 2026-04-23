import HealthCard from "@/components/common/health-card";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

interface PickupInfoCardProps {
  deliveryWindow: string;
  setDeliveryWindow: (window: string) => void;
  t: (key: string) => string;
}

export function PickupInfoCard({
  deliveryWindow,
  setDeliveryWindow,
  t,
}: PickupInfoCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const deliveryOptions = ["15 Minutes", "30 Minutes", "1 Hour"];

  return (
    <View className="mb-6" style={{ zIndex: 50 }}>
      <Text className="text-lg font-semibold text-foreground mb-3">
        {t("pickupInformation")}
      </Text>
      <HealthCard className="p-4 z-50" style={{ zIndex: 50 }}>
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
              <MaterialCommunityIcons
                name="hospital-building"
                size={18}
                color="#2563eb"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">
                {t("hospital")}
              </Text>
              <Text className="text-sm font-medium text-foreground">
                Glean Cancer Center & Multispeciality Hospital
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={18}
                color="#059669"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">
                {t("address")}
              </Text>
              <Text className="text-sm font-medium text-foreground">
                Shakti Nagar Awas Vikas Colony, Bareilly
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center">
              <MaterialCommunityIcons name="doctor" size={18} color="#7c3aed" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">
                {t("doctor")}
              </Text>
              <Text className="text-sm font-medium text-foreground">
                Dr. Ritu Bhutani
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center">
              <MaterialCommunityIcons
                name="phone-outline"
                size={18}
                color="#ea580c"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">
                {t("contact")}
              </Text>
              <Text className="text-sm font-medium text-foreground">
                +91 9876543210
              </Text>
            </View>
          </View>

          {/* Delivery Dropdown Mock */}
          <View className="border-t border-border pt-4 z-50">
            <Text className="text-xs text-muted-foreground mb-2">
              {t("expectedDelivery")}
            </Text>
            <View
              className="relative z-50 pointer-events-auto"
              style={{ zIndex: 50, elevation: 10 }}
            >
              <Pressable
                onPress={() => setShowDropdown(!showDropdown)}
                className="flex-row items-center justify-between border border-border rounded-xl p-3 bg-background"
              >
                <Text className="text-sm font-medium text-foreground">
                  {deliveryWindow}
                </Text>
                <MaterialCommunityIcons
                  name={showDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748b"
                />
              </Pressable>

              {showDropdown && (
                <View
                  className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-lg"
                  style={{ zIndex: 100, elevation: 10 }}
                >
                  {deliveryOptions.map((option, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setDeliveryWindow(option);
                        setShowDropdown(false);
                      }}
                      className={`p-3 border-b border-border ${idx === deliveryOptions.length - 1 ? "border-b-0" : ""}`}
                    >
                      <Text
                        className={`text-sm ${deliveryWindow === option ? "text-primary font-bold" : "text-foreground font-medium"}`}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </HealthCard>
    </View>
  );
}
