import { create } from 'zustand';
import { api } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loaded: boolean;
  setSession: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  refreshMe: () => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  loaded: false,
  setSession: (tokens, user) => {
    localStorage.setItem('km_access', tokens.accessToken);
    localStorage.setItem('km_refresh', tokens.refreshToken);
    set({ accessToken: tokens.accessToken, user });
  },
  refreshMe: async () => {
    try {
      const { data } = await api.get('/users/me');
      set({ user: data });
    } catch {
      /* handled by interceptor */
    }
  },
  logout: () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } catch {
      /* ignore */
    }
    localStorage.removeItem('km_access');
    localStorage.removeItem('km_refresh');
    set({ user: null, accessToken: null });
  },
  hydrate: async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('km_access') : null;
    if (!token) {
      set({ loaded: true });
      return;
    }
    try {
      const { data } = await api.get('/users/me');
      set({ user: data, accessToken: token, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
