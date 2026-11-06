import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'hengadget_user';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, []);

  // Validasi token tersimpan & segarkan role dari server.
  useEffect(() => {
    let active = true;
    const stored = readStoredUser();

    if (!stored?.token) {
      if (stored) logout();
      setLoading(false);
      return undefined;
    }

    apiRequest('/api/auth/me', { token: stored.token })
      .then((response) => {
        if (!active) return;
        login({ ...stored, ...response.user, token: stored.token });
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 404) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [login, logout]);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
