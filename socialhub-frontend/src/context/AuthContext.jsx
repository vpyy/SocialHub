import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { setAccessToken, clearAccessToken, isTokenExpired, refreshAccessToken } from '../services/api';

const AuthContext = createContext();

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────
function readStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readStoredToken() {
  return localStorage.getItem('token') || null;
}

export function AuthProvider({ children }) {
  // ── Initialise from localStorage synchronously (no flicker) ──
  const [user, setUser] = useState(() => readStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = readStoredToken();
    const user = readStoredUser();
    // Authenticated if we have BOTH a stored user AND a non-expired token
    return !!(token && user && !isTokenExpired(token));
  });
  // isLoading is only true while we attempt a background refresh
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const refreshTimerRef = useRef(null);

  // ──────────────────────────────────────────────────────
  // Schedule a proactive token refresh before it expires
  // ──────────────────────────────────────────────────────
  function scheduleProactiveRefresh(token) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return;
      const expiresAt = payload.exp * 1000;
      // Refresh 2 minutes before expiry
      const refreshAt = expiresAt - Date.now() - 2 * 60 * 1000;
      if (refreshAt <= 0) {
        // Already near-expiry, refresh now
        silentRefresh();
        return;
      }
      refreshTimerRef.current = setTimeout(() => silentRefresh(), refreshAt);
    } catch {}
  }

  // ──────────────────────────────────────────────────────
  // Silent refresh — runs in background, never logs user out
  // ──────────────────────────────────────────────────────
  async function silentRefresh() {
    try {
      const response = await api.post('/auth/refresh');
      const tokenData = response?.data || response;
      const newToken = tokenData?.accessToken;

      if (newToken) {
        setAccessToken(newToken);
        setSessionId(tokenData?.sessionId || null);
        scheduleProactiveRefresh(newToken);
      }
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;

      // Only log out if server explicitly invalidated the session
      if (status === 401 && (code === 'TOKEN_REVOKED' || code === 'TOKEN_REUSED')) {
        forceLogout(code === 'TOKEN_REUSED'
          ? 'Phát hiện bất thường, phiên bị thu hồi. Hãy đăng nhập lại và đổi mật khẩu nếu cần'
          : 'Phiên bị đăng xuất từ thiết bị khác');
        return;
      }
      // For any other failure (network error, 500, TOKEN_EXPIRED without cookie)
      // → keep user logged in with existing localStorage token
    }
  }

  // ──────────────────────────────────────────────────────
  // On mount: quick check then background refresh
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedToken = readStoredToken();
      const storedUser = readStoredUser();

      // Case 1: No stored credentials → definitely not logged in
      if (!storedToken || !storedUser) {
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      // Case 2: Token still valid → authenticate immediately, refresh in background
      if (!isTokenExpired(storedToken)) {
        if (isMounted) {
          setAccessToken(storedToken);
          setUser(storedUser);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
        // Token is valid: authenticate and schedule refresh before expiry
        scheduleProactiveRefresh(storedToken);
        return;
      }

      // Case 3: Token is expired → try to refresh using cookie
      try {
        const response = await api.post('/auth/refresh');
        const tokenData = response?.data || response;
        const newToken = tokenData?.accessToken;

        if (newToken && isMounted) {
          setAccessToken(newToken);
          setUser(storedUser);
          setSessionId(tokenData?.sessionId || null);
          setIsAuthenticated(true);
          scheduleProactiveRefresh(newToken);
        }
      } catch (err) {
        // Refresh cookie missing/expired → clean up and require re-login
        if (isMounted) {
          clearAccessToken();
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen for explicit logout events (e.g. from api.js interceptor)
    const handleLogoutEvent = (e) => {
      logout();
    };
    window.addEventListener('auth:logout', handleLogoutEvent);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:logout', handleLogoutEvent);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // ──────────────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────────────
  const login = async (emailOrUsername, password) => {
    try {
      const response = await api.post('/auth/login', { emailOrUsername, password });
      const data = response?.data || response;

      if (data?.token) {
        setAccessToken(data.token);
        const userData = data.user || null;
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
        setSessionId(data.sessionId || null);
        setIsAuthenticated(true);
        scheduleProactiveRefresh(data.token);
        return { success: true };
      }
      return { success: false, error: data?.message || 'Đăng nhập thất bại' };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Đăng nhập thất bại';
      return { success: false, error: message };
    }
  };

  // ──────────────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────────────
  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    api.post('/auth/logout').catch(() => {});
    clearAccessToken();
    localStorage.removeItem('user');
    setUser(null);
    setSessionId(null);
    setIsAuthenticated(false);
  };

  // ──────────────────────────────────────────────────────
  // Force logout with message redirect
  // ──────────────────────────────────────────────────────
  function forceLogout(message) {
    logout();
    const p = window.location.pathname;
    const isPublicPage =
      p === '/login' || p === '/register' ||
      p.startsWith('/reset-password') ||
      p.startsWith('/verify-email') ||
      p.startsWith('/forgot-password');
    if (!isPublicPage) {
      window.location.href = `/login?message=${encodeURIComponent(message)}`;
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    redirectTo,
    sessionId,
    login,
    logout,
    setUser,
    setRedirectTo,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
