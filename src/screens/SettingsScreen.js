// src/screens/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { settingsApi } from '../api/client';
import { Button, Input, Card, SectionHeader, Divider } from '../components/UI';
import { FontSize, Spacing } from '../theme/colors';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    hourly_rate: '14.96',
    contract_hours: '151.67',
    tax_rate: '27.64',
    bonus_amount: '6.00',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    from_email: '',
  });

  useEffect(() => {
    setLoading(true);
    settingsApi.get()
      .then((res) => {
        const d = res.data;
        setSettings({
          hourly_rate: String(d.hourly_rate ?? 14.96),
          contract_hours: String(d.contract_hours ?? 151.67),
          tax_rate: String(((d.tax_rate ?? 0.2764) * 100).toFixed(2)),
          bonus_amount: String(d.bonus_amount ?? 6.00),
          smtp_host: d.smtp_host || '',
          smtp_port: String(d.smtp_port ?? 587),
          smtp_user: d.smtp_user || '',
          smtp_password: d.smtp_password || '',
          from_email: d.from_email || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update({
        hourly_rate: parseFloat(settings.hourly_rate),
        contract_hours: parseFloat(settings.contract_hours),
        tax_rate: parseFloat(settings.tax_rate) / 100,
        bonus_amount: parseFloat(settings.bonus_amount),
        smtp_host: settings.smtp_host,
        smtp_port: parseInt(settings.smtp_port),
        smtp_user: settings.smtp_user,
        smtp_password: settings.smtp_password,
        from_email: settings.from_email,
      });
      Alert.alert('Saved', 'Settings updated successfully.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const field = (key) => ({
    value: settings[key],
    onChangeText: (v) => setSettings((s) => ({ ...s, [key]: v })),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Settings" subtitle="Configure your salary parameters" />

        {/* User profile card */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24,
              backgroundColor: colors.primaryLight,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.primary }}>
                {(user?.name || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text }}>
                {user?.name || 'Employee'}
              </Text>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>
                {user?.email}
              </Text>
            </View>
          </View>
        </Card>

        {/* Appearance */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: colors.primaryLight,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Dark mode</Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Currently {isDark ? 'on' : 'off'}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* Salary Settings */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="calculator-outline" size={18} color={colors.primary} />
            <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text }}>Salary parameters</Text>
          </View>
          <Input label="Hourly rate (€)" keyboardType="decimal-pad" {...field('hourly_rate')} />
          <Input label="Contract hours / month" keyboardType="decimal-pad" {...field('contract_hours')} />
          <Input label="Tax rate (%)" keyboardType="decimal-pad" {...field('tax_rate')} />
          <Input label="Bonus amount (€)" keyboardType="decimal-pad" {...field('bonus_amount')} />
        </Card>

        {/* Email Settings */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text }}>Email (SMTP)</Text>
          </View>
          <Input label="SMTP host" {...field('smtp_host')} placeholder="smtp.gmail.com" keyboardType="url" />
          <Input label="SMTP port" {...field('smtp_port')} keyboardType="number-pad" />
          <Input label="SMTP username" {...field('smtp_user')} keyboardType="email-address" />
          <Input label="SMTP password" {...field('smtp_password')} secureTextEntry />
          <Input label="From email" {...field('from_email')} keyboardType="email-address" />
        </Card>

        <Button title="Save Settings" onPress={handleSave} loading={saving} style={{ marginBottom: Spacing.md }} />

        <Divider />

        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="secondary"
          style={{ marginTop: Spacing.md }}
          icon={<Ionicons name="log-out-outline" size={18} color={colors.error} />}
          textStyle={{ color: colors.error }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
