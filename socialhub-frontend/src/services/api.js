import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Access token stored in memory (not localStorage to prevent XSS)
let accessToken = null;
let refreshPromise = null;

// Create axios instance with credentials (auto-send cookies)
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Auto-send refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ──────────────────────────────────────────────────────
// Request Interceptor: Add access token to header
// ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────────────
// Response Interceptor: Handle 401 with refresh + retry
// ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data, // Return response.data directly
  async (error) => {
    const { config, response } = error;

    // Only handle 401, skip if already retried
    if (response?.status === 401 && !config.__retry) {
      try {
        // Single-flight: if refresh already in progress, wait for it
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh');
        }

        const refreshResponse = await refreshPromise;
        accessToken = refreshResponse.data.accessToken;

        // Retry original request with new token
        config.__retry = true;
        config.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(config);
      } catch (refreshError) {
        // Refresh failed, logout
        const errorCode = refreshError.response?.data?.code;
        handleLogout(errorCode);
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    // Network error (5xx, timeout) - don't logout
    if (!response || response.status >= 500) {
      console.error('Network error:', error.message);
      return Promise.reject(error);
    }

    // Auth error after refresh attempt - logout
    if (response?.status === 401) {
      const errorCode = response.data?.code;
      handleLogout(errorCode);
    }

    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────

/**
 * Set access token (called after login or refresh)
 */
export function setAccessToken(token) {
  accessToken = token;
}

/**
 * Get current access token
 */
export function getAccessToken() {
  return accessToken;
}

/**
 * Clear access token (called on logout)
 */
export function clearAccessToken() {
  accessToken = null;
}

/**
 * Refresh access token using refresh token from cookie
 */
export async function refreshAccessToken() {
  try {
    const response = await api.post('/auth/refresh');
    accessToken = response.data.accessToken;
    return response;
  } catch (error) {
    accessToken = null;
    throw error;
  }
}

/**
 * Handle logout on auth error
 */
function handleLogout(errorCode) {
  accessToken = null;

  const messageMap = {
    TOKEN_EXPIRED: 'Phiên đã hết hạn, vui lòng đăng nhập lại',
    TOKEN_REVOKED: 'Phiên bị đăng xuất từ thiết bị khác',
    TOKEN_REUSED: 'Phát hiện bất thường, phiên bị thu hồi vì lý do bảo mật. Hãy đăng nhập lại và đổi mật khẩu nếu cần',
  };

  const message = messageMap[errorCode] || 'Phiên không hợp lệ, vui lòng đăng nhập lại';

  // Notify app of logout
  window.dispatchEvent(new CustomEvent('auth:logout', { detail: { message } }));

  // Redirect to login with message
  setTimeout(() => {
    window.location.href = `/login?message=${encodeURIComponent(message)}`;
  }, 100);
}

export default api;
