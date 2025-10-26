import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, AuthResponse } from '@shared/types/ipc.types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response: AuthResponse = await window.electron.auth.login(credentials);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error?.message || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        const { token } = get();
        if (token) {
          window.electron.auth.logout().catch(console.error);
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const newToken = await window.electron.auth.refreshToken(token);
          set({ token: newToken });
        } catch (error) {
          // Token refresh failed, logout
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
