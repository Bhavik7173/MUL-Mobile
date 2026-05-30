// src/screens/SickDaysScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { sickDaysApi } from '../api/client';
import { Card, Button, SectionHeader, EmptyState } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

export default function SickDaysScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [pickerTarget, setPickerTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [entRes, sumRes] = await Promise.all([
        sickDaysApi.getAll(year, null),
        sickDaysApi.summary(year),
      ]);
      setEntries(entRes.data || []);
      setSummary(sumRes.data);
    } catch (e) {
      console.warn('SickDays fetch:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const start = startDate.toISOString().slice(0, 10);
      const end = endDate.toISOString().slice(0, 10);
      if (end < start) { Alert.alert('Invalid dates', 'End must be after start.'); setSaving(false); return; }
      await sickDaysApi.add({ start_date: start, end_date: end, reason, year });
      setShowForm(false);
      setReason('');
      fetchData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to add sick day.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this sick day entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await sickDaysApi.delete(id); fetchData(); }
          catch { Alert.alert('Error', 'Failed to delete.'); }
        },
      },
    ]);
  };

  const totalDays = summary?.total_sick_days || entries.length;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!selected) return;
    if (pickerTarget === 'start') setStartDate(selected);
    else setEndDate(selected);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Sick Days"
          subtitle={`${year} records`}
          action={
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={{ backgroundColor: colors.error, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '700' }}>Add</Text>
            </TouchableOpacity>
          }
        />

        {/* Summary cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.error }}>{totalDays}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Total sick days</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.warning }}>{entries.length}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Sick periods</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: totalDays <= 5 ? colors.success : colors.error }}>
              {totalDays <= 5 ? 'OK' : 'HIGH'}
            </Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Status</Text>
          </View>
        </View>

        {/* Entries */}
        <Card>
          <SectionHeader title="Sick day records" />
          {entries.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="medkit-outline" size={40} color={colors.textSecondary} />}
              title="No sick days recorded"
              subtitle="Tap + Add to log a sick period"
            />
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="medkit-outline" size={18} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>
                    {formatDate(entry.start_date)} → {formatDate(entry.end_date)}
                  </Text>
                  {entry.reason ? (
                    <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{entry.reason}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Add modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text }}>Log Sick Day</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
              {[{ label: 'Start date', value: startDate, target: 'start' }, { label: 'End date', value: endDate, target: 'end' }].map(({ label, value, target }) => (
                <TouchableOpacity key={target} onPress={() => setPickerTarget(target)}
                  style={{ flex: 1, backgroundColor: colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 4 }}>{label}</Text>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{value.toLocaleDateString('en-GB')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {pickerTarget && (
              <DateTimePicker
                value={pickerTarget === 'start' ? startDate : endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickerChange}
                textColor={colors.text}
              />
            )}
            {pickerTarget && Platform.OS === 'ios' && (
              <TouchableOpacity onPress={() => setPickerTarget(null)} style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Done</Text>
              </TouchableOpacity>
            )}

            <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Reason (optional)</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Flu, cold..."
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: 12, fontSize: FontSize.md, color: colors.text, marginBottom: 16 }}
            />
            <Button title="Save" onPress={handleAdd} loading={saving} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
