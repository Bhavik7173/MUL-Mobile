// src/screens/LanguageScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { i18n, LANGUAGES } from '../utils/i18n';
import { Card, SectionHeader } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

export default function LanguageScreen() {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(i18n.getLanguage());

  const handleSelect = async (code) => {
    await i18n.setLanguage(code);
    setSelected(code);
    Alert.alert(
      'Language changed',
      'Restart the app for full language change to take effect.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Language" subtitle="Choose your preferred language" />

        <Card>
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => handleSelect(lang.code)}
              style={{
                flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
                borderBottomWidth: i < LANGUAGES.length - 1 ? 0.5 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 28, marginRight: 14 }}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: colors.text }}>{lang.label}</Text>
                <Text style={{ fontSize: FontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                  {lang.code === 'en' ? 'English' : lang.code === 'nl' ? 'Dutch' : 'German'}
                </Text>
              </View>
              {selected === lang.code && (
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Card>

        <View style={{ marginTop: 20, backgroundColor: colors.primaryLight, borderRadius: BorderRadius.md, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: FontSize.sm, color: colors.primary, flex: 1 }}>
              A restart is needed for all labels to update. Core calculations always use Euro (€).
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
