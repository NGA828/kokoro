import axios from 'axios';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

/** Resolve a media path: backend-relative (/media/..) -> absolute, else as-is. */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/media')) {
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '');
    return `${base}${url}`;
  }
  return url;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

if (typeof window !== 'undefined') {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('km_access');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes('/auth/login') &&
      !original.url.includes('/auth/refresh') &&
      typeof window !== 'undefined'
    ) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('km_refresh');
        if (refresh) {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: refresh,
          });
          localStorage.setItem('km_access', data.accessToken);
          localStorage.setItem('km_refresh', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('km_access');
        localStorage.removeItem('km_refresh');
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a user-friendly message from an axios error. */
export function errMessage(e: unknown): string {
  const anyErr = e as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const m = anyErr?.response?.data?.message;
  if (Array.isArray(m)) return m[0] ?? 'Something went wrong.';
  if (typeof m === 'string') return m;
  return 'Something went wrong. Please try again.';
}
