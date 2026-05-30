// src/screens/OnboardingScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/UI';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const W = Dimensions.get('window').width;
const ONBOARDING_KEY = 'mul-onboarding-done';

export async function isOnboardingDone() {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function markOnboardingDone() {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

const SLIDES = [
  {
    icon: 'wallet-outline',
    color: '#3b4fd8',
    title: 'Welcome to MUL Salary',
    subtitle: 'Your complete salary management app. Track every hour, every euro.',
    features: ['Daily work entry logging', 'Automatic pay calculation', 'Tax at 27.64% (NL/DE)'],
  },
  {
    icon: 'bar-chart-outline',
    color: '#10b981',
    title: 'Powerful Analytics',
    subtitle: 'See your earnings at a glance with beautiful charts and reports.',
    features: ['Monthly & yearly summaries', 'Income projection', 'Overtime calculator', 'Tax simulator'],
  },
  {
    icon: 'shield-checkmark-outline',
    color: '#8b5cf6',
    title: 'Secure & Smart',
    subtitle: 'Your data stays safe with biometric login, PIN lock, and offline sync.',
    features: ['Face ID / fingerprint login', 'PIN code protection', 'Offline mode with sync', 'Clock in/out timer'],
  },
  {
    icon: 'rocket-outline',
    color: '#f59e0b',
    title: "You're all set!",
    subtitle: 'Connect your backend server and start tracking your salary today.',
    features: ['Set backend URL in Settings', 'Login with any email + 4+ char password', 'Add your first work entry'],
  },
];

export default function OnboardingScreen({ onDone }) {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);

  const goTo = (index) => {
    setCurrent(index);
    scrollRef.current?.scrollTo({ x: index * W, animated: true });
  };

  const handleNext = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
    else handleDone();
  };

  const handleDone = async () => {
    await markOnboardingDone();
    onDone?.();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Skip */}
      <TouchableOpacity onPress={handleDone} style={{ position: 'absolute', top: 16, right: 20, zIndex: 10, padding: 8 }}>
        <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, fontWeight: '600' }}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width: W, flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
            <View style={{
              width: 100, height: 100, borderRadius: 28,
              backgroundColor: `${slide.color}18`,
              alignItems: 'center', justifyContent: 'center', marginBottom: 32,
              shadowColor: slide.color, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
              borderWidth: 1.5, borderColor: `${slide.color}40`,
            }}>
              <Ionicons name={slide.icon} size={48} color={slide.color} />
            </View>
            <Text style={{ fontSize: FontSize.xxl, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 12, letterSpacing: -0.5 }}>
              {slide.title}
            </Text>
            <Text style={{ fontSize: FontSize.md, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 28 }}>
              {slide.subtitle}
            </Text>
            <View style={{ alignSelf: 'stretch', backgroundColor: colors.card, borderRadius: BorderRadius.lg, padding: 16, borderWidth: 0.5, borderColor: colors.border }}>
              {slide.features.map((f, fi) => (
                <View key={fi} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${slide.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={13} color={slide.color} />
                  </View>
                  <Text style={{ fontSize: FontSize.sm, color: colors.text, flex: 1 }}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom nav */}
      <View style={{ padding: Spacing.lg, paddingBottom: 32 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={{
                height: 8, width: current === i ? 24 : 8,
                borderRadius: 4,
                backgroundColor: current === i ? colors.primary : colors.border,
              }} />
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title={current === SLIDES.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          icon={<Ionicons name={current === SLIDES.length - 1 ? "rocket-outline" : "arrow-forward-outline"} size={18} color="#fff" />}
        />
      </View>
    </SafeAreaView>
  );
}
