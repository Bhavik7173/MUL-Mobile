// src/screens/WorkEntriesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { entriesApi } from '../api/client';
import { Card, SectionHeader, EmptyState, Badge } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatEuro(v) { return `€${(v || 0).toFixed(2)}`; }

export default function WorkEntriesScreen({ navigation }) {
  const { colors } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await entriesApi.getAll(year, month);
      const sorted = (res.data || []).sort((a, b) => b.date.localeCompare(a.date));
      setEntries(sorted);
      setFiltered(sorted);
    } catch (e) {
      console.warn('Entries fetch:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(entries); return; }
    const q = search.toLowerCase();
    setFiltered(entries.filter(e =>
      e.date.includes(q) || (e.notes || '').toLowerCase().includes(q)
    ));
  }, [search, entries]);

  const handleDelete = (id) => {
    Alert.alert('Delete entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await entriesApi.delete(id); fetchEntries(); }
          catch { Alert.alert('Error', 'Failed to delete entry.'); }
        },
      },
    ]);
  };

  const totalNet = filtered.reduce((s, e) => s + (e.net_pay || 0), 0);
  const totalHours = filtered.reduce((s, e) => s + (e.working_hours || 0), 0);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Fixed top bar */}
      <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.md }}>
        {/* Month nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: FontSize.lg, fontWeight: '800', color: colors.text }}>Work Entries</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.card, borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 0.5, borderColor: colors.border }}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginHorizontal: 6 }}>
              {MONTHS[month - 1].slice(0,3)} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: BorderRadius.md, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: 12, marginBottom: 12 }}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by date or notes..."
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, paddingVertical: 10, fontSize: FontSize.sm, color: colors.text }}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Summary row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          {[
            { label: `${filtered.length} entries`, icon: 'list-outline', color: colors.primary },
            { label: `${totalHours.toFixed(1)}h worked`, icon: 'time-outline', color: colors.text },
            { label: formatEuro(totalNet), icon: 'wallet-outline', color: colors.net },
          ].map(({ label, icon, color }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.md, padding: 10, alignItems: 'center', flexDirection: 'row', gap: 6, borderWidth: 0.5, borderColor: colors.border }}>
              <Ionicons name={icon} size={14} color={color} />
              <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEntries(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="document-outline" size={40} color={colors.textSecondary} />}
            title={search ? 'No results found' : 'No entries this month'}
            subtitle={search ? 'Try a different search' : 'Add entries from the Daily Entry tab'}
          />
        ) : (
          filtered.map((entry) => (
            <View key={entry.id} style={{
              backgroundColor: colors.card, borderRadius: BorderRadius.lg, marginBottom: 8,
              borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden',
            }}>
              {/* Top row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="briefcase-outline" size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text }}>{entry.date}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                    {entry.start_time} – {entry.end_time}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: colors.net }}>{formatEuro(entry.net_pay)}</Text>
                  {entry.is_public_holiday && <Badge label="Holiday" variant="warning" />}
                </View>
              </View>

              {/* Details row */}
              <View style={{ flexDirection: 'row', padding: 10, gap: 8 }}>
                {[
                  { label: 'Hours', value: `${(entry.working_hours || 0).toFixed(2)}h` },
                  { label: 'Gross', value: formatEuro(entry.gross_pay) },
                  { label: 'Tax', value: formatEuro(entry.tax) },
                  { label: 'Bonus', value: formatEuro(entry.bonus) },
                ].map(({ label, value }) => (
                  <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>{label}</Text>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: colors.text, marginTop: 2 }}>{value}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => handleDelete(entry.id)}
                  style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.error} />
                </TouchableOpacity>
              </View>

              {entry.notes ? (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, fontStyle: 'italic' }}>
                    📝 {entry.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
