import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface AuthState {
  user: any | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, loading: false });
    supabase.auth.onAuthStateChange((_e, s) => set({ user: s?.user ?? null }));
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  register: async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
