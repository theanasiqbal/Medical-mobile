import React from "react";
import { Text, TextInput, View } from "react-native";

interface NotesInputProps {
  notes: string;
  setNotes: (notes: string) => void;
  t: (key: string) => string;
}

export function NotesInput({ notes, setNotes, t }: NotesInputProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-foreground mb-3">
        {t("additionalInstructions")}
      </Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder={t("notesPlaceholder")}
        placeholderTextColor="#9ca3af" // muted-foreground
        multiline
        numberOfLines={4}
        className="w-full bg-card border border-border rounded-2xl p-4 text-foreground text-sm min-h-[100px]"
        textAlignVertical="top"
      />
    </View>
  );
}
