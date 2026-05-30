// src/context/AuthContext.js
// expo-secure-store is lazy-loaded to avoid startup crash
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'mul-auth-user';

async function secureGet(key) {
  const SS = await import('expo-secure-store');
  return SS.getItemAsync(key);
}
async function secureSet(key, value) {
  const SS = await import('expo-secure-store');
  return SS.setItemAsync(key, value);
}
async function secureDel(key) {
  const SS = await import('expo-secure-store');
  return SS.deleteItemAsync(key);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    secureGet(STORAGE_KEY)
      .then((stored) => { if (stored) setUser(JSON.parse(stored)); })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (email && password.length >= 4) {
      const name = email
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const u = { email, name, role: 'User' };
      setUser(u);
      await secureSet(STORAGE_KEY, JSON.stringify(u)).catch(() => {});
      setLoading(false);
      return { success: true };
    }
    setLoading(false);
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = async () => {
    setUser(null);
    await secureDel(STORAGE_KEY).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, initializing, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
