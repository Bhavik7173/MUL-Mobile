// src/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Card, Button, SectionHeader, Divider } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const INFO_ROWS = [
  { key: 'company', label: 'Company', icon: 'business-outline', placeholder: 'Your company name' },
  { key: 'department', label: 'Department', icon: 'people-outline', placeholder: 'e.g. Operations' },
  { key: 'employeeId', label: 'Employee ID', icon: 'card-outline', placeholder: 'e.g. EMP-001' },
  { key: 'phone', label: 'Phone', icon: 'call-outline', placeholder: '+31 6 00000000' },
  { key: 'address', label: 'Address', icon: 'location-outline', placeholder: 'Your address' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    company: 'MUL Company',
    department: 'Operations',
    employeeId: 'EMP-001',
    phone: '',
    address: '',
  });
  const [draft, setDraft] = useState({ ...profile });

  const initials = (user?.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = () => {
    setProfile({ ...draft });
    setEditing(false);
    Alert.alert('Saved', 'Profile updated successfully.');
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  const stats = [
    { label: 'App version', value: '1.0.0' },
    { label: 'SDK', value: '54.0.0' },
    { label: 'Role', value: user?.role || 'User' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Profile" />

        {/* Avatar card */}
        <Card style={{ alignItems: 'center', marginBottom: Spacing.md, paddingVertical: 28 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: colors.primary,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
          }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.text }}>{user?.name}</Text>
          <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 4 }}>{user?.email}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {stats.map(({ label, value }) => (
              <View key={label} style={{ alignItems: 'center', backgroundColor: colors.background, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.primary }}>{value}</Text>
                <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Profile info */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text }}>Work info</Text>
            <TouchableOpacity
              onPress={() => editing ? handleSave() : setEditing(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: editing ? colors.primary : colors.primaryLight, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Ionicons name={editing ? 'checkmark-outline' : 'pencil-outline'} size={14} color={editing ? '#fff' : colors.primary} />
              <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: editing ? '#fff' : colors.primary }}>
                {editing ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {INFO_ROWS.map(({ key, label, icon, placeholder }) => (
            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name={icon} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 2 }}>{label}</Text>
                {editing ? (
                  <TextInput
                    value={draft[key]}
                    onChangeText={v => setDraft(d => ({ ...d, [key]: v }))}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    style={{ fontSize: FontSize.sm, color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.primary, paddingBottom: 2 }}
                  />
                ) : (
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: profile[key] ? colors.text : colors.textMuted }}>
                    {profile[key] || placeholder}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {editing && (
            <TouchableOpacity onPress={() => setEditing(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Quick links */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Quick actions</Text>
          {[
            { label: 'View dashboard', icon: 'grid-outline', color: colors.primary, onPress: () => {} },
            { label: 'Download payslip', icon: 'document-text-outline', color: colors.net, onPress: () => {} },
            { label: 'Add work entry', icon: 'add-circle-outline', color: colors.success, onPress: () => {} },
          ].map(({ label, icon, color, onPress }) => (
            <TouchableOpacity key={label} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name={icon} size={18} color={color} />
              </View>
              <Text style={{ flex: 1, fontSize: FontSize.sm, fontWeight: '500', color: colors.text }}>{label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </Card>

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
