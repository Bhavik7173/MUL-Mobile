// src/screens/PayslipScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Alert, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { emailApi } from '../api/client';
import { Button, Card, SectionHeader, Input } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';
import { ENV } from '../config/env';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function PayslipScreen() {
  const { colors } = useTheme();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [email, setEmail] = useState('');
  const [emailing, setEmailing] = useState(false);

  const selectedMonth = parseInt(month) || now.getMonth() + 1;
  const selectedYear  = parseInt(year)  || now.getFullYear();

  const monthPad = String(selectedMonth).padStart(2, '0');

  // Direct URLs to the FastAPI backend
  const pdfUrl   = `${ENV.BACKEND_URL}/api/payslip/${selectedYear}/${selectedMonth}/pdf`;
  const excelUrl = `${ENV.BACKEND_URL}/api/export/${selectedYear}/${selectedMonth}/excel`;
  const annualUrl = `${ENV.BACKEND_URL}/api/export/${selectedYear}/annual-pdf`;

  const openInBrowser = async (url, label) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Cannot open',
          `Please open this URL manually in your browser:\n\n${url}`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      Alert.alert('Error', `Failed to open ${label}.\n\nMake sure your backend is running at:\n${ENV.BACKEND_URL}`);
    }
  };

  const handleSendEmail = async () => {
    if (!email) { Alert.alert('Missing email', 'Please enter an email address.'); return; }
    setEmailing(true);
    try {
      await emailApi.send({ to_email: email, year: selectedYear, month: selectedMonth });
      Alert.alert('Sent!', `Payslip emailed to ${email}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to send email. Check SMTP settings in the Settings screen.');
    } finally {
      setEmailing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Payslip" subtitle="Download or email your payslip" />

        {/* Period Selection */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            Select period
          </Text>

          {/* Month picker */}
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 8 }}>Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setMonth(String(i + 1))}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8,
                    borderRadius: BorderRadius.md,
                    backgroundColor: selectedMonth === i + 1 ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: selectedMonth === i + 1 ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: FontSize.xs, fontWeight: '600',
                    color: selectedMonth === i + 1 ? '#fff' : colors.textSecondary,
                  }}>
                    {m.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input
            label="Year"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            placeholder={String(now.getFullYear())}
          />

          {/* Selected period pill */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.primaryLight, borderRadius: BorderRadius.md, padding: 12,
          }}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.primary }}>
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </Text>
          </View>
        </Card>

        {/* Download — opens in browser */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, flex: 1 }}>
              Files open in your browser — save from there using the share/download button.
            </Text>
          </View>
          <View style={{ height: 0.5, backgroundColor: colors.border, marginVertical: 12 }} />

          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 14 }}>
            Download
          </Text>
          <View style={{ gap: 10 }}>
            <Button
              title="Download PDF Payslip"
              onPress={() => openInBrowser(pdfUrl, 'PDF payslip')}
              icon={<Ionicons name="document-text-outline" size={18} color="#fff" />}
            />
            <Button
              title="Download Excel Report"
              onPress={() => openInBrowser(excelUrl, 'Excel report')}
              variant="secondary"
              icon={<Ionicons name="grid-outline" size={18} color={colors.primary} />}
            />
            <Button
              title="Annual PDF Report"
              onPress={() => openInBrowser(annualUrl, 'Annual PDF')}
              variant="secondary"
              icon={<Ionicons name="document-outline" size={18} color={colors.primary} />}
            />
          </View>
        </Card>

        {/* Direct URL copy */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
            Direct links
          </Text>
          {[
            { label: 'PDF', url: pdfUrl },
            { label: 'Excel', url: excelUrl },
          ].map(({ label, url }) => (
            <TouchableOpacity
              key={label}
              onPress={() => openInBrowser(url, label)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.background, borderRadius: BorderRadius.md,
                borderWidth: 0.5, borderColor: colors.border,
                padding: 10, marginBottom: 8, gap: 8,
              }}
            >
              <Ionicons name="link-outline" size={14} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>{url}</Text>
              <Ionicons name="open-outline" size={14} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Email */}
        <Card>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            Send by email
          </Text>
          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
          />
          <Button
            title="Send Payslip by Email"
            onPress={handleSendEmail}
            loading={emailing}
            variant="secondary"
            icon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
