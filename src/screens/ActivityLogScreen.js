// src/screens/ActivityLogScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Card, SectionHeader, EmptyState, Button } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const LOG_KEY = 'mul-activity-log';

export const logActivity = async (action, detail = '') => {
  try {
    const raw = await AsyncStorage.getItem(LOG_KEY);
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift({
      id: Date.now().toString(),
      action,
      detail,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch {}
};

const ACTION_ICONS = {
  login: { icon: 'log-in-outline', color: '#10b981' },
  logout: { icon: 'log-out-outline', color: '#6b7280' },
  entry_added: { icon: 'add-circle-outline', color: '#3b82f6' },
  entry_deleted: { icon: 'trash-outline', color: '#ef4444' },
  payslip_viewed: { icon: 'document-text-outline', color: '#8b5cf6' },
  settings_saved: { icon: 'settings-outline', color: '#f59e0b' },
  clock_in: { icon: 'timer-outline', color: '#10b981' },
  clock_out: { icon: 'stop-circle-outline', color: '#f59e0b' },
  vacation_added: { icon: 'airplane-outline', color: '#f59e0b' },
  sync_completed: { icon: 'cloud-done-outline', color: '#10b981' },
  default: { icon: 'ellipsis-horizontal-outline', color: '#6b7280' },
};

export default function ActivityLogScreen() {
  const { colors } = useTheme();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const raw = await AsyncStorage.getItem(LOG_KEY);
      setLogs(raw ? JSON.parse(raw) : []);
    } catch {}
  };

  const clearLogs = () => {
    Alert.alert('Clear log', 'Delete all activity history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(LOG_KEY); setLogs([]); } },
    ]);
  };

  const categories = ['All', 'login', 'entry_added', 'clock_in', 'payslip_viewed'];
  const filtered = filter === 'All' ? logs : logs.filter(l => l.action === filter);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  // Group by date
  const grouped = filtered.reduce((acc, log) => {
    const date = log.timestamp.slice(0, 10);
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Activity Log"
          subtitle={`${logs.length} events recorded`}
          action={
            logs.length > 0 ? (
              <TouchableOpacity onPress={clearLogs}>
                <Text style={{ fontSize: FontSize.sm, color: colors.error, fontWeight: '600' }}>Clear</Text>
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          {[
            { label: 'Total events', value: logs.length, color: colors.primary },
            { label: 'Logins', value: logs.filter(l => l.action === 'login').length, color: colors.success },
            { label: 'Entries added', value: logs.filter(l => l.action === 'entry_added').length, color: colors.info },
          ].map(({ label, value, color }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.md, padding: 10, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {categories.map(c => (
              <TouchableOpacity key={c} onPress={() => setFilter(c)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: filter === c ? colors.primary : colors.card, borderWidth: 0.5, borderColor: filter === c ? colors.primary : colors.border }}>
                <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: filter === c ? '#fff' : colors.textSecondary }}>
                  {c.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Log list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="time-outline" size={36} color={colors.textSecondary} />}
            title="No activity yet"
            subtitle="Your actions will appear here"
          />
        ) : (
          Object.entries(grouped).map(([date, dayLogs]) => (
            <View key={date} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}
              </Text>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {dayLogs.map((log, i) => {
                  const ai = ACTION_ICONS[log.action] || ACTION_ICONS.default;
                  return (
                    <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: i < dayLogs.length - 1 ? 0.5 : 0, borderBottomColor: colors.border }}>
                      <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: `${ai.color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name={ai.icon} size={16} color={ai.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </Text>
                        {log.detail ? <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{log.detail}</Text> : null}
                      </View>
                      <Text style={{ fontSize: 10, color: colors.textMuted }}>
                        {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                })}
              </Card>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
