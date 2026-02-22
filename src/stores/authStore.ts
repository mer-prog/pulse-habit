import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: user !== null,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      initialize: async () => {
        try {
          if (!isSupabaseConfigured()) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.warn('[Auth] getSession error:', error.message);
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          if (session?.user) {
            const u = session.user;
            set({
              user: {
                id: u.id,
                email: u.email ?? '',
                name: u.user_metadata?.name ?? null,
                avatar_url: u.user_metadata?.avatar_url ?? null,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }

          supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
              const u = session.user;
              set({
                user: {
                  id: u.id,
                  email: u.email ?? '',
                  name: u.user_metadata?.name ?? null,
                  avatar_url: u.user_metadata?.avatar_url ?? null,
                },
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({ user: null, isAuthenticated: false, isLoading: false });
            }
          });
        } catch (err) {
          console.error('[Auth] initialize failed:', err);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      signOut: async () => {
        try {
          if (isSupabaseConfigured()) {
            await supabase.auth.signOut();
          }
        } catch (err) {
          console.warn('[Auth] signOut error:', err);
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
