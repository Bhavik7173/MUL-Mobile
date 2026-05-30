// src/theme/colors.js
// Matches the original MUL web app color scheme

export const Colors = {
  // Primary brand color (blue-indigo from original)
  primary: '#3b4fd8',
  primaryLight: '#eef0fd',
  primaryDark: '#1a1f6e',

  // Backgrounds
  background: '#f8f9ff',
  backgroundDark: '#0f1117',
  surface: '#ffffff',
  surfaceDark: '#1c1f2e',
  card: '#ffffff',
  cardDark: '#1c1f2e',

  // Text
  text: '#111827',
  textDark: '#f1f5f9',
  textSecondary: '#6b7280',
  textSecondaryDark: '#94a3b8',
  textMuted: '#9ca3af',

  // Borders
  border: '#e5e7eb',
  borderDark: '#2d3148',

  // Status colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Salary specific
  gross: '#3b4fd8',
  net: '#10b981',
  tax: '#ef4444',
  bonus: '#f59e0b',

  // Tab bar
  tabActive: '#3b4fd8',
  tabInactive: '#9ca3af',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};
