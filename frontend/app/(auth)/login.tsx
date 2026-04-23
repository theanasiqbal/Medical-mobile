import { authApi } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
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

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  const isValid = /^[6-9]\d{9}$/.test(phone);
  const fullPhone = `+91${phone}`;

  async function handleSendOtp() {
    if (!isValid || isLoading) return;
    setError('');
    setIsLoading(true);

    const result = await authApi.sendOtp(fullPhone);

    setIsLoading(false);

    if (result.error) {
      if (result.status === 429 && result.data) {
        const retryAfter = (result.data as any).retryAfter ?? 60;
        setError(`Please wait ${retryAfter}s before requesting another OTP.`);
      } else {
        setError(result.error);
      }
      return;
    }

    router.push({ pathname: '/(auth)/verify-otp', params: { phone: fullPhone } });
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Gradient Banner ── */}
          <LinearGradient
            colors={['rgba(42,95,183,0.12)', 'rgba(42,95,183,0)']}
            style={{ paddingTop: 56, paddingBottom: 48, paddingHorizontal: 24 }}
          >
            {/* Medical cross icon */}
            <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-6 shadow-md"
              style={{ shadowColor: '#2A5FB7', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
              <Text style={{ fontSize: 32 }}>🏥</Text>
            </View>

            <Text className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </Text>
            <Text className="text-base text-muted-foreground leading-relaxed">
              Enter your mobile number to{'\n'}sign in or create an account.
            </Text>
          </LinearGradient>

          {/* ── Form ── */}
          <View className="flex-1 px-6 pt-4">
            {/* Phone Input */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Mobile Number
            </Text>

            <Pressable
              onPress={() => inputRef.current?.focus()}
              className="flex-row items-center bg-card border border-border rounded-xl overflow-hidden mb-2"
              style={{ height: 56 }}
            >
              {/* Country code pill */}
              <View className="h-full px-4 items-center justify-center bg-muted border-r border-border">
                <Text className="text-sm font-semibold text-foreground">🇮🇳 +91</Text>
              </View>

              {/* Number input */}
              <TextInput
                ref={inputRef}
                value={phone}
                onChangeText={(t) => {
                  setError('');
                  setPhone(t.replace(/\D/g, '').slice(0, 10));
                }}
                placeholder="98765 43210"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={10}
                style={{
                  flex: 1,
                  paddingHorizontal: 16,
                  fontSize: 17,
                  letterSpacing: 0.5,
                  color: '#333',
                  height: '100%',
                }}
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
              />

              {/* Digit counter */}
              <Text className="text-xs text-muted-foreground pr-4">
                {phone.length}/10
              </Text>
            </Pressable>

            {/* Error message */}
            {error ? (
              <View className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            ) : (
              <Text className="text-xs text-muted-foreground mb-6 mt-1">
                We&apos;ll send a 4-digit OTP to verify your number.
              </Text>
            )}

            {/* Send OTP Button */}
            <Pressable
              id="send-otp-btn"
              onPress={handleSendOtp}
              disabled={!isValid || isLoading}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <LinearGradient
                colors={
                  isValid
                    ? ['#2A5FB7', '#1a4a9f']
                    : ['#c7d2e0', '#b8c5d6']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 54,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: '600',
                      letterSpacing: 0.3,
                    }}
                  >
                    Send OTP →
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Footer note */}
            <Text className="text-xs text-center text-muted-foreground mt-6 leading-relaxed">
              By continuing, you agree to our{' '}
              <Text className="text-primary">Terms of Service</Text> and{' '}
              <Text className="text-primary">Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
