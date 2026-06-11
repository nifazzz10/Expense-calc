import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, typography } from '@/theme';
import { Screen } from '@/shared/components/layout/Screen';
import { Text } from '@/shared/components/ui/Text';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';

function humanizeAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'otp' | 'magic'>('otp');

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (authError) throw authError;

      router.push({ pathname: '/(auth)/verify', params: { email, mode } });
    } catch (err: unknown) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: 'expensecalc://auth/callback',
        },
      });

      if (authError) throw authError;
      router.push({ pathname: '/(auth)/verify', params: { email, mode: 'magic' } });
    } catch (err: unknown) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen safeArea padding={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View entering={FadeInDown.delay(0).duration(600)} style={styles.hero}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={colors.brand.gradient as [string, string]}
                style={styles.logo}
              >
                <Ionicons name="wallet" size={32} color={colors.white} />
              </LinearGradient>
            </View>
            <Text variant="headingXl" style={styles.appName}>
              Expense Tracker
            </Text>
            <Text variant="bodyLg" color="secondary" style={styles.tagline}>
              Your personal finance companion
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.form}>
            <Text variant="headingMd" style={styles.formTitle}>
              Sign in
            </Text>
            <Text variant="bodyMd" color="secondary" style={styles.formSubtitle}>
              Enter your email to continue. No password needed.
            </Text>

            <Input
              label="Email address"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
              placeholder="you@example.com"
              error={error}
              prefix={
                <Ionicons name="mail-outline" size={18} color={colors.text.tertiary} />
              }
            />

            <Button
              label={mode === 'otp' ? 'Send OTP' : 'Send Magic Link'}
              onPress={mode === 'otp' ? handleSendOTP : handleMagicLink}
              loading={loading}
              fullWidth
              size="lg"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text variant="labelSm" color="tertiary" style={styles.dividerText}>
                OR
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              label={mode === 'otp' ? 'Use Magic Link instead' : 'Use OTP instead'}
              onPress={() => setMode((m) => (m === 'otp' ? 'magic' : 'otp'))}
              variant="ghost"
              fullWidth
              size="md"
            />
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.footer}>
            <Text variant="labelSm" color="tertiary" style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Your data is encrypted and stored securely.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing[16],
    paddingBottom: spacing[10],
    gap: spacing[2],
  },
  logoContainer: {
    marginBottom: spacing[4],
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    marginTop: spacing[1],
  },
  form: {
    gap: spacing[4],
  },
  formTitle: {
    marginBottom: spacing[0.5],
  },
  formSubtitle: {
    marginBottom: spacing[2],
    lineHeight: 22,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[2],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface.border,
  },
  dividerText: {
    letterSpacing: 1,
  },
  footer: {
    marginTop: spacing[8],
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
