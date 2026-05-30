// src/screens/ClockInScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { entriesApi } from '../api/client';
import { Card, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const CLOCK_KEY = 'mul-clock-state';

function pad(n) { return String(n).padStart(2, '0'); }
function formatTime(date) { return `${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ClockInScreen() {
  const { colors } = useTheme();
  const [clockedIn, setClockedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [breakTime, setBreakTime] = useState(0.5);
  const [isHoliday, setIsHoliday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    // Restore persisted clock state
    AsyncStorage.getItem(CLOCK_KEY).then(raw => {
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.clockedIn && state.startTime) {
        const start = new Date(state.startTime);
        const diff = Math.floor((Date.now() - start.getTime()) / 1000);
        setStartTime(start);
        setElapsed(diff);
        setClockedIn(true);
      }
    });
    loadHistory();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (clockedIn) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [clockedIn]);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem('mul-clock-history');
      if (raw) setHistory(JSON.parse(raw).slice(0, 10));
    } catch {}
  };

  const handleClockIn = async () => {
    const now = new Date();
    setStartTime(now);
    setElapsed(0);
    setClockedIn(true);
    await AsyncStorage.setItem(CLOCK_KEY, JSON.stringify({ clockedIn: true, startTime: now.toISOString() }));
  };

  const handleClockOut = () => {
    Alert.alert(
      'Clock Out',
      `Save ${formatDuration(elapsed)} as a work entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save Entry', onPress: saveEntry },
        { text: 'Discard', style: 'destructive', onPress: discardClock },
      ]
    );
  };

  const saveEntry = async () => {
    setSaving(true);
    const endTime = new Date();
    const date = startTime.toISOString().slice(0, 10);
    try {
      await entriesApi.create({
        date,
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
        break_hours: breakTime,
        travel_allowance: 0,
        meal_allowance: 0,
        is_public_holiday: isHoliday,
        notes: 'Clocked in via mobile app',
      });

      // Save to history
      const entry = {
        date,
        start: formatTime(startTime),
        end: formatTime(endTime),
        duration: formatDuration(elapsed),
        savedAt: new Date().toISOString(),
      };
      const raw = await AsyncStorage.getItem('mul-clock-history');
      const hist = raw ? JSON.parse(raw) : [];
      hist.unshift(entry);
      await AsyncStorage.setItem('mul-clock-history', JSON.stringify(hist.slice(0, 20)));

      Alert.alert('Saved!', `Entry for ${date} saved successfully.`);
      await discardClock();
      loadHistory();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save. Entry will be queued offline.');
    } finally {
      setSaving(false);
    }
  };

  const discardClock = async () => {
    setClockedIn(false);
    setStartTime(null);
    setElapsed(0);
    await AsyncStorage.removeItem(CLOCK_KEY);
  };

  const workedHours = elapsed / 3600;
  const progressPct = Math.min((workedHours / 7.42) * 100, 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Clock In / Out" subtitle="Tap to track your hours" />

        {/* Main clock card */}
        <Card style={{ alignItems: 'center', paddingVertical: 32, marginBottom: Spacing.md }}>
          {/* Clock face */}
          <View style={{
            width: 180, height: 180, borderRadius: 90,
            borderWidth: 6,
            borderColor: clockedIn ? colors.success : colors.border,
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
            backgroundColor: clockedIn ? `${colors.success}10` : colors.background,
          }}>
            {clockedIn ? (
              <>
                <Text style={{ fontSize: 36, fontWeight: '900', color: colors.success, fontVariant: ['tabular-nums'] }}>
                  {formatDuration(elapsed)}
                </Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 4 }}>
                  Since {formatTime(startTime)}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 36, fontWeight: '900', color: colors.textSecondary }}>
                  {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textMuted, marginTop: 4 }}>Ready to clock in</Text>
              </>
            )}
          </View>

          {/* Progress bar */}
          {clockedIn && (
            <View style={{ width: '80%', marginBottom: 20 }}>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${progressPct}%`, backgroundColor: colors.success, borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                {workedHours.toFixed(1)}h of 7.42h standard day
              </Text>
            </View>
          )}

          {/* Clock In/Out button */}
          <TouchableOpacity
            onPress={clockedIn ? handleClockOut : handleClockIn}
            disabled={saving}
            activeOpacity={0.85}
            style={{
              width: 140, height: 52,
              borderRadius: 26,
              backgroundColor: clockedIn ? colors.error : colors.success,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 8,
              shadowColor: clockedIn ? colors.error : colors.success,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
            }}
          >
            <Ionicons name={clockedIn ? 'stop-circle-outline' : 'play-circle-outline'} size={22} color="#fff" />
            <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: '#fff' }}>
              {clockedIn ? 'Clock Out' : 'Clock In'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Options */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Entry options</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
            <View>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: colors.text }}>Public holiday</Text>
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>1.5× rate applied</Text>
            </View>
            <Switch value={isHoliday} onValueChange={setIsHoliday} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: colors.text }}>Break time</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {[0, 0.25, 0.5, 1].map(v => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setBreakTime(v)}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: breakTime === v ? colors.primary : colors.background,
                    borderWidth: 1, borderColor: breakTime === v ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: breakTime === v ? '#fff' : colors.textSecondary }}>
                    {v === 0 ? 'None' : `${v * 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>

        {/* Recent clock history */}
        {history.length > 0 && (
          <Card>
            <SectionHeader title="Recent sessions" />
            {history.map((h, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < history.length - 1 ? 0.5 : 0, borderBottomColor: colors.border }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Ionicons name="time-outline" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{h.date}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{h.start} → {h.end}</Text>
                </View>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.primary }}>{h.duration}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
