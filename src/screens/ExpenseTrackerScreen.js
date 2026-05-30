// src/screens/ExpenseTrackerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Card, Button, SectionHeader, EmptyState, Badge } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const KEY = 'mul-expenses';
const CATEGORIES = [
  { label: 'Travel', icon: 'car-outline', color: '#3b82f6' },
  { label: 'Meals', icon: 'fast-food-outline', color: '#f59e0b' },
  { label: 'Tools', icon: 'construct-outline', color: '#8b5cf6' },
  { label: 'Clothing', icon: 'shirt-outline', color: '#ec4899' },
  { label: 'Training', icon: 'school-outline', color: '#10b981' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6b7280' },
];

function fmt(v) { return `€${(v || 0).toFixed(2)}`; }

export default function ExpenseTrackerScreen() {
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Travel');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [filter, setFilter] = useState('All');

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      setExpenses(raw ? JSON.parse(raw) : []);
    } catch {}
  };

  const saveExpense = async () => {
    if (!amount || !description) { Alert.alert('Missing', 'Please fill in amount and description.'); return; }
    const expense = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      description,
      category,
      date,
      createdAt: new Date().toISOString(),
    };
    const updated = [expense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    setShowForm(false);
    setAmount(''); setDescription(''); setCategory('Travel');
  };

  const deleteExpense = (id) => {
    Alert.alert('Delete', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const updated = expenses.filter(e => e.id !== id);
          setExpenses(updated);
          await AsyncStorage.setItem(KEY, JSON.stringify(updated));
        },
      },
    ]);
  };

  const filtered = filter === 'All' ? expenses : expenses.filter(e => e.category === filter);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  const byCategory = CATEGORIES.map(c => ({
    ...c,
    total: expenses.filter(e => e.category === c.label).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Expense Tracker"
          subtitle="Track work-related expenses"
          action={
            <TouchableOpacity onPress={() => setShowForm(true)}
              style={{ backgroundColor: colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '700' }}>Add</Text>
            </TouchableOpacity>
          }
        />

        {/* Total */}
        <Card style={{ marginBottom: Spacing.md, alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>Total expenses</Text>
          <Text style={{ fontSize: 36, fontWeight: '900', color: colors.error, marginTop: 4 }}>{fmt(totalAll)}</Text>
        </Card>

        {/* By category */}
        {byCategory.length > 0 && (
          <Card style={{ marginBottom: Spacing.md }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: colors.text, marginBottom: 12 }}>By category</Text>
            {byCategory.map(c => (
              <View key={c.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${c.color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Ionicons name={c.icon} size={15} color={c.color} />
                </View>
                <Text style={{ flex: 1, fontSize: FontSize.sm, color: colors.text }}>{c.label}</Text>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: c.color }}>{fmt(c.total)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['All', ...CATEGORIES.map(c => c.label)].map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: filter === f ? colors.primary : colors.card, borderWidth: 0.5, borderColor: filter === f ? colors.primary : colors.border }}>
                <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: filter === f ? '#fff' : colors.textSecondary }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* List */}
        <Card>
          <SectionHeader title={`${filtered.length} expenses · ${fmt(totalFiltered)}`} />
          {filtered.length === 0 ? (
            <EmptyState icon={<Ionicons name="receipt-outline" size={36} color={colors.textSecondary} />} title="No expenses" subtitle="Tap + Add to log an expense" />
          ) : (
            filtered.map(e => {
              const cat = CATEGORIES.find(c => c.label === e.category) || CATEGORIES[5];
              return (
                <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${cat.color}18`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name={cat.icon} size={17} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.sm, fontWeight: '600', color: colors.text }}>{e.description}</Text>
                    <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary }}>{e.date} · {e.category}</Text>
                  </View>
                  <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: colors.error, marginRight: 10 }}>{fmt(e.amount)}</Text>
                  <TouchableOpacity onPress={() => deleteExpense(e.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>

      <Modal visible={showForm} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: '700', color: colors.text }}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Amount (€)</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: 12, fontSize: FontSize.xl, fontWeight: '700', color: colors.text, marginBottom: 14 }} />
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 6 }}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="What was this for?"
              placeholderTextColor={colors.textMuted}
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: BorderRadius.md, padding: 12, fontSize: FontSize.md, color: colors.text, marginBottom: 14 }} />
            <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginBottom: 8 }}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c.label} onPress={() => setCategory(c.label)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: category === c.label ? c.color : colors.background, borderWidth: 1, borderColor: category === c.label ? c.color : colors.border, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name={c.icon} size={13} color={category === c.label ? '#fff' : c.color} />
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: category === c.label ? '#fff' : colors.textSecondary }}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Button title="Save Expense" onPress={saveExpense} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
