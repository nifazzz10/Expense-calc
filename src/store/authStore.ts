import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  // null = SecureStore check not yet complete
  onboardingSeen: boolean | null;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingSeen: (seen: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  onboardingSeen: null,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setLoading: (isLoading) => set({ isLoading }),

  setOnboardingSeen: (seen) => set({ onboardingSeen: seen }),

  reset: () => set({ session: null, user: null, isLoading: false }),
}));
