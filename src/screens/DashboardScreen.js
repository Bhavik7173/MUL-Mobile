// src/screens/DashboardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { summaryApi, entriesApi } from '../api/client';
import { Card, StatCard, SectionHeader, EmptyState, Badge } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const W = Dimensions.get('window').width - Spacing.md * 4;

function formatEuro(val) { return `€${(val || 0).toFixed(2)}`; }
function formatHours(val) { return `${(val || 0).toFixed(1)}h`; }

// Simple inline bar chart using react-native-svg
function SimpleBarChart({ data, color }) {
  if (!data || data.length === 0) return null;
  const H = 120;
  const barW = Math.floor((W - 40) / data.length) - 4;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <Svg width={W} height={H + 24}>
      {data.map((d, i) => {
        const barH = Math.max(4, (d.value / maxVal) * H);
        const x = 20 + i * (barW + 4);
        const y = H - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={color} opacity={0.85} />
            <SvgText x={x + barW / 2} y={H + 16} fontSize={9} fill="#888" textAnchor="middle">
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, entRes] = await Promise.all([
        summaryApi.get(year, month),
        entriesApi.getAll(year, month),
      ]);
      setSummary(sumRes.data);
      const entries = (entRes.data || []).sort((a, b) => b.date.localeCompare(a.date));
      setRecentEntries(entries.slice(0, 5));
    } catch (e) {
      console.warn('Dashboard fetch:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const totalHours = summary?.total_worked_hours || 0;
  const netPay = summary?.final_payout ?? summary?.net_pay ?? 0;
  const grossPay = summary?.gross_pay || 0;
  const taxAmount = summary?.total_tax || 0;
  const contractHours = 151.67;
  const hoursProgress = Math.min((totalHours / contractHours) * 100, 100);

  const chartData = recentEntries.length > 0
    ? [...recentEntries].reverse().map(e => ({ label: e.date.slice(8), value: e.net_pay || 0 }))
    : [];

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg }}>
          <View>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
              {now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'}
            </Text>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.text }}>
              {user?.name?.split(' ')[0] || 'Employee'}
            </Text>
          </View>
          {/* Month navigator */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: colors.card, borderRadius: BorderRadius.md,
            paddingHorizontal: 10, paddingVertical: 7,
            borderWidth: 0.5, borderColor: colors.border,
          }}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={{ fontSize: FontSize.sm, color: colors.text, fontWeight: '600', marginHorizontal: 6 }}>
              {MONTHS[month - 1]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Row 1 */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <StatCard
            label="Net Pay"
            value={formatEuro(netPay)}
            subtitle={`Gross: ${formatEuro(grossPay)}`}
            color={colors.net}
            icon={<Ionicons name="wallet-outline" size={16} color={colors.net} />}
          />
          <StatCard
            label="Hours Worked"
            value={formatHours(totalHours)}
            subtitle={`of ${contractHours}h`}
            color={hoursProgress >= 100 ? colors.success : colors.primary}
            icon={<Ionicons name="time-outline" size={16} color={colors.primary} />}
          />
        </View>

        {/* KPI Row 2 */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          <StatCard
            label="Tax Deducted"
            value={formatEuro(taxAmount)}
            subtitle="27.64% rate"
            color={colors.error}
            icon={<Ionicons name="receipt-outline" size={16} color={colors.error} />}
          />
          <StatCard
            label="Bonus"
            value={formatEuro(summary?.total_bonus || 0)}
            subtitle="6h+ days"
            color={colors.bonus}
            icon={<Ionicons name="star-outline" size={16} color={colors.bonus} />}
          />
        </View>

        {/* Progress bar */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Contract hours</Text>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.primary }}>{hoursProgress.toFixed(0)}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{
              height: '100%', width: `${hoursProgress}%`,
              backgroundColor: hoursProgress >= 100 ? colors.success : colors.primary,
              borderRadius: 4,
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{formatHours(totalHours)} worked</Text>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{contractHours}h target</Text>
          </View>
        </Card>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card style={{ marginBottom: Spacing.md }}>
            <SectionHeader title="Daily net pay" subtitle={FULL_MONTHS[month - 1]} />
            <SimpleBarChart data={chartData} color={colors.primary} />
          </Card>
        )}

        {/* Recent entries */}
        <Card>
          <SectionHeader
            title="Recent entries"
            action={
              <TouchableOpacity onPress={() => navigation.navigate('Daily Entry')}>
                <Text style={{ fontSize: FontSize.sm, color: colors.primary, fontWeight: '600' }}>+ Add</Text>
              </TouchableOpacity>
            }
          />
          {recentEntries.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="calendar-outline" size={40} color={colors.textSecondary} />}
              title="No entries yet"
              subtitle={`Add your first entry for ${FULL_MONTHS[month - 1]}`}
            />
          ) : (
            recentEntries.map((entry) => (
              <View key={entry.id} style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: 0.5, borderBottomColor: colors.border,
              }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{entry.date}</Text>
                  <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>
                    {entry.start_time} – {entry.end_time} · {(entry.working_hours || 0).toFixed(1)}h
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.net }}>
                    {formatEuro(entry.net_pay)}
                  </Text>
                  {entry.is_public_holiday && <Badge label="Holiday" variant="warning" style={{ marginTop: 3 }} />}
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
