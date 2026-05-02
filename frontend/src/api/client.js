/**
 * client.js — Axios API client with security hardening
 * 
 * Security features:
 * - Token refresh with loop detection (max 1 retry)
 * - Sensitive endpoints excluded from token retry (prevents infinite loops)
 * - Error normalization (no stack traces exposed to UI)
 * - withCredentials: true for httpOnly cookie handling
 */
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Required for httpOnly refresh token cookie
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Helps server detect AJAX (CSRF mitigation)
  },
  timeout: 15000, // 15 second timeout — prevents hanging requests
});

// ─── Request Interceptor: Attach JWT ─────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ─── Response Interceptor: Token refresh + error normalization ───────────────
// Track refresh state to prevent infinite loops
let isRefreshing = false;
let refreshQueue = []; // Queue of requests waiting for token refresh

const processRefreshQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── Handle 401 with token refresh ───────────────────────────────────────
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') // Don't retry refresh itself
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 }
        );
        const { accessToken } = res.data;

        useAuthStore.getState().setAuth(useAuthStore.getState().user, accessToken);
        processRefreshQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processRefreshQueue(refreshError);
        // Refresh failed — force logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const rawMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred';
    const normalized = {
      message: typeof rawMessage === 'string' ? rawMessage : (rawMessage.message || JSON.stringify(rawMessage)),
      status: error.response?.status,
      code: error.response?.data?.code || (error.response?.status === 404 ? 'NOT_FOUND' : 'ERROR'),
      retryAfter: error.response?.data?.retryAfterMinutes,
    };

    // Log the error for developer visibility in production console
    console.error(`[API ERROR] ${normalized.code} (${normalized.status}): ${normalized.message}`);

    return Promise.reject(normalized);
  }
);

export default apiClient;
