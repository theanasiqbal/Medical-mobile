import HealthCard from "@/components/common/health-card";
import { useLanguage } from "@/context/language-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [showSettings, setShowSettings] = useState(false);

  const bookings: Booking[] = [
    {
      id: "1",
      labName: "Apollo Diagnostics",
      testName: language === "en" ? "Complete Blood Work" : "संपूर्ण रक्त कार्य",
      date: "Dec 2, 2024 10:00 AM",
      status: "confirmed",
    },
    {
      id: "2",
      labName: "Thyrocare",
      testName: language === "en" ? "Thyroid Panel" : "थायराइड पैनल",
      date: "Nov 28, 2024 2:00 PM",
      status: "completed",
    },
    {
      id: "3",
      labName: "Max Healthcare Labs",
      testName: language === "en" ? "Full Body Checkup" : "संपूर्ण शरीर जांच",
      date: "Nov 25, 2024",
      status: "pending",
    },
  ];

  const menuItems = [
    { 
      icon: "calendar", 
      label: t("myBookings"), 
      action: () => Alert.alert(t("myBookings"), "Coming soon!") 
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
      action: () => Alert.alert(t("notifications"), "Coming soon!") 
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
          onPress: () => {
            // Implement logout logic here
            console.log("User logged out");
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleLanguageToggle = () => {
    const newLanguage = language === "en" ? "hi" : "en";
    setLanguage(newLanguage);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          bg: "bg-blue-100 dark:bg-blue-950",
          text: "text-blue-700 dark:text-blue-200"
        };
      case "completed":
        return {
          bg: "bg-green-100 dark:bg-green-950",
          text: "text-green-700 dark:text-green-200"
        };
      case "pending":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-950",
          text: "text-yellow-700 dark:text-yellow-200"
        };
      default:
        return {
          bg: "bg-muted",
          text: "text-foreground"
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return t("bookings");
      case "completed":
        return t("completed");
      case "pending":
        return t("pending");
      default:
        return status;
    }
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
                {language === "en" ? "Raj Kumar" : "राज कुमार"}
              </Text>
              <Text className="text-muted-foreground">raj.kumar@example.com</Text>
            </View>
          </View>
        </View>

        {/* My Bookings Section */}
        <View className="mb-8">
          <Text className="text-lg font-semibold text-foreground mb-4">
            {t("myBookings")}
          </Text>
          <View className="gap-3">
            {bookings.map((booking) => {
              const statusColors = getStatusColor(booking.status);
              return (
                <HealthCard key={booking.id} className="p-4">
                  <View className="flex-row items-start justify-between gap-3 mb-2">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">
                        {booking.labName}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {booking.testName}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-lg ${statusColors.bg}`}>
                      <Text className={`text-xs font-medium ${statusColors.text}`}>
                        {getStatusLabel(booking.status)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-muted-foreground">{booking.date}</Text>
                </HealthCard>
              );
            })}
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