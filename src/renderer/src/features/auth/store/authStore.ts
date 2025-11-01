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
  updateUserLocation: (location: { latitude: number; longitude: number; address: string }) => Promise<void>;
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
          const response: AuthResponse & { requiresLocation?: boolean } = await window.electron.auth.login(credentials);
          
          // Check if location is required
          if (response.requiresLocation) {
            // User doesn't have location - store user data temporarily but DON'T authenticate
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: false, // Not authenticated yet - location required
              isLoading: false,
            });
            // Don't throw error - navigation will happen in LoginPage
            return;
          }

          // User has location - authenticate them
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

      updateUserLocation: async (location) => {
        try {
          const { user } = get();
          if (!user) throw new Error('User not found');
          
          // Update user location via API using /auth/profile endpoint
          const updatedUser = await window.electron.auth.updateProfile({
            location: location,
          });
          
          // The IPC handler will automatically save to local database
          // We just need to update the local state and authenticate
          
          // Update local user state and authenticate
          set({
            user: {
              ...updatedUser,
              location: location,
            },
            isAuthenticated: true, // Now authenticate the user since location is set
          });
        } catch (error: any) {
          set({ error: error?.message || 'Failed to update location' });
          throw error;
        }
      },
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
