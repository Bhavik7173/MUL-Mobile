// src/screens/VacationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { vacationApi } from '../api/client';
import { Card, Button, SectionHeader, EmptyState, Badge } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

export default function VacationScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [pickerTarget, setPickerTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [entRes, balRes] = await Promise.all([
        vacationApi.getEntries(year, null),
        vacationApi.getBalances(),
      ]);
      setEntries(entRes.data || []);
      const b = (balRes.data || []).find(b => b.year === year);
      setBalance(b || { total_entitlement: 25, used_days: 0, remaining_days: 25 });
    } catch (e) {
      console.warn('Vacation fetch:', e.message);
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
      if (end < start) {
        Alert.alert('Invalid dates', 'End date must be after start date.');
        setSaving(false);
        return;
      }
      await vacationApi.addEntry({ start_date: start, end_date: end, year });
      setShowForm(false);
      fetchData();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to add vacation entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this vacation entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await vacationApi.deleteEntry(id);
            fetchData();
          } catch { Alert.alert('Error', 'Failed to delete entry.'); }
        },
      },
    ]);
  };

  const used = balance?.used_days || 0;
  const total = balance?.total_entitlement || 25;
  const remaining = balance?.remaining_days ?? (total - used);
  const pct = Math.min((used / total) * 100, 100);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const openPicker = (target) => {
    setPickerTarget(target);
  };

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
          title="Vacation"
          subtitle={`${year} overview`}
          action={
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              style={{ backgroundColor: colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '700' }}>Add</Text>
            </TouchableOpacity>
          }
        />

        {/* Balance card */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
            Vacation balance {year}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Total days', value: total, color: colors.primary },
              { label: 'Used', value: used, color: colors.warning },
              { label: 'Remaining', value: remaining, color: colors.success },
            ].map(({ label, value, color }) => (
              <View key={label} style={{ flex: 1, backgroundColor: colors.background, borderRadius: BorderRadius.md, padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xxl, fontWeight: '800', color }}>{value}</Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 80 ? colors.error : colors.warning, borderRadius: 4 }} />
          </View>
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 6 }}>
            {used} of {total} days used ({pct.toFixed(0)}%)
          </Text>
        </Card>

        {/* Entries list */}
        <Card>
          <SectionHeader title="Vacation entries" />
          {entries.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="airplane-outline" size={40} color={colors.textSecondary} />}
              title="No vacations yet"
              subtitle="Tap + Add to log a vacation period"
            />
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border,
              }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#fff3e0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="airplane-outline" size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>
                    {formatDate(entry.start_date)} → {formatDate(entry.end_date)}
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                    {entry.days_count || '?'} days
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Add form modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text }}>Add Vacation</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Start date', value: startDate, target: 'start' },
                { label: 'End date', value: endDate, target: 'end' },
              ].map(({ label, value, target }) => (
                <TouchableOpacity
                  key={target}
                  onPress={() => openPicker(target)}
                  style={{ flex: 1, backgroundColor: colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: colors.border, padding: 12 }}
                >
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 4 }}>{label}</Text>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>
                    {value.toLocaleDateString('en-GB')}
                  </Text>
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
              <TouchableOpacity onPress={() => setPickerTarget(null)} style={{ alignItems: 'flex-end', marginBottom: 12 }}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: FontSize.sm }}>Done</Text>
              </TouchableOpacity>
            )}

            <Button title="Save Vacation" onPress={handleAdd} loading={saving} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
