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
import type { User } from '@supabase/supabase-js';

// DEV: skip auth — remove when Supabase SMTP is configured
const DEV_SKIP_AUTH = true;
const DEV_MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, setSession, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  if (DEV_SKIP_AUTH) {
    // Inject a mock session so user_id is available in all queries
    useEffect(() => {
      setSession({ user: DEV_MOCK_USER, access_token: 'dev', refresh_token: 'dev' } as any);
      setLoading(false);
    }, []);
  } else {
    useAuthListener();
  }

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (DEV_SKIP_AUTH) {
      if (inAuthGroup) router.replace('/(tabs)');
      return;
    }

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <BottomSheetModalProvider>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
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
