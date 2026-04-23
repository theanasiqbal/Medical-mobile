import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { patientApi } from '@/lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileEditScreen() {
  const { t } = useLanguage();
  const { profile, token, setProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile?.gender || 'male');
  const [address, setAddress] = useState(profile?.address || '');

  const handleSave = async () => {
    if (!token || !profile) return;
    
    if (!name.trim() || !age.trim() || !address.trim()) {
      Alert.alert(t("error") || "Error", "Please fill all fields");
      return;
    }

    setIsSaving(true);
    try {
      const result = await patientApi.updateProfile(
        {
          name: name.trim(),
          age: parseInt(age),
          gender,
          address: address.trim(),
        },
        token
      );

      if (result.data?.success) {
        // Update global state
        await setProfile({
          ...profile,
          name: name.trim(),
          age: parseInt(age),
          gender,
          address: address.trim(),
        });
        
        Alert.alert(t("success") || "Success", t("profileUpdateSuccess") || "Profile updated successfully");
        router.back();
      } else {
        Alert.alert(t("error") || "Error", result.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <Pressable onPress={() => router.back()} className="p-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2A5FB7" />
          </Pressable>
          <Text className="text-xl font-bold text-foreground ml-2">Edit Profile</Text>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-6">
            
            {/* Phone (Read Only) */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-muted-foreground mb-2">Phone Number (Verified)</Text>
              <View className="flex-row items-center bg-muted/50 p-4 rounded-xl border border-border">
                <MaterialCommunityIcons name="lock" size={16} color="#64748b" />
                <Text className="text-muted-foreground ml-2 font-medium">{profile?.phone}</Text>
              </View>
            </View>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                className="bg-background p-4 rounded-xl border border-border text-foreground"
                style={{ fontSize: 16 }}
              />
            </View>

            {/* Age */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Age</Text>
              <TextInput
                value={age}
                onChangeText={(t) => setAge(t.replace(/\D/g, ''))}
                placeholder="Enter your age"
                keyboardType="numeric"
                className="bg-background p-4 rounded-xl border border-border text-foreground"
                style={{ fontSize: 16 }}
              />
            </View>

            {/* Gender */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Gender</Text>
              <View className="flex-row gap-2">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setGender(g)}
                    className={`flex-1 py-3 items-center rounded-xl border ${
                      gender === g ? 'bg-primary/10 border-primary' : 'bg-background border-border'
                    }`}
                  >
                    <Text className={`font-semibold capitalize ${gender === g ? 'text-primary' : 'text-muted-foreground'}`}>
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Address */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Full Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
                className="bg-background p-4 rounded-xl border border-border text-foreground min-h-[100px]"
                style={{ fontSize: 16, textAlignVertical: 'top' }}
              />
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className={`bg-primary p-4 rounded-xl flex-row items-center justify-center gap-2 ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color="white" />
                  <Text className="text-white font-bold text-lg">Save Changes</Text>
                </>
              )}
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
