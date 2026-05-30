// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

const ThemeContext = createContext(null);
const THEME_KEY = 'mul-theme';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val) setTheme(val);
      else setTheme(systemScheme === 'dark' ? 'dark' : 'light');
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  const isDark = theme === 'dark';

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? Colors.backgroundDark : Colors.background,
    surface: isDark ? Colors.surfaceDark : Colors.surface,
    card: isDark ? Colors.cardDark : Colors.card,
    text: isDark ? Colors.textDark : Colors.text,
    textSecondary: isDark ? Colors.textSecondaryDark : Colors.textSecondary,
    border: isDark ? Colors.borderDark : Colors.border,
    primary: Colors.primary,
    primaryLight: Colors.primaryLight,
    ...Colors,
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
