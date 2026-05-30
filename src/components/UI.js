// src/components/UI.js
// Reusable components replacing Shadcn UI from the web app
import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, FontSize, Spacing } from '../theme/colors';

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, icon, style, textStyle, size = 'md',
}) {
  const { colors } = useTheme();
  const isSmall = size === 'sm';

  const baseStyle = {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.md,
    paddingVertical: isSmall ? 8 : 13,
    paddingHorizontal: isSmall ? 14 : 20,
    opacity: disabled || loading ? 0.6 : 1,
  };

  const variants = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.error },
    success: { backgroundColor: colors.success },
  };

  const textVariants = {
    primary: { color: '#fff' },
    secondary: { color: colors.text },
    ghost: { color: colors.primary },
    danger: { color: '#fff' },
    success: { color: '#fff' },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[baseStyle, variants[variant], style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          <Text style={[{
            fontSize: isSmall ? FontSize.sm : FontSize.md,
            fontWeight: '600',
          }, textVariants[variant], textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  const { colors } = useTheme();
  return (
    <View style={[{
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 0.5,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    }, style]}>
      {children}
    </View>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, multiline, error, style, inputStyle, editable = true,
  rightIcon,
}) {
  const { colors } = useTheme();
  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && (
        <Text style={{
          fontSize: FontSize.sm, fontWeight: '500',
          color: colors.text, marginBottom: 6,
        }}>
          {label}
        </Text>
      )}
      <View style={{ position: 'relative' }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          style={[{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
            borderRadius: BorderRadius.md,
            paddingHorizontal: 14,
            paddingVertical: 11,
            fontSize: FontSize.md,
            color: colors.text,
            minHeight: multiline ? 80 : undefined,
            paddingRight: rightIcon ? 44 : 14,
          }, inputStyle]}
        />
        {rightIcon && (
          <View style={{
            position: 'absolute', right: 12,
            top: 0, bottom: 0, justifyContent: 'center',
          }}>
            {rightIcon}
          </View>
        )}
      </View>
      {error && (
        <Text style={{ fontSize: FontSize.xs, color: colors.error, marginTop: 4 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, variant = 'default', style }) {
  const { colors } = useTheme();
  const variants = {
    default: { bg: colors.primaryLight, text: colors.primary },
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    error: { bg: colors.errorLight, text: colors.error },
    info: { bg: colors.infoLight, text: colors.info },
  };
  const v = variants[variant] || variants.default;
  return (
    <View style={[{
      backgroundColor: v.bg, borderRadius: BorderRadius.full,
      paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
    }, style]}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: v.text }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, subtitle, color, icon, style }) {
  const { colors } = useTheme();
  return (
    <View style={[{
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 0.5,
      borderColor: colors.border,
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, fontWeight: '500' }}>
          {label}
        </Text>
        {icon}
      </View>
      <Text style={{ fontSize: FontSize.xl, fontWeight: '700', color: color || colors.text }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 3 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-end',
      justifyContent: 'space-between', marginBottom: Spacing.md,
    }}>
      <View>
        <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }) {
  const { colors } = useTheme();
  return (
    <View style={{
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: 48, paddingHorizontal: 24,
    }}>
      {icon && <View style={{ marginBottom: 16, opacity: 0.4 }}>{icon}</View>}
      <Text style={{ fontSize: FontSize.lg, fontWeight: '600', color: colors.text, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{
          fontSize: FontSize.sm, color: colors.textSecondary,
          textAlign: 'center', marginTop: 8, lineHeight: 20,
        }}>
          {subtitle}
        </Text>
      )}
      {action && <View style={{ marginTop: 20 }}>{action}</View>}
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  const { colors } = useTheme();
  return <View style={[{ height: 0.5, backgroundColor: colors.border, marginVertical: Spacing.sm }, style]} />;
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
export function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
