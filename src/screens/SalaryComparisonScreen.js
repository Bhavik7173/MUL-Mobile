// src/screens/SalaryComparisonScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { summaryApi } from '../api/client';
import { Card, SectionHeader, Button } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const W = Dimensions.get('window').width - Spacing.md * 4;

function fmt(v) { return `€${(v || 0).toFixed(2)}`; }
function diff(a, b) {
  const d = a - b;
  const pct = b > 0 ? ((d / b) * 100).toFixed(1) : '—';
  return { d, pct, positive: d >= 0 };
}

export default function SalaryComparisonScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [monthA, setMonthA] = useState(now.getMonth() + 1);
  const [yearA, setYearA] = useState(now.getFullYear());
  const [monthB, setMonthB] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [yearB, setYearB] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [compared, setCompared] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        summaryApi.get(yearA, monthA),
        summaryApi.get(yearB, monthB),
      ]);
      setDataA(resA.data);
      setDataB(resB.data);
      setCompared(true);
    } catch (e) {
      console.warn('Comparison error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const MonthSelector = ({ label, month, year, setMonth, setYear, color }) => (
    <View style={{ flex: 1, backgroundColor: `${color}10`, borderRadius: BorderRadius.lg, padding: 12, borderWidth: 1, borderColor: color }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color, marginBottom: 10 }}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {MONTHS.map((m, i) => (
            <TouchableOpacity key={i} onPress={() => setMonth(i + 1)}
              style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, backgroundColor: month === i + 1 ? color : colors.background, borderWidth: 1, borderColor: month === i + 1 ? color : colors.border }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: month === i + 1 ? '#fff' : colors.textSecondary }}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[now.getFullYear() - 1, now.getFullYear()].map(y => (
          <TouchableOpacity key={y} onPress={() => setYear(y)}
            style={{ flex: 1, paddingVertical: 5, borderRadius: 6, backgroundColor: year === y ? color : colors.background, borderWidth: 1, borderColor: year === y ? color : colors.border, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: year === y ? '#fff' : colors.textSecondary }}>{y}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const metrics = dataA && dataB ? [
    { label: 'Net pay', a: dataA.final_payout || dataA.net_pay || 0, b: dataB.final_payout || dataB.net_pay || 0 },
    { label: 'Gross pay', a: dataA.gross_pay || 0, b: dataB.gross_pay || 0 },
    { label: 'Tax paid', a: dataA.total_tax || 0, b: dataB.total_tax || 0 },
    { label: 'Bonus', a: dataA.total_bonus || 0, b: dataB.total_bonus || 0 },
    { label: 'Hours worked', a: dataA.total_worked_hours || 0, b: dataB.total_worked_hours || 0, isHours: true },
  ] : [];

  const maxBar = metrics.length > 0 ? Math.max(...metrics.flatMap(m => [m.a, m.b]), 1) : 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Salary Comparison" subtitle="Compare any two months" />

        {/* Selectors */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          <MonthSelector label="Month A" month={monthA} year={yearA} setMonth={setMonthA} setYear={setYearA} color={colors.primary} />
          <MonthSelector label="Month B" month={monthB} year={yearB} setMonth={setMonthB} setYear={setYearB} color={colors.success} />
        </View>

        <Button title="Compare" onPress={handleCompare} loading={loading} icon={<Ionicons name="git-compare-outline" size={18} color="#fff" />} style={{ marginBottom: Spacing.md }} />

        {compared && dataA && dataB && (
          <>
            {/* Labels */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              {[
                { label: `${FULL_MONTHS[monthA - 1]} ${yearA}`, color: colors.primary },
                { label: `${FULL_MONTHS[monthB - 1]} ${yearB}`, color: colors.success },
              ].map(({ label, color }) => (
                <View key={label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: BorderRadius.md, padding: 10, borderWidth: 0.5, borderColor: colors.border }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
                  <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: colors.text }} numberOfLines={1}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Metrics */}
            {metrics.map(({ label, a, b, isHours }) => {
              const d = diff(a, b);
              return (
                <Card key={label} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name={d.positive ? 'trending-up-outline' : 'trending-down-outline'} size={14} color={d.positive ? colors.success : colors.error} />
                      <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: d.positive ? colors.success : colors.error }}>
                        {d.positive ? '+' : ''}{isHours ? `${d.d.toFixed(1)}h` : fmt(d.d)} ({d.pct}%)
                      </Text>
                    </View>
                  </View>
                  <View style={{ gap: 6 }}>
                    {[{ val: a, color: colors.primary }, { val: b, color: colors.success }].map(({ val, color }, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: Math.max(4, (val / maxBar) * (W - 100)), height: 8, backgroundColor: color, borderRadius: 4 }} />
                        <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color }}>{isHours ? `${val.toFixed(1)}h` : fmt(val)}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {compared && (!dataA || !dataB) && (
          <Card>
            <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: FontSize.sm }}>
              No data found for one or both months. Make sure entries exist.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
