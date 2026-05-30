// src/screens/AnalyticsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, Line, Circle, Path, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { summaryApi } from '../api/client';
import { Card, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const W = Dimensions.get('window').width - Spacing.md * 4;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function BarChart({ data, color, yLabel }) {
  if (!data || data.length === 0) return null;
  const H = 140;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor((W - 30) / data.length) - 4;
  return (
    <Svg width={W} height={H + 30}>
      {data.map((d, i) => {
        const barH = Math.max(3, (d.value / maxVal) * H);
        const x = 15 + i * (barW + 4);
        const y = H - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={d.current ? 1 : 0.55} />
            <SvgText x={x + barW / 2} y={H + 18} fontSize={9} fill="#888" textAnchor="middle">{d.label}</SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function LineChart({ data, color }) {
  if (!data || data.length < 2) return null;
  const H = 120;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const stepX = (W - 30) / (data.length - 1);
  const points = data.map((d, i) => ({
    x: 15 + i * stepX,
    y: H - Math.max(4, (d.value / maxVal) * H),
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <Svg width={W} height={H + 30}>
      <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={4} fill={color} />
          <SvgText x={p.x} y={H + 18} fontSize={9} fill="#888" textAnchor="middle">{data[i].label}</SvgText>
        </G>
      ))}
    </Svg>
  );
}

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('earnings');

  const fetchData = useCallback(async () => {
    const results = [];
    await Promise.all(
      Array.from({ length: 12 }, (_, i) => i + 1).map(async (m) => {
        try {
          const res = await summaryApi.get(year, m);
          results.push({ month: m, ...res.data });
        } catch {
          results.push({ month: m, final_payout: 0, net_pay: 0, total_worked_hours: 0, total_bonus: 0, total_tax: 0 });
        }
      })
    );
    results.sort((a, b) => a.month - b.month);
    setMonthlyData(results);
    setLoading(false);
    setRefreshing(false);
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (v) => `€${(v || 0).toFixed(0)}`;
  const currentMonth = now.getMonth() + 1;

  const earningsData = monthlyData.map(d => ({
    label: MONTHS[d.month - 1],
    value: d.final_payout || d.net_pay || 0,
    current: d.month === currentMonth && year === now.getFullYear(),
  }));

  const hoursData = monthlyData.map(d => ({
    label: MONTHS[d.month - 1],
    value: d.total_worked_hours || 0,
    current: d.month === currentMonth && year === now.getFullYear(),
  }));

  const taxData = monthlyData.map(d => ({
    label: MONTHS[d.month - 1],
    value: d.total_tax || 0,
    current: d.month === currentMonth && year === now.getFullYear(),
  }));

  const totalNet = monthlyData.reduce((s, d) => s + (d.final_payout || d.net_pay || 0), 0);
  const totalHours = monthlyData.reduce((s, d) => s + (d.total_worked_hours || 0), 0);
  const totalBonus = monthlyData.reduce((s, d) => s + (d.total_bonus || 0), 0);
  const totalTax = monthlyData.reduce((s, d) => s + (d.total_tax || 0), 0);
  const avgNet = totalNet / (monthlyData.filter(d => (d.final_payout || d.net_pay) > 0).length || 1);

  const tabs = [
    { key: 'earnings', label: 'Earnings', icon: 'wallet-outline' },
    { key: 'hours', label: 'Hours', icon: 'time-outline' },
    { key: 'tax', label: 'Tax', icon: 'receipt-outline' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontSize: FontSize.sm }}>
            Loading 12 months of data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with year nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.text }}>Analytics</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.card, borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 0.5, borderColor: colors.border }}>
            <TouchableOpacity onPress={() => setYear(y => y - 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginHorizontal: 8 }}>{year}</Text>
            <TouchableOpacity onPress={() => setYear(y => y + 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Yearly KPIs */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Total net</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.net, marginTop: 4 }}>{fmt(totalNet)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Avg/month</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.primary, marginTop: 4 }}>{fmt(avgNet)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Total hours</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.text, marginTop: 4 }}>{totalHours.toFixed(0)}h</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Total bonus</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.bonus, marginTop: 4 }}>{fmt(totalBonus)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Total tax</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.error, marginTop: 4 }}>{fmt(totalTax)}</Text>
          </View>
        </View>

        {/* Chart tabs */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
                  paddingVertical: 8, borderRadius: BorderRadius.md,
                  backgroundColor: activeTab === tab.key ? colors.primary : colors.background,
                  borderWidth: 1, borderColor: activeTab === tab.key ? colors.primary : colors.border,
                }}
              >
                <Ionicons name={tab.icon} size={13} color={activeTab === tab.key ? '#fff' : colors.textSecondary} />
                <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: activeTab === tab.key ? '#fff' : colors.textSecondary }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'earnings' && (
            <>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Monthly net pay</Text>
              <BarChart data={earningsData} color={colors.net} />
            </>
          )}
          {activeTab === 'hours' && (
            <>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Hours worked per month</Text>
              <BarChart data={hoursData} color={colors.primary} />
            </>
          )}
          {activeTab === 'tax' && (
            <>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Tax paid per month</Text>
              <BarChart data={taxData} color={colors.error} />
            </>
          )}
        </Card>

        {/* Trend line */}
        <Card>
          <SectionHeader title="Earnings trend" subtitle="Net pay over the year" />
          <LineChart data={earningsData} color={colors.primary} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
