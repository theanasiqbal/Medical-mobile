import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

interface SubmitButtonProps {
  onPress: () => void;
  disabled: boolean;
  isLoading?: boolean;
  t: (key: string) => string;
}

export function SubmitButton({
  onPress,
  disabled,
  isLoading = false,
  t,
}: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      className={`health-button-primary w-full flex-row items-center justify-center gap-2 mb-8 ${disabled || isLoading ? "opacity-50" : "opacity-100"}`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text className="text-primary-foreground font-medium text-lg">
          {t("sendToPharmacy")}
        </Text>
      )}
    </Pressable>
  );
}
