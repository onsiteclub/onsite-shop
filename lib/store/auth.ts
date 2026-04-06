import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  initialize: () => void;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  isLoading: true,
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      set({ user: data.user ?? null, isLoading: false });
    });

    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      set({ user: session?.user ?? null, isLoading: false });
    });
  },

  setUser: (user) => set({ user, isLoading: false }),

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
