import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { apiClient } from '../lib';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: localStorage.getItem('access_token'),
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const authResp = await apiClient.login({ email, password }); // shorter name
          localStorage.setItem('access_token', authResp.access_token);
          
          const user = await apiClient.getCurrentUser();
          
          set({
            user,
            token: authResp.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true });
        try {
          const user = await apiClient.register({
            email,
            password,
            full_name: fullName,
          });
          
          // Auto-login after registration
          const authResponse = await apiClient.login({ email, password });
          localStorage.setItem('access_token', authResponse.access_token);
          
          set({
            user,
            token: authResponse.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('access_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        console.log('Auth Store: loadUser called, token exists:', !!token);
        
        if (!token) {
          console.log('Auth Store: No token found, setting unauthenticated');
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        console.log('Auth Store: Setting loading state and fetching user');
        set({ isLoading: true });
        try {
          const user = await apiClient.getCurrentUser();
          console.log('Auth Store: User loaded successfully:', user);
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('Auth Store: Authentication state set to true');
        } catch (error) {
          console.error('Auth Store: Error loading user:', error);
          // Token is invalid
          localStorage.removeItem('access_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          console.log('Auth Store: Authentication state set to false due to error');
        }
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: () => ({}), // Don't persist anything, rely on localStorage for token
    }
  )
);
