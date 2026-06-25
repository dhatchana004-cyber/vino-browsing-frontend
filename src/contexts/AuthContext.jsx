import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify token on mount
    const token = sessionStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me/')
        .then(({ data }) => {
          setUser(data);
          sessionStorage.setItem('user', JSON.stringify(data));
        })
        .catch(() => {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password, role) => {
    const { data } = await api.post('/auth/login/', { username, password, role });
    if (data.status === 'pending') {
      return data;
    }
    sessionStorage.setItem('access_token', data.access);
    sessionStorage.setItem('refresh_token', data.refresh);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const loginWithToken = useCallback((data) => {
    sessionStorage.setItem('access_token', data.access);
    sessionStorage.setItem('refresh_token', data.refresh);
    sessionStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const updateUser = useCallback((updatedUser) => {
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = sessionStorage.getItem('refresh_token');
      await api.post('/auth/logout/', { refresh: refreshToken });
    } catch (e) {
      // Ignore logout errors
    }
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    setUser(null);
  }, []);

  const isOwner = user?.role === 'owner';
  const isStaff = user?.role === 'staff';

  useEffect(() => {
    if (user?.role === 'owner') {
      document.body.classList.add('theme-owner');
    } else {
      document.body.classList.remove('theme-owner');
    }
  }, [user?.role]);

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, updateUser, logout, loading, isOwner, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
