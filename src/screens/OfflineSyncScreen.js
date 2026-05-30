// src/screens/OfflineSyncScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineStorage } from '../utils/offlineStorage';
import { entriesApi } from '../api/client';
import { Card, Button, SectionHeader, EmptyState } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

export default function OfflineSyncScreen() {
  const { colors } = useTheme();
  const { isOnline, lastChecked, checkConnectivity } = useNetworkStatus();
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    const q = await offlineStorage.getQueue();
    setQueue(q);
  };

  const handleSync = async () => {
    if (!isOnline) { Alert.alert('Offline', 'No connection to server. Try again later.'); return; }
    setSyncing(true);
    let success = 0, failed = 0;
    for (const item of queue) {
      try {
        if (item.action === 'create_entry') {
          await entriesApi.create(item.data);
          await offlineStorage.dequeue(item.id);
          success++;
        }
      } catch {
        failed++;
      }
    }
    await loadQueue();
    setSyncing(false);
    Alert.alert('Sync complete', `${success} synced, ${failed} failed.`);
  };

  const handleClearQueue = () => {
    Alert.alert('Clear queue', 'Delete all pending offline entries?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => { await offlineStorage.clearQueue(); loadQueue(); },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Offline Sync" subtitle="Manage queued entries" />

        {/* Status card */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: isOnline ? colors.successLight : colors.errorLight,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={isOnline ? 'wifi-outline' : 'cloud-offline-outline'} size={24} color={isOnline ? colors.success : colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: isOnline ? colors.success : colors.error }}>
                {isOnline ? 'Connected' : 'Offline'}
              </Text>
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
              </Text>
            </View>
            <TouchableOpacity onPress={checkConnectivity} style={{ padding: 8 }}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Queue stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: queue.length > 0 ? colors.warning : colors.success }}>{queue.length}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Pending</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>
              {queue.filter(q => q.action === 'create_entry').length}
            </Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Entries</Text>
          </View>
        </View>

        {/* Actions */}
        {queue.length > 0 && (
          <View style={{ gap: 10, marginBottom: Spacing.md }}>
            <Button
              title={syncing ? 'Syncing...' : `Sync ${queue.length} item${queue.length > 1 ? 's' : ''}`}
              onPress={handleSync}
              loading={syncing}
              icon={<Ionicons name="cloud-upload-outline" size={18} color="#fff" />}
            />
            <Button
              title="Clear queue"
              onPress={handleClearQueue}
              variant="secondary"
              icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
              textStyle={{ color: colors.error }}
            />
          </View>
        )}

        {/* Queue list */}
        <Card>
          <SectionHeader title="Pending items" />
          {queue.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />}
              title="All synced"
              subtitle="No pending offline entries"
            />
          ) : (
            queue.map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: colors.warningLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="time-outline" size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>
                    {item.data?.date || 'Unknown date'}
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                    {item.action.replace('_', ' ')} · {new Date(item.timestamp).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
