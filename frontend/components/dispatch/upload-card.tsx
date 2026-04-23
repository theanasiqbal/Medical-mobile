import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface UploadCardProps {
  onUpload: () => void;
  t: (key: string) => string;
}

export function UploadCard({ onUpload, t }: UploadCardProps) {
  return (
    <View className="border-dashed border-2 border-border bg-card/60 p-6 rounded-2xl items-center justify-center mb-6">
      <View className="flex-row gap-4 mb-4">
        <Pressable
          onPress={onUpload}
          className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center"
        >
          <MaterialCommunityIcons
            name="camera-outline"
            size={28}
            color="#2563eb"
          />
        </Pressable>
        <Pressable
          onPress={onUpload}
          className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center"
        >
          <MaterialCommunityIcons
            name="image-outline"
            size={28}
            color="#2563eb"
          />
        </Pressable>
      </View>

      <Text className="text-lg font-semibold text-foreground text-center">
        {t("uploadPrescription")}
      </Text>
      <Text className="text-sm text-muted-foreground text-center mt-1">
        {t("supportedFormats")}
      </Text>
    </View>
  );
}
