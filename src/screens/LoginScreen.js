// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Input } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const BIO_KEY = 'mul-biometric-enabled';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('employee@company.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BIO_KEY).then(val => setBiometricAvailable(val === 'true'));
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!email) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }
    const result = await login(email, password);
    if (!result.success) setError(result.error);
  };

  const handleBiometric = async () => {
    try {
      const LA = await import('expo-local-authentication');
      const result = await LA.authenticateAsync({
        promptMessage: 'Sign in to MUL Salary',
        fallbackLabel: 'Use password',
      });
      if (result.success) {
        const result2 = await login(email || 'employee@company.com', '1234');
        if (!result2.success) setError('Biometric login failed. Please use password.');
      } else {
        Alert.alert('Authentication failed', 'Please use email and password.');
      }
    } catch {
      Alert.alert('Error', 'Biometric authentication unavailable.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={{ position: 'absolute', top: 8, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
            <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 }}>
              <Ionicons name="wallet-outline" size={30} color="#fff" />
            </View>
            <Text style={{ fontSize: FontSize.xxxl, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>MUL Salary</Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4 }}>Sign in to your salary tracker</Text>
          </View>

          {/* Card */}
          <View style={{ backgroundColor: colors.card, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 0.5, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 }}>
            <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text }}>Welcome back</Text>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4, marginBottom: 20 }}>Enter your credentials to continue</Text>

            <Input label="Email address" value={email} onChangeText={v => { setEmail(v); setError(''); }} placeholder="you@company.com" keyboardType="email-address" />
            <Input
              label="Password" value={password} onChangeText={v => { setPassword(v); setError(''); }}
              placeholder="Enter your password" secureTextEntry={!showPassword}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              }
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: BorderRadius.md, padding: 12, marginBottom: 12 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 8 }} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, flex: 1 }}>Demo: any email + 4+ char password</Text>
            </View>

            {!!error && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorLight, borderRadius: BorderRadius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fca5a5' }}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: FontSize.sm, color: colors.error, flex: 1 }}>{error}</Text>
              </View>
            )}

            <Button title="Sign In" onPress={handleLogin} loading={loading} />

            {biometricAvailable && (
              <TouchableOpacity onPress={handleBiometric} style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border }}>
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.primary }}>Sign in with biometrics</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={{ textAlign: 'center', fontSize: FontSize.xs, color: colors.textMuted, marginTop: 24 }}>
            MUL Salary Tracker © {new Date().getFullYear()}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
