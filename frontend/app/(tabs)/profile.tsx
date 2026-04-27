import HealthCard from "@/components/common/health-card";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Booking {
  id: string;
  labName: string;
  testName: string;
  date: string;
  status: "confirmed" | "completed" | "pending";
}

export default function ProfileScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { logout, profile } = useAuth();
  const [, setShowSettings] = useState(false);


  const menuItems = [
    {
      icon: "account-edit",
      label: t("editProfile") || "Edit Profile",
      action: () => router.push("/profile-edit"),
    },
    {
      icon: "calendar",
      label: t("myAppointments"),
      action: () => router.push("/(tabs)/appointments"),
    },
    {
      icon: "credit-card",
      label: t("paymentHistory"),
      action: () => Alert.alert(t("paymentHistory"), "Coming soon!")
    },
    {
      icon: "account-group",
      label: t("familyMembers"),
      action: () => Alert.alert(t("familyMembers"), "Coming soon!")
    },
    {
      icon: "bell",
      label: t("notifications"),
      action: () => router.push("/notifications")
    },
    {
      icon: "help-circle",
      label: t("helpSupport"),
      action: () => Alert.alert(t("helpSupport"), "Coming soon!")
    },
    {
      icon: "cog",
      label: t("settings"),
      action: () => setShowSettings(true)
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      t("logout"),
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: t("logout"),
          onPress: () => logout(),   // clears JWT → auth guard redirects to login
          style: "destructive"
        }
      ]
    );
  };

  const handleLanguageToggle = () => {
    const newLanguage = language === "en" ? "hi" : "en";
    setLanguage(newLanguage);
  };


  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView>
        <View className="w-full max-w-lg mx-auto px-4 pt-6 pb-4">
          {/* Profile Header */}
          <View className="my-3">
            <View className="flex-row items-center gap-4 mb-6">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{
                  backgroundColor: '#2563eb',
                }}
              >
                <MaterialCommunityIcons name="account" size={32} color="#fff" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-foreground">
                  {profile?.name ? profile.name : (language === "en" ? "Your Profile" : "आपकी प्रोफ़ाइल")}
                </Text>
                <Text className="text-muted-foreground">
                  {profile?.phone ? profile.phone : ""}
                </Text>
              </View>
            </View>
          </View>



          {/* Menu Items */}
          <View className="gap-2">
            {menuItems.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={item.action}
                className="w-full flex-row items-center justify-between p-4 rounded-lg active:bg-muted/50"
              >
                <View className="flex-row items-center gap-3">
                  <MaterialCommunityIcons name={item.icon as any} size={20} color="#2563eb" />
                  <Text className="font-medium text-foreground">{item.label}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
              </Pressable>
            ))}

            {/* Language Toggle Menu Item */}
            <Pressable
              onPress={handleLanguageToggle}
              className="w-full flex-row items-center justify-between p-4 rounded-lg active:bg-muted/50"
            >
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="web" size={20} color="#2563eb" />
                <View>
                  <Text className="font-medium text-foreground">{t("language")}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {language === "en" ? t("english") : t("hindi")}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#999" />
            </Pressable>
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            className="w-full mt-8 flex-row items-center justify-center gap-2 px-4 py-3 rounded-xl border border-destructive active:bg-destructive/5"
          >
            <MaterialCommunityIcons name="logout" size={18} color="#dc2626" />
            <Text className="text-destructive font-medium">{t("logout")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}