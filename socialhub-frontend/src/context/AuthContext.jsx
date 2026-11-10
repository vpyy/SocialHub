import { createContext, useContext, useState, useEffect } from 'react';
import api, { setAccessToken, clearAccessToken, getAccessToken } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Restore session on app mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try to refresh using refresh token from cookie
        const response = await api.post('/auth/refresh');
        if (response.data) {
          setAccessToken(response.data.accessToken);
          // Optional: fetch user profile
          setSessionId(response.data.sessionId);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Refresh failed, user not authenticated
        clearAccessToken();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // Listen for logout events from other components
    const handleLogout = (event) => {
      logout();
    };
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const response = await api.post('/auth/login', {
        emailOrUsername,
        password,
      });

      if (response.data) {
        const { token, user: userData, sessionId: sid } = response.data;
        setAccessToken(token);
        setUser(userData);
        setSessionId(sid);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    try {
      // Call logout API to revoke session
      api.post('/auth/logout').catch(() => {});
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearAccessToken();
    setUser(null);
    setSessionId(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    redirectTo,
    sessionId,
    login,
    logout,
    setRedirectTo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
