import { useAuth } from '@/context/auth-context';
import { patientApi, UpdateProfileData } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Gender = 'male' | 'female' | 'other';


export default function CompleteProfileScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { login } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [address, setAddress] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!name || !age || !gender || !address) {
      setError('Please fill in all details');
      return;
    }

    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await patientApi.updateProfile(
      {
        name,
        age: parseInt(age, 10),
        gender,
        address,
      },
      token
    );

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Success → Complete login global state and go to Home
    await login(token);
    router.replace('/(tabs)');
  }

  const genderOptions: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Header */}
          <LinearGradient
            colors={['rgba(42,95,183,0.10)', 'rgba(42,95,183,0)']}
            style={{ paddingTop: 40, paddingBottom: 36, paddingHorizontal: 24 }}
          >
            <Text className="text-3xl font-bold text-foreground mb-2">
              Complete Profile
            </Text>
            <Text className="text-base text-muted-foreground leading-relaxed">
              Help us personalize your healthcare experience by providing a few basic details.
            </Text>
          </LinearGradient>

          <View className="px-6 gap-6">
            {/* Name Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2 ml-1">Full Name</Text>
              <TextInput
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                className="h-14 bg-white border-2 border-slate-100 rounded-2xl px-4 text-base text-foreground focus:border-primary"
              />
            </View>

            {/* Age & Gender Row */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-2 ml-1">Age</Text>
                <TextInput
                  placeholder="Enter age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="number-pad"
                  maxLength={3}
                  className="h-14 bg-white border-2 border-slate-100 rounded-2xl px-4 text-base text-foreground focus:border-primary"
                />
              </View>

              <View className="flex-[2]">
                <Text className="text-sm font-semibold text-foreground mb-2 ml-1">Gender</Text>
                <View className="flex-row bg-slate-50 p-1 rounded-2xl border-2 border-slate-100">
                  {genderOptions.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => setGender(opt.value)}
                      className={`flex-1 h-10 items-center justify-center rounded-xl ${gender === opt.value ? 'bg-white shadow-sm' : ''
                        }`}
                    >
                      <Text
                        className={`text-sm font-medium ${gender === opt.value ? 'text-primary' : 'text-muted-foreground'
                          }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Address Input */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-2 ml-1">Address</Text>
              <TextInput
                placeholder="Enter your current residential address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="min-h-[100px] bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-base text-foreground focus:border-primary"
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <Text className="text-sm text-red-600 text-center">{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="mt-4Gulam "
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <LinearGradient
                colors={['#2A5FB7', '#1a4a9f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-lg font-bold">Save & Continue</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
