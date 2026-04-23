// screens/ReportsScreen.tsx
import HealthCard from "@/components/common/health-card";
import { useLanguage } from "@/context/language-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from "react";
import { ActivityIndicator, Image, Linking, Modal, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import { ImagingStudy, ReportData, imagingApi, reportsApi } from "@/lib/api";
import { StyleSheet, TextInput } from "react-native";
import Markdown from 'react-native-markdown-display';

type ReportType = "blood" | "urine" | "prescription" | "scan" | "other";

interface ReportsScreenProps {
  initialShowUploadModal?: boolean;
}

const markdownStyles = StyleSheet.create({
  body: {
    color: '#334155', // slate-700
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    color: '#2A5FB7', // primary
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  strong: {
    fontWeight: 'bold',
    color: '#0f172a', // slate-900
  },
  list_item: {
    marginVertical: 4,
  },
  bullet_list: {
    marginTop: 8,
    marginBottom: 16,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  }
});

export default function ReportsScreen({ initialShowUploadModal = false }: ReportsScreenProps) {
  const { t } = useLanguage();
  const { token } = useAuth();

  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [selectedStudy, setSelectedStudy] = useState<ImagingStudy | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(initialShowUploadModal);
  const [activeTab, setActiveTab] = useState<"reports" | "imaging">("reports");

  // Dynamic state
  const [reports, setReports] = useState<ReportData[]>([]);
  const [imagingStudies, setImagingStudies] = useState<ImagingStudy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // AI Summary state for imaging
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagingSummary, setImagingSummary] = useState<string | null>(null);

  // Imaging Upload State
  const [showImagingUploadModal, setShowImagingUploadModal] = useState(false);
  const [newStudyBodyPart, setNewStudyBodyPart] = useState("");
  const [newStudyModality, setNewStudyModality] = useState("");

  // Fetch everything
  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [reportsRes, imagingRes] = await Promise.all([
        reportsApi.getAll(token),
        imagingApi.getAll(token)
      ]);
      if (reportsRes.data?.success) setReports(reportsRes.data.reports);
      if (imagingRes.data?.success) setImagingStudies(imagingRes.data.studies);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  React.useEffect(() => {
    fetchData();
  }, [token]);

  // Auto-sync summary when study is selected
  React.useEffect(() => {
    if (selectedStudy?.ai_analysis) {
      setImagingSummary(selectedStudy.ai_analysis);
    } else {
      setImagingSummary(null);
    }
  }, [selectedStudy]);

  // Sorting helper for lists
  const allReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allImaging = [...imagingStudies].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSummarizeImaging = async () => {
    if (!selectedStudy || !token) return;
    setIsAnalyzing(true);
    setImagingSummary(null);
    try {
      const res = await imagingApi.summarize(selectedStudy.id, token);
      if (res.data?.success) {
        const analysis = res.data.analysis;
        setImagingSummary(analysis);
        
        // Update local state to keep it in sync
        setImagingStudies(prev => prev.map(s => 
          s.id === selectedStudy.id ? { ...s, ai_analysis: analysis } : s
        ));
        setSelectedStudy(prev => prev ? { ...prev, ai_analysis: analysis } : null);
      } else {
        alert(res.error || "Failed to analyze image");
      }
    } catch (err) {
      console.error("Summarize error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0 && token) {
        const asset = result.assets[0];
        let fileObj: any;

        if (Platform.OS === 'web') {
          const resFetched = await fetch(asset.uri);
          const blob = await resFetched.blob();
          fileObj = new File([blob], asset.fileName || `image-${Date.now()}.jpg`, { type: asset.mimeType || 'image/jpeg' });
        } else {
          fileObj = {
            uri: asset.uri,
            name: asset.fileName || `image-${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          };
        }

        setIsUploading(true);
        const res = await reportsApi.uploadReport(fileObj, "Report", `Uploaded image`, new Date().toISOString().split('T')[0], token);
        setIsUploading(false);

        if (res.data?.success) {
          setShowUploadModal(false);
          fetchData();
        } else {
          console.error('Upload failed details:', res.error);
          alert(res.error || 'Failed to upload image. Please try again.');
        }
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Error picking image:', error);
      alert('Error uploading document');
    }
  };

  const handleImagingUpload = async (reportId?: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0 && token) {
        const asset = result.assets[0];
        let fileObj: any;

        if (Platform.OS === 'web') {
          const resFetched = await fetch(asset.uri);
          const blob = await resFetched.blob();
          fileObj = new File([blob], asset.fileName || `image-${Date.now()}.jpg`, { type: asset.mimeType || 'image/jpeg' });
        } else {
          fileObj = {
            uri: asset.uri,
            name: asset.fileName || `image-${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          };
        }

        setIsUploading(true);
        const res = await imagingApi.upload(
          fileObj,
          {
            body_part: newStudyBodyPart || (reportId ? "Report Attachment" : "Unknown"),
            modality: newStudyModality || "Scan",
            report_id: reportId
          },
          token
        );
        setIsUploading(false);

        if (res.data?.success) {
          setShowImagingUploadModal(false);
          setNewStudyBodyPart("");
          setNewStudyModality("");
          fetchData();
        } else {
          alert(res.error || 'Failed to upload imaging study.');
        }
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Error picking image:', error);
      alert('Error uploading document');
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        multiple: false,
      });

      if (!result.canceled && result.assets.length > 0 && token) {
        const asset = result.assets[0];
        console.log('[handleDocumentUpload] picking result:', asset);
        let fileObj: any;

        if (Platform.OS === 'web') {
          if ((asset as any).file) {
            fileObj = (asset as any).file;
          } else {
            const resFetched = await fetch(asset.uri);
            const blob = await resFetched.blob();
            fileObj = new File([blob], asset.name || `doc-${Date.now()}.pdf`, { type: asset.mimeType || 'application/pdf' });
          }
        } else {
          fileObj = {
            uri: asset.uri,
            name: asset.name || `pdf-${Date.now()}.pdf`,
            type: asset.mimeType || 'application/pdf',
          };
        }

        setIsUploading(true);
        const res = await reportsApi.uploadReport(fileObj, "Report", asset.name || "Report.pdf", new Date().toISOString().split('T')[0], token);
        setIsUploading(false);

        if (res.data?.success) {
          setShowUploadModal(false);
          fetchData();
        } else {
          console.error('Upload failed details:', res.error);
          alert(res.error || 'Failed to upload document. Please try again.');
        }
      }
    } catch (error) {
      setIsUploading(false);
      console.error('Error picking document:', error);
      alert('Error uploading document');
    }
  };

  // --- Render Logic ---
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {selectedReport ? (
        // --- Report Details View ---
        <>
          <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white/80">
            <Pressable
              onPress={() => setSelectedReport(null)}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-50"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#2A5FB7" />
            </Pressable>
            <Text className="text-lg font-bold text-foreground ml-3">Report Details</Text>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="p-4 pb-12">
            <View className="w-full max-w-lg mx-auto">
              <HealthCard className="p-6 mb-6">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-foreground mb-1">
                      {selectedReport.name || "Medical Report"}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <MaterialCommunityIcons name="calendar-clock" size={16} color="#64748b" />
                      <Text className="text-muted-foreground">{selectedReport.date}</Text>
                    </View>
                  </View>
                  <View className="px-3 py-1 rounded-full bg-[#2A5FB7]/10">
                    <Text className="text-xs font-bold text-[#2A5FB7] uppercase tracking-wider">{selectedReport.type}</Text>
                  </View>
                </View>

                {selectedReport.path ? (
                  <View className="mb-8">
                    <Text className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">
                      Document Preview
                    </Text>

                    <View className="w-full bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                      {selectedReport.path.toLowerCase().endsWith('.pdf') ? (
                        <View className="w-full h-56 items-center justify-center bg-white p-6">
                          <View className="w-20 h-20 rounded-2xl bg-rose-50 items-center justify-center mb-4">
                            <MaterialCommunityIcons name="file-pdf-box" size={48} color="#e11d48" />
                          </View>
                          <Text className="text-base font-semibold text-foreground text-center">PDF Document</Text>
                          <Text className="text-sm text-slate-400 text-center mt-1">Tap download to view full file</Text>
                        </View>
                      ) : (
                        <Pressable onPress={() => setPreviewImage(selectedReport.path)}>
                          <Image
                            source={{ uri: selectedReport.path }}
                            className="w-full h-64"
                            resizeMode="cover"
                          />
                          <View className="absolute bottom-3 right-3 bg-black/40 p-2 rounded-full">
                            <MaterialCommunityIcons name="magnify-plus" size={20} color="white" />
                          </View>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ) : null}

                <View className="gap-4">
                  <Pressable
                    className="bg-[#2A5FB7] py-4 rounded-xl flex-row items-center justify-center gap-2 active:opacity-90 shadow-sm"
                    onPress={() => alert("AI Insight is coming soon!")}
                  >
                    <MaterialCommunityIcons name="brain" size={20} color="white" />
                    <Text className="text-white font-bold text-base">{t("aiInsight")}</Text>
                  </Pressable>

                  <Pressable
                    className="border border-[#2A5FB7] py-4 rounded-xl flex-row items-center justify-center gap-2 active:bg-[#2A5FB7]/5"
                    onPress={() => Linking.openURL(selectedReport.path)}
                  >
                    <MaterialCommunityIcons name="download" size={20} color="#2A5FB7" />
                    <Text className="text-[#2A5FB7] font-bold text-base">{t("download")}</Text>
                  </Pressable>

                  <View className="mt-8">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                        Attached Imaging
                      </Text>
                      <Pressable
                        onPress={() => handleImagingUpload(selectedReport.id)}
                        className="flex-row items-center gap-1 bg-[#2A5FB7]/10 px-3 py-1.5 rounded-lg"
                      >
                        <MaterialCommunityIcons name="plus" size={16} color="#2A5FB7" />
                        <Text className="text-[#2A5FB7] font-bold text-xs uppercase">Add Image</Text>
                      </Pressable>
                    </View>

                    <View className="gap-3">
                      {imagingStudies.filter(s => s.report_id === selectedReport.id).length > 0 ? (
                        imagingStudies.filter(s => s.report_id === selectedReport.id).map(study => (
                          <Pressable
                            key={study.id}
                            onPress={() => {
                              setSelectedReport(null);
                              setSelectedStudy(study);
                            }}
                            className="flex-row items-center p-3 bg-slate-50 rounded-xl border border-slate-100 active:bg-blue-50"
                          >
                            <View className="w-12 h-12 rounded-lg bg-blue-100 items-center justify-center overflow-hidden">
                              {study.thumbnail ? (
                                <Image source={{ uri: study.thumbnail }} className="w-full h-full" resizeMode="cover" />
                              ) : (
                                <MaterialCommunityIcons name="image" size={24} color="#2A5FB7" />
                              )}
                            </View>
                            <View className="ml-3 flex-1">
                              <Text className="font-bold text-foreground">{study.body_part || "Imaging Study"}</Text>
                              <Text className="text-xs text-muted-foreground">{study.modality} • {study.date}</Text>
                            </View>
                            <MaterialCommunityIcons name="arrow-expand" size={18} color="#cbd5e1" />
                          </Pressable>
                        ))
                      ) : (
                        <View className="py-4 items-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          <Text className="text-slate-400 text-sm">No images attached</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </HealthCard>
            </View>
          </ScrollView>
        </>
      ) : selectedStudy ? (
        // --- Imaging Details View ---
        <>
          <View className="flex-row items-center px-4 py-3 border-b border-slate-100 bg-white/80">
            <Pressable
              onPress={() => {
                setSelectedStudy(null);
                setImagingSummary(null);
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-50"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#2A5FB7" />
            </Pressable>
            <Text className="text-lg font-bold text-foreground ml-3">Imaging Study</Text>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="p-4 pb-12">
            <View className="w-full max-w-lg mx-auto">
              <HealthCard className="p-0 border-0 bg-white shadow-sm overflow-hidden mb-6">
                <View className="w-full h-80 bg-slate-900 items-center justify-center">
                  <Image
                    source={{ uri: selectedStudy.thumbnail }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                  <Pressable
                    onPress={() => setPreviewImage(selectedStudy.thumbnail)}
                    className="absolute bottom-4 right-4 bg-black/50 p-3 rounded-full"
                  >
                    <MaterialCommunityIcons name="magnify-plus" size={24} color="white" />
                  </Pressable>
                </View>

                <View className="p-6">
                  <View className="flex-row justify-between items-center mb-6">
                    <View>
                      <Text className="text-2xl font-bold text-foreground">
                        {selectedStudy.body_part || "Imaging Study"}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <MaterialCommunityIcons name="calendar-clock" size={16} color="#64748b" />
                        <Text className="text-muted-foreground">{selectedStudy.date}</Text>
                      </View>
                    </View>
                    <View className="px-4 py-2 rounded-xl bg-[#2A5FB7]/10 items-center">
                      <Text className="text-xs font-bold text-[#2A5FB7] uppercase tracking-widest">{selectedStudy.modality}</Text>
                    </View>
                  </View>

                  {/* AI Insight Section */}
                  <View className="mb-6">
                    {!imagingSummary ? (
                      <Pressable
                        onPress={handleSummarizeImaging}
                        disabled={isAnalyzing}
                        className={`py-4 rounded-xl flex-row items-center justify-center gap-3 active:opacity-90 shadow-sm ${isAnalyzing ? 'bg-slate-300' : 'bg-primary'}`}
                      >
                        {isAnalyzing ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <MaterialCommunityIcons name="auto-fix" size={22} color="white" />
                        )}
                        <Text className="text-white font-bold text-base">
                          {isAnalyzing ? "Analyzing Scan..." : "Get AI Insight"}
                        </Text>
                      </Pressable>
                    ) : (
                      <View className="p-5 bg-slate-50 rounded-2xl border border-blue-100/50">
                        <View className="flex-row items-center gap-2 mb-3">
                          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                            <MaterialCommunityIcons name="brain" size={18} color="#2A5FB7" />
                          </View>
                          <Text className="font-bold text-[#2A5FB7] text-lg">AI Analysis</Text>
                        </View>
                        
                        <Markdown style={markdownStyles}>
                          {imagingSummary?.trim() || ""}
                        </Markdown>

                        <Text className="text-[10px] text-slate-400 mt-6 leading-4 italic">
                          This is an AI-generated analysis based on the provided image. It is not a substitute for professional medical diagnosis. A qualified healthcare professional should interpret the result.
                        </Text>
                        
                        <Pressable 
                          onPress={() => setImagingSummary(null)}
                          className="mt-4 pt-3 border-t border-slate-200"
                        >
                          <Text className="text-[#2A5FB7] font-bold text-xs text-center uppercase tracking-tighter">Regenerate Analysis</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  <View className="gap-3">
                    <Text className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Actions</Text>
                    <Pressable
                      className="border border-slate-200 py-3.5 rounded-xl flex-row items-center justify-center gap-2 active:bg-slate-50"
                      onPress={() => Linking.openURL(selectedStudy.thumbnail)}
                    >
                      <MaterialCommunityIcons name="download" size={20} color="#64748b" />
                      <Text className="text-slate-600 font-bold text-base">Download Image</Text>
                    </Pressable>
                  </View>
                </View>
              </HealthCard>
            </View>
          </ScrollView>
        </>
      ) : (
        // --- Main List View (Tabs) ---
        <>
          <View className="bg-white border-b border-slate-100">
            <View className="flex-row items-center px-4 py-3">
              <Text className="text-xl font-bold text-foreground ml-3">{t("allReports")}</Text>
            </View>

            <View className="flex-row px-4 pb-2 gap-2">
              <Pressable
                onPress={() => setActiveTab("reports")}
                className={`flex-1 py-2 rounded-full items-center ${activeTab === "reports" ? 'bg-[#2A5FB7]' : 'bg-slate-100'}`}
              >
                <Text className={`font-bold ${activeTab === "reports" ? 'text-white' : 'text-slate-500'}`}>Reports</Text>
              </Pressable>
              <Pressable
                onPress={() => setActiveTab("imaging")}
                className={`flex-1 py-2 rounded-full items-center ${activeTab === "imaging" ? 'bg-[#2A5FB7]' : 'bg-slate-100'}`}
              >
                <Text className={`font-bold ${activeTab === "imaging" ? 'text-white' : 'text-slate-500'}`}>Imaging</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="p-4 pb-24">
            <View className="w-full max-w-lg mx-auto">
              {isLoading ? (
                <View className="py-20 items-center justify-center">
                  <ActivityIndicator color="#2A5FB7" />
                  <Text className="text-muted-foreground mt-4 font-medium">Fetching records...</Text>
                </View>
              ) : activeTab === "reports" ? (
                <View className="gap-4">
                  {allReports.length > 0 ? (
                    allReports.map((report) => {
                      const isPdf = report.path?.toLowerCase().endsWith('.pdf');
                      return (
                        <Pressable
                          key={report.id}
                          onPress={() => setSelectedReport(report)}
                          className="active:opacity-90"
                        >
                          <HealthCard className="p-0 border-0 bg-slate-50/50 shadow-none">
                            <View className="flex-row items-center p-4">
                              <View className={`w-12 h-12 rounded-xl items-center justify-center ${isPdf ? 'bg-rose-50' : 'bg-blue-50'}`}>
                                <MaterialCommunityIcons
                                  name={isPdf ? "file-pdf-box" : "image-multiple"}
                                  size={24}
                                  color={isPdf ? "#e11d48" : "#2A5FB7"}
                                />
                              </View>

                              <View className="flex-1 ml-4">
                                <Text className="font-bold text-foreground text-base" numberOfLines={1}>
                                  {report.name || "Medical Report"}
                                </Text>
                                <View className="flex-row items-center gap-2 mt-0.5">
                                  <Text className="text-xs font-bold text-[#2A5FB7] uppercase tracking-tighter">
                                    {report.type}
                                  </Text>
                                  <View className="w-1 h-1 rounded-full bg-slate-300" />
                                  <Text className="text-xs text-muted-foreground">
                                    {report.date}
                                  </Text>
                                </View>
                              </View>

                              <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
                            </View>
                          </HealthCard>
                        </Pressable>
                      );
                    })
                  ) : (
                    <View className="py-20 items-center justify-center opacity-70">
                      <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
                        <MaterialCommunityIcons name="folder-open-outline" size={40} color="#94a3b8" />
                      </View>
                      <Text className="text-foreground font-bold text-lg">No reports yet</Text>
                      <Text className="text-muted-foreground text-center mt-2 px-6">
                        Start by uploading your blood tests, prescriptions, or scans for safe keeping.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View className="gap-4">
                  {allImaging.length > 0 ? (
                    <View className="flex-row flex-wrap gap-4">
                      {allImaging.map((study) => (
                        <Pressable
                          key={study.id}
                          className="w-[47%] active:opacity-90"
                          onPress={() => {
                            setSelectedStudy(study);
                          }}
                        >
                          <HealthCard className="p-0 border-0 bg-slate-50 shadow-none overflow-hidden">
                            <View className="w-full h-32 bg-slate-200 items-center justify-center">
                              {study.thumbnail ? (
                                <Image source={{ uri: study.thumbnail }} className="w-full h-full" resizeMode="cover" />
                              ) : (
                                <MaterialCommunityIcons name="image" size={32} color="#94a3b8" />
                              )}
                            </View>
                            <View className="p-3">
                              <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                                {study.body_part || "Imaging Study"}
                              </Text>
                              <Text className="text-[10px] font-bold text-[#2A5FB7] uppercase tracking-tighter mt-1">
                                {study.modality}
                              </Text>
                              <Text className="text-[10px] text-muted-foreground mt-0.5">
                                {study.date}
                              </Text>
                            </View>
                          </HealthCard>
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <View className="py-20 items-center justify-center opacity-70">
                      <View className="w-20 h-20 rounded-full bg-slate-100 items-center justify-center mb-4">
                        <MaterialCommunityIcons name="camera-outline" size={40} color="#94a3b8" />
                      </View>
                      <Text className="text-foreground font-bold text-lg">No imaging yet</Text>
                      <Text className="text-muted-foreground text-center mt-2 px-6">
                        Upload your X-rays, MRIs, or CT scans for quick access and AI analysis.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Floating Action Button (Only in List View) */}
          <Pressable
            onPress={() => activeTab === "reports" ? setShowUploadModal(true) : setShowImagingUploadModal(true)}
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
        </>
      )}

      {/* Common Modals */}
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

            <View className="gap-4 mb-2">
              <Pressable
                onPress={handleFileUpload}
                className="flex-row items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 active:bg-blue-50"
              >
                <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center">
                  <MaterialCommunityIcons name="image-multiple" size={24} color="#2A5FB7" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="font-bold text-foreground text-base">Gallery</Text>
                  <Text className="text-xs text-muted-foreground">Upload photos (JPG, PNG)</Text>
                </View>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#2A5FB7" />
              </Pressable>

              <Pressable
                onPress={handleDocumentUpload}
                className="flex-row items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 active:bg-rose-50"
              >
                <View className="w-12 h-12 rounded-xl bg-rose-100 items-center justify-center">
                  <MaterialCommunityIcons name="file-pdf-box" size={24} color="#e11d48" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="font-bold text-foreground text-base">Document</Text>
                  <Text className="text-xs text-muted-foreground">Upload PDFs or digital records</Text>
                </View>
                <MaterialCommunityIcons name="plus-circle" size={24} color="#e11d48" />
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowUploadModal(false)}
              className="mt-2 py-4 items-center"
            >
              <Text className="text-slate-400 font-bold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Imaging Upload Modal */}
      <Modal
        visible={showImagingUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagingUploadModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-card rounded-t-2xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-foreground">
                Upload Imaging
              </Text>
              <Pressable onPress={() => setShowImagingUploadModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View className="gap-4 mb-6">
              <View>
                <Text className="text-sm font-medium text-slate-500 mb-2">Body Part</Text>
                <TextInput
                  value={newStudyBodyPart}
                  onChangeText={setNewStudyBodyPart}
                  placeholder="e.g., Chest, Knee, Lower Back"
                  className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-foreground"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-slate-500 mb-2">Modality</Text>
                <TextInput
                  value={newStudyModality}
                  onChangeText={setNewStudyModality}
                  placeholder="e.g., X-Ray, MRI, CT Scan"
                  className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-foreground"
                />
              </View>
            </View>

            <Pressable
              onPress={() => handleImagingUpload()}
              className={`bg-[#2A5FB7] py-4 rounded-xl flex-row items-center justify-center gap-2 ${isUploading ? 'opacity-70' : ''}`}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="upload" size={20} color="white" />
                  <Text className="text-white font-bold text-base">Select File & Upload</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => setShowImagingUploadModal(false)}
              className="mt-4 py-2 items-center"
            >
              <Text className="text-slate-400 font-bold">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View className="flex-1 bg-black justify-center items-center">
          <Pressable
            className="absolute top-12 right-6 z-10 w-12 h-12 rounded-full bg-white/20 items-center justify-center"
            onPress={() => setPreviewImage(null)}
          >
            <MaterialCommunityIcons name="close" size={28} color="white" />
          </Pressable>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}

          <View className="absolute bottom-12 px-6 py-3 bg-black/50 rounded-full">
            <Text className="text-white font-medium">Pinch to zoom or tap X to close</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}