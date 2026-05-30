// src/screens/IncomeProjectionScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Line, G, Text as SvgText, Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { summaryApi } from '../api/client';
import { Card, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const W = Dimensions.get('window').width - Spacing.md * 4;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(v) { return `€${(v || 0).toFixed(0)}`; }
function fmtK(v) { return `€${((v || 0) / 1000).toFixed(1)}k`; }

export default function IncomeProjectionScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const year = now.getFullYear();
  const [actuals, setActuals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActuals = useCallback(async () => {
    const results = [];
    for (let m = 1; m <= currentMonth; m++) {
      try {
        const res = await summaryApi.get(year, m);
        results.push({ month: m, value: res.data?.final_payout || res.data?.net_pay || 0 });
      } catch {
        results.push({ month: m, value: 0 });
      }
    }
    setActuals(results);
    setLoading(false);
  }, [year, currentMonth]);

  useEffect(() => { fetchActuals(); }, [fetchActuals]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading your data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const actualTotal = actuals.reduce((s, a) => s + a.value, 0);
  const monthsWithData = actuals.filter(a => a.value > 0).length || 1;
  const avgMonthly = actualTotal / monthsWithData;
  const remainingMonths = 12 - currentMonth;
  const projectedRemaining = avgMonthly * remainingMonths;
  const projectedTotal = actualTotal + projectedRemaining;
  const paceVsTarget = (projectedTotal / (avgMonthly * 12)) * 100;

  // Build full year data (actuals + projections)
  const fullYear = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const actual = actuals.find(a => a.month === m);
    return {
      month: m,
      label: MONTHS[i],
      value: actual ? actual.value : (m > currentMonth ? avgMonthly : 0),
      isProjected: m > currentMonth,
      isCurrent: m === currentMonth,
    };
  });

  const maxVal = Math.max(...fullYear.map(d => d.value), 1);
  const barW = Math.floor((W - 30) / 12) - 3;

  const pathPoints = fullYear.filter(d => d.value > 0).map((d, i) => {
    const x = 15 + (d.month - 1) * (barW + 3) + barW / 2;
    const y = 130 - Math.max(3, (d.value / maxVal) * 120);
    return { x, y };
  });
  const linePath = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Income Projection" subtitle={`${year} forecast`} />

        {/* KPI cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Earned so far</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.net, marginTop: 4 }}>{fmtK(actualTotal)}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{currentMonth} months</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Projected total</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.primary, marginTop: 4 }}>{fmtK(projectedTotal)}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>full year</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Monthly average</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.text, marginTop: 4 }}>{fmt(avgMonthly)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 0.5, borderColor: colors.border }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Remaining months</Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.warning, marginTop: 4 }}>{remainingMonths}</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{fmt(projectedRemaining)} expected</Text>
          </View>
        </View>

        {/* Chart */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 8 }}>Actual vs projected</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.net }} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Actual</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.primary, opacity: 0.4 }} />
              <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Projected</Text>
            </View>
          </View>
          <Svg width={W} height={160}>
            {fullYear.map((d, i) => {
              const barH = Math.max(2, (d.value / maxVal) * 120);
              const x = 15 + i * (barW + 3);
              const y = 130 - barH;
              return (
                <G key={i}>
                  <Rect x={x} y={y} width={barW} height={barH} rx={3}
                    fill={d.isProjected ? colors.primary : colors.net}
                    opacity={d.isProjected ? 0.45 : d.isCurrent ? 1 : 0.8}
                  />
                  <SvgText x={x + barW / 2} y={148} fontSize={8} fill="#888" textAnchor="middle">{d.label}</SvgText>
                </G>
              );
            })}
            {linePath && <Path d={linePath} stroke={colors.primary} strokeWidth={1.5} fill="none" strokeDasharray={`${currentMonth > 0 ? '' : '4 4'}`} />}
          </Svg>
        </Card>

        {/* Pace indicator */}
        <Card>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Year-end pace</Text>
          <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
            <View style={{ height: '100%', width: `${Math.min(paceVsTarget, 100)}%`, backgroundColor: paceVsTarget >= 100 ? colors.success : colors.primary, borderRadius: 5 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>On track: {paceVsTarget.toFixed(0)}%</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Target: {fmtK(avgMonthly * 12)}/yr</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
