import { create } from 'zustand';
import type { User } from '@/lib/domain/user';
import { authService } from './auth.service';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    lastName: string,
    firstName: string,
  ) => Promise<boolean>;
  logout: (router: AppRouterInstance) => Promise<void>;
};

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  loading: false,
  error: null,

  bootstrap: async () => {
    set({ loading: true, error: null });
    try {
      const session = await authService.getSession();
      const su = session?.user ?? null;

      set({
        user: su
          ? ({
              id: su.id,
              role: 'user',
              email: su.email!,
              firstName: (su.user_metadata?.first_name as string) ?? null,
              lastName: (su.user_metadata?.last_name as string) ?? null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as User)
          : null,
        loading: false,
      });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'bootstrap failed' });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user } = await authService.signInWithPassword(email, password);

      set({
        user: user
          ? {
              id: user.id,
              role: 'user',
              email: user.email!,
              firstName: (user.user_metadata?.first_name as string) ?? null,
              lastName: (user.user_metadata?.last_name as string) ?? null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null,
        loading: false,
      });
      return true;
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'login failed' });
      return false;
    }
  },

  register: async (email, password, lastName, firstName) => {
    set({ loading: true, error: null });
    try {
      await authService.signUp(email, password, lastName, firstName);
      set({ loading: false });
      return true;
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'register failed' });
      return false;
    }
  },

  logout: async router => {
    set({ loading: true, error: null });
    try {
      await authService.signOut();
      router.push('/auth/login');
      set({ user: null, loading: false });
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'logout failed' });
    }
  },
}));
