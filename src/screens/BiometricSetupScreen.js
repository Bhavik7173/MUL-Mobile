// src/screens/BiometricSetupScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const BIO_KEY = 'mul-biometric-enabled';
const BIO_CREDS_KEY = 'mul-biometric-creds';

export async function authenticateWithBiometrics() {
  try {
    const LA = await import('expo-local-authentication');
    const hasHardware = await LA.hasHardwareAsync();
    if (!hasHardware) return { success: false, error: 'No biometric hardware' };
    const isEnrolled = await LA.isEnrolledAsync();
    if (!isEnrolled) return { success: false, error: 'No biometrics enrolled' };
    const result = await LA.authenticateAsync({
      promptMessage: 'Sign in to MUL Salary',
      fallbackLabel: 'Use password',
      cancelLabel: 'Cancel',
    });
    return result;
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export default function BiometricSetupScreen() {
  const { colors } = useTheme();
  const [supported, setSupported] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometrics');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometrics();
    AsyncStorage.getItem(BIO_KEY).then(val => setEnabled(val === 'true'));
  }, []);

  const checkBiometrics = async () => {
    try {
      const LA = await import('expo-local-authentication');
      const hasHW = await LA.hasHardwareAsync();
      const isEnrolled = await LA.isEnrolledAsync();
      setSupported(hasHW);
      setEnrolled(isEnrolled);
      if (hasHW) {
        const types = await LA.supportedAuthenticationTypesAsync();
        if (types.includes(2)) setBiometricType('Face ID');
        else if (types.includes(1)) setBiometricType('Fingerprint');
      }
    } catch {}
  };

  const handleToggle = async () => {
    if (enabled) {
      await AsyncStorage.removeItem(BIO_KEY);
      await AsyncStorage.removeItem(BIO_CREDS_KEY);
      setEnabled(false);
      Alert.alert('Disabled', 'Biometric login has been turned off.');
      return;
    }

    setLoading(true);
    const result = await authenticateWithBiometrics();
    setLoading(false);

    if (result.success) {
      await AsyncStorage.setItem(BIO_KEY, 'true');
      setEnabled(true);
      Alert.alert('Enabled!', `${biometricType} login is now active.`);
    } else {
      Alert.alert('Failed', result.error || 'Biometric authentication failed.');
    }
  };

  const StatusRow = ({ label, ok, text }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={16} color={ok ? colors.success : colors.error} />
        <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: ok ? colors.success : colors.error }}>{text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Biometric Login" subtitle="Use Face ID or fingerprint" />

        {/* Icon */}
        <Card style={{ alignItems: 'center', paddingVertical: 32, marginBottom: Spacing.md }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: enabled ? colors.successLight : colors.primaryLight,
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Ionicons name={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'} size={40} color={enabled ? colors.success : colors.primary} />
          </View>
          <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text }}>{biometricType}</Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4 }}>
            {enabled ? 'Currently enabled' : 'Currently disabled'}
          </Text>
        </Card>

        {/* Device status */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Device status</Text>
          <StatusRow label="Hardware available" ok={supported} text={supported ? 'Yes' : 'Not supported'} />
          <StatusRow label="Biometrics enrolled" ok={enrolled} text={enrolled ? 'Enrolled' : 'Not enrolled'} />
          <StatusRow label="Type detected" ok={supported} text={biometricType} />
        </Card>

        {/* Enable/disable */}
        {supported && enrolled ? (
          <Button
            title={loading ? 'Verifying...' : enabled ? 'Disable biometric login' : `Enable ${biometricType} login`}
            onPress={handleToggle}
            loading={loading}
            variant={enabled ? 'secondary' : 'primary'}
            icon={<Ionicons name={enabled ? 'close-outline' : 'finger-print-outline'} size={18} color={enabled ? colors.error : '#fff'} />}
            textStyle={enabled ? { color: colors.error } : undefined}
          />
        ) : (
          <View style={{ backgroundColor: colors.warningLight, borderRadius: BorderRadius.md, padding: 14 }}>
            <Text style={{ fontSize: FontSize.sm, color: colors.warning, textAlign: 'center' }}>
              {!supported
                ? 'This device does not support biometric authentication.'
                : 'Please enroll biometrics in your device Settings first.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
