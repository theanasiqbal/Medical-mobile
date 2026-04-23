import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { patientApi } from '@/lib/api';
import { router } from 'expo-router';

const formatDistanceToNow = (date: string | Date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  return past.toLocaleDateString();
};

export default function NotificationsScreen() {
  const { token, profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!token) return;
    
    const res = await patientApi.getNotifications(token);
    if (res.data?.success) {
      setNotifications(res.data.notifications);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    
    const res = await patientApi.markNotificationRead(id, token);
    if (res.data?.success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleNotificationPress = (notification: any) => {
    markAsRead(notification.id);
    
    // Logic to handle navigation based on notification data
    if (notification.data?.appointmentId) {
      if (notification.title.includes('Approved')) {
        router.push('/(tabs)/appointments');
      } else if (notification.data?.newTime) {
         router.push('/(tabs)/appointments');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 border-b border-border/10 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-4">
          <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">Notifications</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View className="py-20 items-center">
            <Text className="text-muted-foreground">Loading...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="py-20 items-center px-10">
            <MaterialCommunityIcons name="bell-outline" size={64} color="#e2e8f0" />
            <Text className="text-lg font-semibold text-foreground mt-4">No notifications yet</Text>
            <Text className="text-muted-foreground text-center mt-2">
              We'll notify you here when there's an update on your appointments.
            </Text>
          </View>
        ) : (
          <View className="divide-y divide-border/10">
            {notifications.map((n) => (
              <Pressable
                key={n.id}
                onPress={() => handleNotificationPress(n)}
                className={`p-5 ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
              >
                <View className="flex-row items-start gap-4">
                  <View className={`p-2 rounded-full ${!n.is_read ? 'bg-blue-100 dark:bg-blue-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <MaterialCommunityIcons 
                      name={n.title.includes('Approved') ? 'check-circle' : n.title.includes('Delayed') ? 'clock-alert' : 'bell'} 
                      size={20} 
                      color={!n.is_read ? '#2a5fb7' : '#94a3b8'} 
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`text-base ${!n.is_read ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'}`}>
                        {n.title}
                      </Text>
                      {!n.is_read && <View className="h-2 w-2 rounded-full bg-blue-500" />}
                    </View>
                    <Text className="text-sm text-muted-foreground leading-5 mb-2">
                      {n.body}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground/60 font-medium">
                      {formatDistanceToNow(n.created_at)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
