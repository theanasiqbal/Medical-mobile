import { useAuth } from '@/context/auth-context';
import { authApi, patientApi } from '@/lib/api';
import { OTP_EXPIRY_SECONDS } from '@/constants/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTP_LENGTH = 4;

/** Masks phone: "+919876543210" → "+91 98765 ****10" */
function maskPhone(phone: string): string {
  if (phone.length < 10) return phone;
  const digits = phone.replace('+91', '').trim();
  return `+91 ${digits.slice(0, 5)} ****${digits.slice(-2)}`;
}

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();

  // OTP input — 4 individual character slots
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // UI state
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Timer ────────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(OTP_EXPIRY_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    // Focus first box on mount
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;
  const canResend = secondsLeft === 0 && !isResending;

  // ── OTP Input Handlers ────────────────────────────────────────────────────────
  function handleDigitChange(text: string, index: number) {
    const digit = text.replace(/\D/g, '').slice(-1); // only last digit
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = [...updated.slice(0, OTP_LENGTH - 1), digit].join('');
      if (fullOtp.length === OTP_LENGTH) handleVerify(fullOtp);
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace') {
      const updated = [...digits];
      if (updated[index]) {
        updated[index] = '';
        setDigits(updated);
      } else if (index > 0) {
        updated[index - 1] = '';
        setDigits(updated);
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  // ── Verify ────────────────────────────────────────────────────────────────────
  const handleVerify = useCallback(
    async (otp?: string) => {
      const code = otp ?? digits.join('');
      if (code.length !== OTP_LENGTH || isVerifying) return;
      setError('');
      setIsVerifying(true);

      const result = await authApi.verifyOtp(phone!, code);
      setIsVerifying(false);

      if (result.error || !result.data) {
        console.log('[DEBUG] Verify OTP Error:', result.error);
        setError(result.error ?? 'Verification failed. Please try again.');
        // Shake — clear digits and refocus
        setDigits(Array(OTP_LENGTH).fill(''));
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        return;
      }

      console.log('[DEBUG] Verify OTP Success:', result.data);

      if (result.data.isNewUser) {
        // Don't call login() globally yet to prevent _layout.tsx auth guard
        // from instantly redirecting us to /(tabs). Pass token as parameter.
        router.replace(`/(auth)/complete-profile?token=${result.data.token}&phone=${encodeURIComponent(phone!)}`);
      } else {
        // Existing user, log in and go to tabs
        const profileResult = await patientApi.getProfile(result.data.token);
        const nextProfile = profileResult.data?.profile
          ? { ...profileResult.data.profile }
          : null;
        await login(result.data.token, nextProfile);
        router.replace('/(tabs)');
      }
    },
    [digits, isVerifying, phone, login]
  );

  // ── Resend ───────────────────────────────────────────────────────────────────
  async function handleResend() {
    if (!canResend) return;
    setError('');
    setSuccessMsg('');
    setIsResending(true);
    setDigits(Array(OTP_LENGTH).fill(''));

    const result = await authApi.sendOtp(phone!);
    setIsResending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccessMsg('A new OTP has been sent.');
    startTimer();
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={['rgba(42,95,183,0.10)', 'rgba(42,95,183,0)']}
          style={{ paddingTop: 40, paddingBottom: 36, paddingHorizontal: 24 }}
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center mb-6"
            hitSlop={12}
          >
            <Text className="text-primary text-base">← Back</Text>
          </Pressable>

          <Text className="text-3xl font-bold text-foreground mb-2">
            Verify your number
          </Text>
          <Text className="text-base text-muted-foreground leading-relaxed">
            Enter the 4-digit code sent to{'\n'}
            <Text className="font-semibold text-foreground">{maskPhone(phone ?? '')}</Text>
          </Text>
        </LinearGradient>

        {/* ── OTP Boxes ── */}
        <View className="px-6 pt-2">
          <View className="flex-row justify-between mb-6" style={{ gap: 12 }}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => {
              const isFilled = !!digits[i];
              const isActive = digits.slice(0, i).every(Boolean) && !digits[i];
              return (
                <TextInput
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  value={digits[i]}
                  onChangeText={(t) => handleDigitChange(t, i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    maxWidth: 72,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: error
                      ? '#ef4444'
                      : isFilled
                      ? '#2A5FB7'
                      : isActive
                      ? '#93b4e8'
                      : '#e5e7eb',
                    backgroundColor: isFilled ? 'rgba(42,95,183,0.06)' : '#fff',
                    textAlign: 'center',
                    fontSize: 28,
                    fontWeight: '700',
                    color: '#1a1a2e',
                  }}
                />
              );
            })}
          </View>

          {/* Error / Success message */}
          {error ? (
            <View className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-red-600 text-center">{error}</Text>
            </View>
          ) : successMsg ? (
            <View className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
              <Text className="text-sm text-green-700 text-center">{successMsg}</Text>
            </View>
          ) : null}

          {/* ── Timer + Resend ── */}
          <View className="flex-row items-center justify-center mb-8" style={{ gap: 8 }}>
            {secondsLeft > 0 ? (
              <>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-primary font-bold text-sm">{timerLabel}</Text>
                </View>
                <Text className="text-muted-foreground text-sm">Code expires in</Text>
              </>
            ) : (
              <Text className="text-muted-foreground text-sm">Code expired.</Text>
            )}
          </View>

          {/* ── Verify Button ── */}
          <Pressable
            id="verify-otp-btn"
            onPress={() => handleVerify()}
            disabled={digits.join('').length !== OTP_LENGTH || isVerifying}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginBottom: 16 })}
          >
            <LinearGradient
              colors={
                digits.join('').length === OTP_LENGTH
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
              }}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Verify & Continue
                </Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* ── Resend Button ── */}
          <Pressable
            id="resend-otp-btn"
            onPress={handleResend}
            disabled={!canResend}
            style={({ pressed }) => ({
              opacity: canResend ? (pressed ? 0.7 : 1) : 0.4,
              alignItems: 'center',
              paddingVertical: 12,
            })}
          >
            {isResending ? (
              <ActivityIndicator color="#2A5FB7" size="small" />
            ) : (
              <Text
                className={canResend ? 'text-primary font-semibold' : 'text-muted-foreground'}
                style={{ fontSize: 15 }}
              >
                Resend OTP
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
