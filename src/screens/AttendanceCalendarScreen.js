// src/screens/AttendanceCalendarScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { entriesApi } from '../api/client';
import { Card, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

export default function AttendanceCalendarScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entryMap, setEntryMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await entriesApi.getAll(year, month);
      const map = {};
      (res.data || []).forEach(e => { map[e.date] = e; });
      setEntryMap(map);
    } catch {}
    setRefreshing(false);
  }, [year, month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = now.toISOString().slice(0, 10);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getDayStatus = (day) => {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const entry = entryMap[dateStr];
    const dow = new Date(dateStr).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isFuture = dateStr > today;
    if (entry) return entry.is_public_holiday ? 'holiday' : 'worked';
    if (isWeekend) return 'weekend';
    if (isFuture) return 'future';
    return 'missed';
  };

  const statusColors = {
    worked:  { bg: colors.success, text: '#fff', border: colors.success },
    holiday: { bg: colors.warning, text: '#fff', border: colors.warning },
    weekend: { bg: colors.background, text: colors.textMuted, border: colors.border },
    future:  { bg: colors.background, text: colors.textSecondary, border: colors.border },
    missed:  { bg: colors.errorLight, text: colors.error, border: colors.error },
  };

  const workedDays = Object.values(entryMap).length;
  const totalWorkdays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1).getDay();
    return d !== 0 && d !== 6;
  }).filter(Boolean).length;
  const missedDays = Array.from({ length: daysInMonth }, (_, i) => getDayStatus(i + 1) === 'missed').filter(Boolean).length;

  const selectedDate = selectedDay
    ? `${year}-${String(month).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
    : null;
  const selectedEntry = selectedDate ? entryMap[selectedDate] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEntries(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Month nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.text }}>Attendance</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.card, borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 0.5, borderColor: colors.border }}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginHorizontal: 8 }}>
              {MONTHS[month-1]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.md }}>
          {[
            { label: 'Worked', value: workedDays, color: colors.success },
            { label: 'Missed', value: missedDays, color: colors.error },
            { label: 'Workdays', value: totalWorkdays, color: colors.primary },
          ].map(({ label, value, color }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.md, padding: 10, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border }}>
              <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color }}>{value}</Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <Card style={{ marginBottom: Spacing.md }}>
          {/* Day headers */}
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {DAYS.map(d => (
              <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: d === 'Sat' || d === 'Sun' ? colors.textMuted : colors.textSecondary }}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar cells */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }, (_, i) => (
              <View key={`empty-${i}`} style={{ width: `${100/7}%`, aspectRatio: 1 }} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const status = getDayStatus(day);
              const sc = statusColors[status];
              const isSelected = selectedDay === day;
              const isToday = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` === today;
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(selectedDay === day ? null : day)}
                  style={{ width: `${100/7}%`, aspectRatio: 1, padding: 2 }}
                >
                  <View style={{
                    flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: sc.bg,
                    borderWidth: isSelected ? 2 : isToday ? 1.5 : 0.5,
                    borderColor: isSelected ? colors.primary : isToday ? colors.primary : sc.border,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: isToday ? '800' : '500', color: sc.text }}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: colors.border }}>
            {[
              { label: 'Worked', color: colors.success },
              { label: 'Holiday', color: colors.warning },
              { label: 'Missed', color: colors.error },
              { label: 'Weekend', color: colors.border },
            ].map(({ label, color }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>{label}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Selected day detail */}
        {selectedEntry && (
          <Card>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 12 }}>
              {selectedDate} — Entry details
            </Text>
            {[
              { label: 'Hours', value: `${(selectedEntry.working_hours || 0).toFixed(2)}h` },
              { label: 'Start', value: selectedEntry.start_time },
              { label: 'End', value: selectedEntry.end_time },
              { label: 'Net pay', value: `€${(selectedEntry.net_pay || 0).toFixed(2)}` },
              { label: 'Bonus', value: `€${(selectedEntry.bonus || 0).toFixed(2)}` },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{label}</Text>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{value}</Text>
              </View>
            ))}
          </Card>
        )}
        {selectedDay && !selectedEntry && getDayStatus(selectedDay) !== 'weekend' && getDayStatus(selectedDay) !== 'future' && (
          <Card>
            <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, textAlign: 'center' }}>
              No entry recorded for {selectedDate}
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
