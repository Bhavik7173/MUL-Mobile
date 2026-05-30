// src/screens/OvertimeCalculatorScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { entriesApi, settingsApi } from '../api/client';
import { Card, SectionHeader, Badge } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const W = Dimensions.get('window').width - Spacing.md * 4;
const STANDARD_DAY = 7.42;
const STANDARD_WEEK = 37.1;
const OT_RATE_1 = 1.25; // up to 2h over
const OT_RATE_2 = 1.50; // beyond 2h over

function fmt(v) { return `€${(v || 0).toFixed(2)}`; }

export default function OvertimeCalculatorScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState({ hourly_rate: 14.96 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [entRes, setRes] = await Promise.all([
        entriesApi.getAll(year, month),
        settingsApi.get(),
      ]);
      setEntries(entRes.data || []);
      setSettings(setRes.data || { hourly_rate: 14.96 });
    } catch {}
    setRefreshing(false);
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const rate = settings.hourly_rate || 14.96;

  // Calculate overtime per entry
  const analyzed = entries.map(e => {
    const worked = e.working_hours || 0;
    const overtime = Math.max(0, worked - STANDARD_DAY);
    const ot1 = Math.min(overtime, 2);
    const ot2 = Math.max(0, overtime - 2);
    const otPay = ot1 * rate * OT_RATE_1 + ot2 * rate * OT_RATE_2;
    return { ...e, worked, overtime, ot1, ot2, otPay };
  });

  const totalOT = analyzed.reduce((s, e) => s + e.overtime, 0);
  const totalOTPay = analyzed.reduce((s, e) => s + e.otPay, 0);
  const overtimeDays = analyzed.filter(e => e.overtime > 0).length;

  // Weekly breakdown
  const weeks = [];
  let week = { entries: [], totalHours: 0, weekNum: 1 };
  analyzed.forEach((e, i) => {
    week.entries.push(e);
    week.totalHours += e.worked;
    const dayOfWeek = new Date(e.date).getDay();
    if (dayOfWeek === 0 || i === analyzed.length - 1) {
      weeks.push({ ...week });
      week = { entries: [], totalHours: 0, weekNum: weeks.length + 2 };
    }
  });

  const chartData = analyzed.filter(e => e.overtime > 0).slice(0, 7).map(e => ({
    label: e.date.slice(8),
    value: e.overtime,
  }));
  const maxOT = Math.max(...chartData.map(d => d.value), 1);
  const barW = chartData.length > 0 ? Math.floor((W - 30) / chartData.length) - 4 : 40;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Overtime Calculator" subtitle={`${now.toLocaleString('default', { month: 'long' })} ${year}`} />

        {/* KPI cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.warning }}>{totalOT.toFixed(1)}h</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>Total overtime</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.success }}>{fmt(totalOTPay)}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>OT earnings</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary }}>{overtimeDays}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>OT days</Text>
          </View>
        </View>

        {/* Rate info */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Overtime rates</Text>
          {[
            { label: 'Standard (≤7.42h/day)', rate: `${fmt(rate)}/h`, color: colors.primary },
            { label: 'OT tier 1 (up to +2h)', rate: `${fmt(rate * OT_RATE_1)}/h (×1.25)`, color: colors.warning },
            { label: 'OT tier 2 (beyond +2h)', rate: `${fmt(rate * OT_RATE_2)}/h (×1.50)`, color: colors.error },
          ].map(({ label, rate: r, color }) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{label}</Text>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color }}>{r}</Text>
            </View>
          ))}
        </Card>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Overtime hours by day</Text>
            <Svg width={W} height={130}>
              {chartData.map((d, i) => {
                const barH = Math.max(4, (d.value / maxOT) * 100);
                const x = 15 + i * (barW + 4);
                const y = 100 - barH;
                return (
                  <G key={i}>
                    <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={colors.warning} />
                    <SvgText x={x + barW / 2} y={118} fontSize={9} fill="#888" textAnchor="middle">{d.label}</SvgText>
                    <SvgText x={x + barW / 2} y={y - 3} fontSize={9} fill={colors.text} textAnchor="middle">{d.value.toFixed(1)}</SvgText>
                  </G>
                );
              })}
            </Svg>
          </Card>
        )}

        {/* Day by day */}
        <Card>
          <SectionHeader title="Daily overtime breakdown" />
          {analyzed.filter(e => e.overtime > 0).length === 0 ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Ionicons name="checkmark-circle-outline" size={36} color={colors.success} />
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginTop: 8 }}>No overtime this month</Text>
            </View>
          ) : (
            analyzed.filter(e => e.overtime > 0).map(e => (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{e.date}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{e.worked.toFixed(2)}h worked · +{e.overtime.toFixed(2)}h OT</Text>
                </View>
                <Badge label={fmt(e.otPay)} variant="warning" />
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
