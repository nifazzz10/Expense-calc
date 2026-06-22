import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export const ONBOARDING_KEY = 'onboarding_seen';

async function ensureUserDefaults(userId: string) {
  const { error } = await supabase.rpc('ensure_user_defaults', { p_user_id: userId });
  if (error) console.warn('[ensureUserDefaults]', error.message);
}

export function useAuthListener() {
  const { setSession, setLoading, setOnboardingSeen } = useAuthStore();

  useEffect(() => {
    // Check onboarding flag in parallel
    SecureStore.getItemAsync(ONBOARDING_KEY).then((val) => {
      setOnboardingSeen(!!val);
    });

    // Restore existing session on app open
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      // Seed defaults for already-logged-in users — onAuthStateChange
      // may not re-fire for an existing session on cold start
      if (data.session) {
        ensureUserDefaults(data.session.user.id);
      }
    });

    // Handle login / logout / token refresh
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);

      if (session) {
        // Seed categories + rules if first login or trigger was missed
        ensureUserDefaults(session.user.id);

        // Mark onboarding done in DB (idempotent after first time)
        supabase
          .from('users')
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq('id', session.user.id)
          .is('onboarding_completed_at', null)
          .then(() => SecureStore.setItemAsync(ONBOARDING_KEY, '1'));
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);
}
