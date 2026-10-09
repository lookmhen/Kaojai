import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'kaojai_token';
const USER_KEY = 'kaojai_user';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    setToken(null);
    setUser(null);
  }, []);

  // Helper authFetch that attaches Authorization header and handles 401 auto-logout
  const authFetch = useCallback(async (url, options = {}) => {
    const activeToken = token || localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options.headers || {});

    if (activeToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${activeToken}`);
    }

    // Default to JSON Content-Type if body is present and not FormData
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (options.body && !isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        console.warn('[AuthContext] Session expired or unauthorized (401). Logging out...');
        logout();
      }

      return response;
    } catch (err) {
      console.error(`[AuthContext] Network error calling ${url}:`, err);
      throw err;
    }
  }, [token, logout]);

  // Login handler
  const login = useCallback(async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: String(username || '').trim(),
          password: String(password || '')
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
        };
      }

      const receivedToken = data.token;
      const receivedUser = data.user;

      try {
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
      } catch (e) {
        console.error('Error saving to localStorage:', e);
      }

      setToken(receivedToken);
      setUser(receivedUser);

      return {
        success: true,
        user: receivedUser,
        token: receivedToken
      };
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      return {
        success: false,
        message: err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
      };
    }
  }, []);

  // Change password handler
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('[AuthContext] changePassword error:', err);
      return {
        success: false,
        message: err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
      };
    }
  }, [authFetch]);

  // Verify session on mount with GET /api/auth/me
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user && isMounted) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else if (isMounted) {
            logout();
          }
        } else if (response.status === 401 && isMounted) {
          logout();
        }
      } catch (err) {
        console.warn('[AuthContext] Token verification failed:', err);
        // If offline or network issue, maintain local cached user if available
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';

  const value = {
    token,
    user,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isLoading,
    login,
    logout,
    changePassword,
    authFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
