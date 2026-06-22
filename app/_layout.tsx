import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StyleSheet } from 'react-native';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useAuthListener } from '@/shared/hooks/useAuth';
import { colors } from '@/theme';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, onboardingSeen } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useAuthListener();

  useEffect(() => {
    // Wait until both auth check and SecureStore check are resolved
    if (isLoading || onboardingSeen === null) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (session) {
      if (inAuth || inOnboarding) router.replace('/(tabs)');
      return;
    }

    // No session
    if (!onboardingSeen && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (onboardingSeen && !inAuth) {
      router.replace('/(auth)/login');
    }
  }, [session, isLoading, segments, onboardingSeen]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="transaction/[id]"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="categories/index"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="rules/index"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="import/index"
                options={{ animation: 'slide_from_right' }}
              />
            </Stack>
          </AuthGuard>
        </BottomSheetModalProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
