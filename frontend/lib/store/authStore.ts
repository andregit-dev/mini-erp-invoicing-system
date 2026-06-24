import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      
      set({
        user: res.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/auth/logout');
    } catch {
      // Silent error
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      window.location.href = '/login';
    }
  },

  checkAuth: async () => {
    const { user } = get();
    if (user) return true;

    try {
      const res = await api.get('/auth/me');
      set({
        user: res.data,
        isAuthenticated: true,
      });
      return true;
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      });
      return false;
    }
  },
}));
