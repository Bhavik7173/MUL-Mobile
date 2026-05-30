// src/screens/TaxSimulatorScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, G, Text as SvgText, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';
import { Dimensions } from 'react-native';

const W = Dimensions.get('window').width - Spacing.md * 4;

function fmt(v) { return `€${(v || 0).toFixed(2)}`; }
function fmtK(v) { return `€${((v || 0) / 1000).toFixed(1)}k`; }

export default function TaxSimulatorScreen() {
  const { colors } = useTheme();
  const [hourlyRate, setHourlyRate] = useState('14.96');
  const [taxRate, setTaxRate] = useState('27.64');
  const [hoursPerMonth, setHoursPerMonth] = useState('151.67');
  const [bonusDays, setBonusDays] = useState('20');

  const rate = parseFloat(hourlyRate) || 14.96;
  const tax = parseFloat(taxRate) / 100 || 0.2764;
  const hours = parseFloat(hoursPerMonth) || 151.67;
  const bonus = parseFloat(bonusDays) || 20;

  const grossMonthly = rate * hours + bonus * 6;
  const taxMonthly = grossMonthly * tax;
  const netMonthly = grossMonthly - taxMonthly;
  const grossYearly = grossMonthly * 12;
  const taxYearly = taxMonthly * 12;
  const netYearly = netMonthly * 12;

  // Scenarios for comparison
  const scenarios = [
    { label: 'Current', rate: tax, net: netMonthly },
    { label: '-5%', rate: Math.max(0, tax - 0.05), net: grossMonthly * (1 - Math.max(0, tax - 0.05)) },
    { label: '+5%', rate: tax + 0.05, net: grossMonthly * (1 - (tax + 0.05)) },
    { label: '+10%', rate: tax + 0.10, net: grossMonthly * (1 - (tax + 0.10)) },
  ];

  const maxNet = Math.max(...scenarios.map(s => s.net));
  const barW = Math.floor((W - 40) / scenarios.length) - 8;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Tax Simulator" subtitle="See how changes affect your pay" />

        {/* Inputs */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Parameters</Text>
          {[
            { label: 'Hourly rate (€)', value: hourlyRate, set: setHourlyRate },
            { label: 'Tax rate (%)', value: taxRate, set: setTaxRate },
            { label: 'Hours / month', value: hoursPerMonth, set: setHoursPerMonth },
            { label: 'Bonus days / month', value: bonusDays, set: setBonusDays },
          ].map(({ label, value, set }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={set}
                keyboardType="decimal-pad"
                style={{
                  fontSize: FontSize.md, fontWeight: '700', color: colors.primary,
                  textAlign: 'right', minWidth: 80,
                  borderBottomWidth: 1, borderBottomColor: colors.primary,
                  paddingBottom: 2,
                }}
              />
            </View>
          ))}
        </Card>

        {/* Monthly breakdown */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Monthly breakdown</Text>
          {[
            { label: 'Gross pay', value: grossMonthly, color: colors.primary, icon: 'wallet-outline' },
            { label: 'Tax deducted', value: -taxMonthly, color: colors.error, icon: 'receipt-outline' },
            { label: 'Net pay', value: netMonthly, color: colors.success, icon: 'cash-outline', big: true },
          ].map(({ label, value, color, icon, big }) => (
            <View key={label} style={{
              flexDirection: 'row', alignItems: 'center', paddingVertical: big ? 14 : 10,
              borderTopWidth: big ? 1 : 0.5, borderTopColor: big ? colors.border : colors.border,
              marginTop: big ? 4 : 0,
            }}>
              <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name={icon} size={16} color={color} />
              </View>
              <Text style={{ flex: 1, fontSize: big ? FontSize.md : FontSize.sm, fontWeight: big ? '700' : '500', color: colors.text }}>{label}</Text>
              <Text style={{ fontSize: big ? FontSize.xl : FontSize.md, fontWeight: '800', color }}>
                {value < 0 ? `-${fmt(-value)}` : fmt(value)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Yearly totals */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: Spacing.md }}>
          {[
            { label: 'Yearly gross', value: grossYearly, color: colors.primary },
            { label: 'Yearly tax', value: taxYearly, color: colors.error },
            { label: 'Yearly net', value: netYearly, color: colors.success },
          ].map(({ label, value, color }) => (
            <View key={label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '800', color }}>{fmtK(value)}</Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 3, textAlign: 'center' }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Tax rate comparison chart */}
        <Card>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 14 }}>Net pay by tax rate</Text>
          <Svg width={W} height={160}>
            {scenarios.map((s, i) => {
              const barH = Math.max(4, (s.net / maxNet) * 120);
              const x = 20 + i * (barW + 8);
              const y = 120 - barH;
              const isCurrent = i === 0;
              return (
                <G key={i}>
                  <Rect x={x} y={y} width={barW} height={barH} rx={4}
                    fill={isCurrent ? colors.primary : s.net > netMonthly ? colors.success : colors.error}
                    opacity={isCurrent ? 1 : 0.7}
                  />
                  <SvgText x={x + barW / 2} y={136} fontSize={9} fill="#888" textAnchor="middle">{s.label}</SvgText>
                  <SvgText x={x + barW / 2} y={y - 4} fontSize={9} fill={colors.text} textAnchor="middle">
                    {fmt(s.net)}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
