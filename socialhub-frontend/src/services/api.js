import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// ──────────────────────────────────────────────────────
// Token helpers — decode JWT expiry without a library
// ──────────────────────────────────────────────────────
function parseJwtExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const exp = parseJwtExpiry(token);
  if (!exp) return true;
  // Consider expired if less than 60 seconds left (buffer)
  return Date.now() >= exp - 60_000;
}

// In-memory access token + fallback to localStorage
let accessToken = localStorage.getItem('token') || null;
let refreshPromise = null;

// ──────────────────────────────────────────────────────
// Axios instance
// ──────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ──────────────────────────────────────────────────────
// Request interceptor — attach Bearer token
// ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = accessToken || localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────────────
// Response interceptor — silent refresh on 401, then retry
// ──────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { config, response } = error;

    // Skip refresh logic entirely for auth endpoints (avoid loops)
    const url = config?.url || '';
    const isAuthEndpoint =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password') ||
      url.includes('/auth/verify-email');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // 401 on a protected endpoint — try to refresh once
    if (response?.status === 401 && !config.__retry) {
      config.__retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh');
        }
        const refreshResponse = await refreshPromise;
        const newToken =
          refreshResponse?.data?.accessToken ||
          refreshResponse?.accessToken;

        if (newToken) {
          setAccessToken(newToken);
          config.headers['Authorization'] = `Bearer ${newToken}`;
          return api(config);
        }
      } catch (refreshError) {
        // Only force logout when server explicitly says session is gone
        const status = refreshError?.response?.status;
        const code = refreshError?.response?.data?.code;
        if (status === 401) {
          handleLogout(code);
        }
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    // Network / server errors — do NOT logout, just propagate
    if (!response || response.status >= 500) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────

export function setAccessToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getAccessToken() {
  return accessToken || localStorage.getItem('token');
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('token');
}

export { isTokenExpired };

export async function refreshAccessToken() {
  try {
    const response = await api.post('/auth/refresh');
    const token =
      response?.data?.accessToken || response?.accessToken;
    if (token) setAccessToken(token);
    return response;
  } catch (error) {
    throw error;
  }
}

function handleLogout(errorCode) {
  clearAccessToken();
  localStorage.removeItem('user');

  const messageMap = {
    TOKEN_EXPIRED: 'Phiên đã hết hạn, vui lòng đăng nhập lại',
    TOKEN_REVOKED: 'Phiên bị đăng xuất từ thiết bị khác',
    TOKEN_REUSED:
      'Phát hiện bất thường, phiên bị thu hồi. Hãy đăng nhập lại và đổi mật khẩu nếu cần',
  };
  const message =
    messageMap[errorCode] ||
    'Phiên không hợp lệ, vui lòng đăng nhập lại';

  window.dispatchEvent(
    new CustomEvent('auth:logout', { detail: { message } })
  );

  const p = window.location.pathname;
  const isPublicPage =
    p === '/login' ||
    p === '/register' ||
    p.startsWith('/reset-password') ||
    p.startsWith('/verify-email') ||
    p.startsWith('/forgot-password');

  if (!isPublicPage) {
    window.location.href = `/login?message=${encodeURIComponent(message)}`;
  }
}

export default api;
