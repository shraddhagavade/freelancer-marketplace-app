import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = authService.getCurrentUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  async function login(credentials) {
    const data = await authService.loginUser(credentials);
    const { token, ...userData } = data;
    setUser(userData);
    return userData;
  }

  async function register(formData) {
    const data = await authService.registerUser(formData);
    const { token, ...userData } = data;
    setUser(userData);
    return userData;
  }

  function logout() {
    authService.logout();
    setUser(null);
  }

  // Merge partial updates into the current user (e.g. avatarUrl) and persist
  function refreshUser(patch) {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
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
