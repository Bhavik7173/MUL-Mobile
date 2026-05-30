// src/screens/DailyEntryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { entriesApi, settingsApi } from '../api/client';
import { Button, Input, Card, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

function formatEuro(val) { return `€${(val || 0).toFixed(2)}`; }
function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function timeToDecimal(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}
function parseTimeToDate(hhmm) {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export default function DailyEntryScreen() {
  const { colors } = useTheme();
  const today = new Date().toISOString().slice(0, 10);

  const [settings, setSettings] = useState({ hourly_rate: 14.96, tax_rate: 0.2764 });
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakHours, setBreakHours] = useState('0.5');
  const [travelAllowance, setTravelAllowance] = useState('0');
  const [mealAllowance, setMealAllowance] = useState('0');
  const [isPublicHoliday, setIsPublicHoliday] = useState(false);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // 'date' | 'time'
  const [pickerTarget, setPickerTarget] = useState(null); // 'date' | 'start' | 'end'
  const [pickerValue, setPickerValue] = useState(new Date());

  useEffect(() => {
    settingsApi.get().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  // Live calculation
  useEffect(() => {
    try {
      const startDec = timeToDecimal(startTime);
      const endDec = timeToDecimal(endTime);
      const breakDec = parseFloat(breakHours) || 0;
      const travel = parseFloat(travelAllowance) || 0;
      const meal = parseFloat(mealAllowance) || 0;
      const rate = settings.hourly_rate || 14.96;
      const taxRate = settings.tax_rate || 0.2764;
      const BONUS_THRESHOLD = 6;
      const BONUS_AMOUNT = 6.0;
      const HOLIDAY_MULTIPLIER = 1.5;

      let worked = endDec - startDec - breakDec;
      if (worked < 0) worked = 0;

      const effectiveRate = isPublicHoliday ? rate * HOLIDAY_MULTIPLIER : rate;
      const bonus = worked >= BONUS_THRESHOLD ? BONUS_AMOUNT : 0;
      const gross = worked * effectiveRate + bonus + travel + meal;
      const tax = gross * taxRate;
      const net = gross - tax;

      setPreview({ worked, bonus, gross, tax, net });
    } catch {}
  }, [startTime, endTime, breakHours, travelAllowance, mealAllowance, isPublicHoliday, settings]);

  const openPicker = (target) => {
    setPickerTarget(target);
    if (target === 'date') {
      setPickerMode('date');
      setPickerValue(new Date(date));
    } else if (target === 'start') {
      setPickerMode('time');
      setPickerValue(parseTimeToDate(startTime));
    } else if (target === 'end') {
      setPickerMode('time');
      setPickerValue(parseTimeToDate(endTime));
    }
    setShowPicker(true);
  };

  const handlePickerChange = (event, selected) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed') { setShowPicker(false); return; }
    if (!selected) return;
    if (pickerTarget === 'date') {
      setDate(selected.toISOString().slice(0, 10));
    } else if (pickerTarget === 'start') {
      setStartTime(formatTime(selected));
    } else if (pickerTarget === 'end') {
      setEndTime(formatTime(selected));
    }
    if (Platform.OS === 'ios') {
      // iOS keeps picker open until user taps Done
    }
  };

  const handleSave = async () => {
    if (!date || !startTime || !endTime) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      await entriesApi.create({
        date,
        start_time: startTime,
        end_time: endTime,
        break_hours: parseFloat(breakHours) || 0,
        travel_allowance: parseFloat(travelAllowance) || 0,
        meal_allowance: parseFloat(mealAllowance) || 0,
        is_public_holiday: isPublicHoliday,
        notes,
      });
      Alert.alert('Saved!', 'Work entry saved successfully.', [
        { text: 'OK', onPress: resetForm },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save entry.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setDate(today);
    setStartTime('08:00');
    setEndTime('16:00');
    setBreakHours('0.5');
    setTravelAllowance('0');
    setMealAllowance('0');
    setIsPublicHoliday(false);
    setNotes('');
  };

  const TimeButton = ({ label, value, target }) => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      <TouchableOpacity
        onPress={() => openPicker(target)}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: colors.surface, borderRadius: BorderRadius.md,
          borderWidth: 1, borderColor: colors.border,
          paddingHorizontal: 14, paddingVertical: 11,
        }}
      >
        <Ionicons name="time-outline" size={16} color={colors.primary} />
        <Text style={{ fontSize: FontSize.md, color: colors.text, fontWeight: '600' }}>{value}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="Add Work Entry" subtitle="Log your daily hours" />

          {/* Date */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '500', color: colors.text, marginBottom: 10 }}>Date</Text>
            <TouchableOpacity
              onPress={() => openPicker('date')}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.surface, borderRadius: BorderRadius.md,
                borderWidth: 1, borderColor: colors.border,
                paddingHorizontal: 14, paddingVertical: 11, gap: 10,
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: FontSize.md, color: colors.text }}>{date}</Text>
            </TouchableOpacity>
          </Card>

          {/* Time */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Working hours</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TimeButton label="Start time" value={startTime} target="start" />
              <TimeButton label="End time" value={endTime} target="end" />
            </View>
            <View style={{ marginTop: 14 }}>
              <Input label="Break (hours)" value={breakHours} onChangeText={setBreakHours} keyboardType="decimal-pad" placeholder="0.5" />
            </View>
          </Card>

          {/* Allowances */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Allowances</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="Travel (€)" value={travelAllowance} onChangeText={setTravelAllowance} keyboardType="decimal-pad" placeholder="0.00" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Meal (€)" value={mealAllowance} onChangeText={setMealAllowance} keyboardType="decimal-pad" placeholder="0.00" />
              </View>
            </View>
          </Card>

          {/* Public Holiday */}
          <Card style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>Public holiday</Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>1.5x hourly rate applied</Text>
              </View>
              <Switch
                value={isPublicHoliday}
                onValueChange={setIsPublicHoliday}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          {/* Notes */}
          <Card style={{ marginBottom: Spacing.md }}>
            <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any notes for this day..." multiline />
          </Card>

          {/* Live Preview */}
          {preview && (
            <Card style={{ marginBottom: Spacing.lg, borderColor: colors.primary, borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Ionicons name="flash-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.primary }}>Live calculation preview</Text>
              </View>
              <View style={{ gap: 8 }}>
                {[
                  { label: 'Hours worked', value: `${preview.worked.toFixed(2)}h`, color: colors.text },
                  { label: 'Bonus', value: formatEuro(preview.bonus), color: colors.bonus },
                  { label: 'Gross pay', value: formatEuro(preview.gross), color: colors.gross },
                  { label: 'Tax (27.64%)', value: `-${formatEuro(preview.tax)}`, color: colors.error },
                ].map(({ label, value, color }) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary }}>{label}</Text>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color }}>{value}</Text>
                  </View>
                ))}
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: FontSize.md, fontWeight: '700', color: colors.text }}>Net pay</Text>
                  <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: colors.net }}>{formatEuro(preview.net)}</Text>
                </View>
              </View>
            </Card>
          )}

          <Button title="Save Entry" onPress={handleSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS picker shown inline in a modal sheet */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={{ fontSize: FontSize.md, color: colors.primary, fontWeight: '700' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerValue}
                mode={pickerMode}
                display="spinner"
                onChange={handlePickerChange}
                is24Hour
                textColor={colors.text}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android picker shown as native dialog */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerMode}
          display="default"
          onChange={handlePickerChange}
          is24Hour
        />
      )}
    </SafeAreaView>
  );
}
