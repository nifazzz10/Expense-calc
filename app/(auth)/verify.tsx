import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Header } from '@/shared/components/layout/Header';
import { Text } from '@/shared/components/ui/Text';
import { Button } from '@/shared/components/ui/Button';

const OTP_LENGTH = 8;

export default function VerifyScreen() {
  const { email, mode } = useLocalSearchParams<{ email: string; mode: string }>();
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (digit && newOtp.every(Boolean)) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp.join('');
    if (otpCode.length < OTP_LENGTH) {
      setError('Please enter the 8-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.verifyOtp({
        email: email!,
        token: otpCode,
        type: 'email',
      });

      if (authError) throw authError;

      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 800);
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      setError(
        msg.includes('rate limit') || msg.includes('too many')
          ? 'Too many attempts. Please wait a few minutes.'
          : msg.includes('expired') || msg.includes('invalid')
          ? 'Invalid or expired code. Please request a new one.'
          : 'Something went wrong. Please try again.'
      );
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(60);
    setError('');

    await supabase.auth.signInWithOtp({
      email: email!,
      options: { shouldCreateUser: true },
    });
  };

  if (mode === 'magic') {
    return (
      <Screen>
        <Header title="Check your inbox" back />
        <Animated.View entering={FadeInDown.duration(500)} style={styles.magicContainer}>
          <View style={styles.magicIcon}>
            <Ionicons name="mail" size={48} color={colors.brand.primary} />
          </View>
          <Text variant="headingMd" style={styles.magicTitle}>
            Magic link sent!
          </Text>
          <Text variant="bodyLg" color="secondary" style={styles.magicText}>
            We sent a magic link to{'\n'}
            <Text variant="bodyLg" style={{ color: colors.brand.secondary }}>
              {email}
            </Text>
          </Text>
          <Text variant="bodyMd" color="tertiary" style={styles.magicHint}>
            Click the link in your email to sign in. You can close this screen.
          </Text>
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen keyboardAware>
      <Header title="Enter OTP" back />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          {success ? (
            <Animated.View entering={ZoomIn.duration(400)} style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </View>
              <Text variant="headingMd">Welcome!</Text>
              <Text variant="bodyMd" color="secondary">
                Signing you in...
              </Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.info}>
                <Text variant="bodyLg" color="secondary" style={styles.infoText}>
                  We sent a 6-digit code to{'\n'}
                  <Text variant="bodyLg" style={{ color: colors.text.primary }}>
                    {email}
                  </Text>
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : null,
                      error ? styles.otpInputError : null,
                    ]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    selectionColor={colors.brand.primary}
                    autoFocus={index === 0}
                  />
                ))}
              </Animated.View>

              {error ? (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <Text variant="labelMd" color="expense" style={styles.errorText}>
                    {error}
                  </Text>
                </Animated.View>
              ) : null}

              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.actions}>
                <Button
                  label="Verify"
                  onPress={() => handleVerify()}
                  loading={loading}
                  fullWidth
                  size="lg"
                  disabled={otp.some((d) => !d)}
                />

                <Pressable onPress={handleResend} disabled={resendCooldown > 0}>
                  <Text
                    variant="bodyMd"
                    style={[
                      styles.resendText,
                      { color: resendCooldown > 0 ? colors.text.tertiary : colors.brand.primary },
                    ]}
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend code'}
                  </Text>
                </Pressable>
              </Animated.View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    gap: spacing[6],
  },
  info: {},
  infoText: {
    textAlign: 'center',
    lineHeight: 26,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: spacing[1.5],
  },
  otpInput: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.surface.border,
    backgroundColor: colors.surface.secondary,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  otpInputFilled: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.light,
  },
  otpInputError: {
    borderColor: colors.error,
  },
  errorText: {
    textAlign: 'center',
  },
  actions: {
    gap: spacing[4],
    alignItems: 'center',
  },
  resendText: {
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  successIcon: {
    marginBottom: spacing[2],
  },
  magicContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    gap: spacing[4],
  },
  magicIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  magicTitle: {
    textAlign: 'center',
  },
  magicText: {
    textAlign: 'center',
    lineHeight: 26,
  },
  magicHint: {
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing[2],
  },
});
