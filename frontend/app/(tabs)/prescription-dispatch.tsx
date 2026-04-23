import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ImagePreviewList } from "@/components/dispatch/image-preview-list";
import { LoaderOverlay } from "@/components/dispatch/loader-overlay";
import { NotesInput } from "@/components/dispatch/notes-input";
import { PickupInfoCard } from "@/components/dispatch/pickup-info-card";
import { SubmitButton } from "@/components/dispatch/submit-button";
import { SuccessState } from "@/components/dispatch/success-state";
import { UploadCard } from "@/components/dispatch/upload-card";
import { useLanguage } from "@/context/language-context";

type SubmissionState = "idle" | "uploading" | "notifying" | "success";

export default function PrescriptionDispatchScreen() {
  const { t } = useLanguage();
  const [images, setImages] = useState<string[]>([]);
  const [deliveryWindow, setDeliveryWindow] = useState("15 Minutes");
  const [notes, setNotes] = useState("");
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");

  // Mock document picker
  const handleUpload = () => {
    // Adding a mock image URL
    setImages((prev) => [
      ...prev,
      "https://picsum.photos/200/300?random=" + Math.random(),
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setSubmissionState("uploading");

    // Simulate uploading
    setTimeout(() => {
      setSubmissionState("notifying");

      // Simulate notifying
      setTimeout(() => {
        setSubmissionState("success");
      }, 1500);
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {submissionState === "success" ? (
        <SuccessState onTrackOrder={() => router.back()} t={t} />
      ) : (
        <ScrollView className="flex-1">
          <View className="px-4 pt-6 py-6 w-full max-w-lg mx-auto">
            {/* Standardized Header */}
            <View className="mb-6 items-center">
              <Text className="text-2xl font-bold text-foreground mb-1">
                {t("sendPrescription")}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {t("pharmacySubtitle")}
              </Text>
            </View>

            <UploadCard onUpload={handleUpload} t={t} />

            <ImagePreviewList images={images} onRemove={handleRemoveImage} />

            <PickupInfoCard
              deliveryWindow={deliveryWindow}
              setDeliveryWindow={setDeliveryWindow}
              t={t}
            />

            <NotesInput notes={notes} setNotes={setNotes} t={t} />

            <SubmitButton
              onPress={handleSubmit}
              disabled={images.length === 0}
              t={t}
            />
          </View>
        </ScrollView>
      )}

      <LoaderOverlay
        loadingState={
          submissionState === "idle" || submissionState === "success"
            ? "idle"
            : submissionState
        }
        t={t}
      />
    </SafeAreaView>
  );
}
