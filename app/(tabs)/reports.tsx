// screens/ReportsScreen.tsx
import HealthCard from "@/components/common/health-card";
import { useLanguage } from "@/context/language-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReportType = "blood" | "urine" | "prescription" | "scan" | "other";

interface Report {
  id: string;
  type: string;
  date: string;
  status: "processed" | "awaiting";
  images: string[];
  category: ReportType;
}

interface ReportsScreenProps {
  initialShowUploadModal?: boolean;
}

export default function ReportsScreen({ initialShowUploadModal = false }: ReportsScreenProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ReportType>("blood");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(initialShowUploadModal);

  const reports: Report[] = [
    {
      id: "1",
      type: "Full Blood Work",
      date: "Nov 20, 2024",
      status: "processed",
      category: "blood",
      images: ["https://via.placeholder.com/400x300/e8f5e9/4caf50?text=Blood+Report"],
    },
    {
      id: "2",
      type: "Pathology Panel",
      date: "Nov 15, 2024",
      status: "processed",
      category: "blood",
      images: ["https://via.placeholder.com/400x300/e3f2fd/2196f3?text=Pathology+Report"],
    },
    {
      id: "3",
      type: "Urinalysis",
      date: "Nov 10, 2024",
      status: "awaiting",
      category: "urine",
      images: ["https://via.placeholder.com/400x300/fff3e0/ff9800?text=Urine+Report"],
    },
    {
      id: "4",
      type: "Prescription - Heart Meds",
      date: "Nov 5, 2024",
      status: "processed",
      category: "prescription",
      images: ["https://via.placeholder.com/400x300/f3e5f5/9c27b0?text=Prescription"],
    },
    {
      id: "5",
      type: "Chest X-Ray",
      date: "Oct 30, 2024",
      status: "processed",
      category: "scan",
      images: ["https://via.placeholder.com/400x300/e0f2f1/009688?text=X-Ray"],
    },
  ];

  const tabs: { id: ReportType; label: string }[] = [
    { id: "blood", label: t("blood") },
    { id: "urine", label: t("urine") },
    { id: "prescription", label: t("prescription") },
    { id: "scan", label: t("scans") },
    { id: "other", label: t("other") },
  ];

  const filteredReports = reports.filter((r) => r.category === activeTab);

  const handleFileUpload = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images!');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        console.log('Files uploaded:', result.assets.length);
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
      });

      if (!result.canceled) {
        console.log('Documents uploaded:', result.assets.length);
        setShowUploadModal(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  // Report Detail View
  if (selectedReport) {
    return (
      <ScrollView className="flex-1 bg-background">
        <View className="w-full max-w-lg mx-auto px-4 pt-6 pb-4">
          <Pressable onPress={() => setSelectedReport(null)} className="mb-6">
            <Text className="text-primary font-medium">← {t("back")}</Text>
          </Pressable>

          <HealthCard className="p-6">
            <Text className="text-2xl font-bold text-foreground mb-2">
              {selectedReport.type}
            </Text>
            <Text className="text-muted-foreground mb-6">{selectedReport.date}</Text>

            {selectedReport.images && selectedReport.images.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm text-muted-foreground mb-3">
                  {t("addReport")} ({selectedReport.images.length})
                </Text>
                <View className="gap-3">
                  {selectedReport.images.map((image, idx) => (
                    <View key={idx} className="w-full bg-muted rounded-xl overflow-hidden">
                      <Image
                        source={{ uri: image }}
                        className="w-full h-48 rounded-xl"
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="gap-3 mb-6">
              <Text>
                <Text className="text-muted-foreground">{t("date")}: </Text>
                <Text className="font-medium">{selectedReport.date}</Text>
              </Text>
              <Text>
                <Text className="text-muted-foreground">{t("status")}: </Text>
                <Text
                  className={`font-medium ${
                    selectedReport.status === "processed"
                      ? "text-green-600 dark:text-green-400"
                      : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {selectedReport.status === "processed" ? t("processed") : t("awaitingAI")}
                </Text>
              </Text>
            </View>

            <Pressable className="health-button-primary w-full mb-3 items-center">
              <Text className="text-primary-foreground font-medium">{t("aiInsight")}</Text>
            </Pressable>
            
            <Pressable className="health-button-secondary w-full flex-row items-center justify-center gap-2">
              <MaterialCommunityIcons name="download" size={18} color="#2563eb" />
              <Text className="text-primary font-medium">{t("download")}</Text>
            </Pressable>
          </HealthCard>
        </View>
      </ScrollView>
    );
  }

  // Reports List View
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
  
      <ScrollView className="flex-1">
        <View className="w-full max-w-lg mx-auto px-4 pt-6 pb-4">
          <Text className="text-2xl font-bold text-foreground mb-6">{t("allReports")}</Text>

          {/* Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerClassName="gap-2 pb-2"
          >
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full ${
                  activeTab === tab.id
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              >
                <Text
                  className={`font-medium ${
                    activeTab === tab.id
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Reports List */}
          <View className="gap-3 mb-6">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <Pressable
                  key={report.id}
                  onPress={() => setSelectedReport(report)}
                >
                  <HealthCard className="p-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground">
                          {report.type}
                        </Text>
                        <Text className="text-sm text-muted-foreground mt-1">
                          {report.date}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded-lg ${
                          report.status === "processed"
                            ? "bg-green-100 dark:bg-green-950"
                            : "bg-yellow-100 dark:bg-yellow-950"
                        }`}
                      >
                        <Text
                          className={`text-xs font-medium ${
                            report.status === "processed"
                              ? "text-green-700 dark:text-green-200"
                              : "text-yellow-700 dark:text-yellow-200"
                          }`}
                        >
                          {report.status === "processed" ? t("processed") : t("awaitingAI")}
                        </Text>
                      </View>
                    </View>
                  </HealthCard>
                </Pressable>
              ))
            ) : (
              <View className="py-8 items-center">
                <Text className="text-muted-foreground">
                  No {tabs.find((t) => t.id === activeTab)?.label} reports yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-card rounded-t-2xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-foreground">
                {t("uploadTest")}
              </Text>
              <Pressable onPress={() => setShowUploadModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <Pressable
              onPress={handleFileUpload}
              className="mb-4 p-6 border-2 border-dashed border-primary/30 rounded-xl items-center active:bg-primary/5"
            >
              <MaterialCommunityIcons name="image-plus" size={32} color="#2563eb" />
              <Text className="font-medium text-foreground mt-2">
                Upload from Gallery
              </Text>
              <Text className="text-sm text-muted-foreground">
                PNG, JPG or JPEG
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDocumentUpload}
              className="mb-6 p-6 border-2 border-dashed border-primary/30 rounded-xl items-center active:bg-primary/5"
            >
              <MaterialCommunityIcons name="file-plus" size={32} color="#2563eb" />
              <Text className="font-medium text-foreground mt-2">
                Upload Document
              </Text>
              <Text className="text-sm text-muted-foreground">
                PDF or DOC
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowUploadModal(false)}
              className="health-button-secondary w-full items-center"
            >
              <Text className="text-primary font-medium">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <Pressable
        onPress={() => setShowUploadModal(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary shadow-lg items-center justify-center active:scale-95"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
          elevation: 8,
        }}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}