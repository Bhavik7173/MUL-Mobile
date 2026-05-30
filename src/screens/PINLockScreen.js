// src/screens/PINLockScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { FontSize, Spacing, BorderRadius } from '../theme/colors';

const PIN_KEY = 'mul-pin-hash';
const PIN_ENABLED_KEY = 'mul-pin-enabled';

function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) h = (h << 5) - h + pin.charCodeAt(i);
  return String(h);
}

export async function isPinEnabled() {
  const val = await AsyncStorage.getItem(PIN_ENABLED_KEY);
  return val === 'true';
}

export async function verifyPin(pin) {
  const stored = await AsyncStorage.getItem(PIN_KEY);
  return stored === hashPin(pin);
}

// PIN Setup / Change screen
export function PINSetupScreen({ onDone }) {
  const { colors } = useTheme();
  const [step, setStep] = useState('enter'); // 'enter' | 'confirm'
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');

  const handleKey = (key) => {
    if (pin.length >= 4) return;
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => {
        if (step === 'enter') {
          setFirstPin(newPin);
          setPin('');
          setStep('confirm');
        } else {
          if (newPin === firstPin) {
            AsyncStorage.setItem(PIN_KEY, hashPin(newPin));
            AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');
            Alert.alert('PIN set!', 'Your PIN has been saved.', [{ text: 'OK', onPress: onDone }]);
          } else {
            Vibration.vibrate(300);
            Alert.alert('Mismatch', 'PINs do not match. Try again.');
            setPin(''); setFirstPin(''); setStep('enter');
          }
        }
      }, 100);
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  return <PINPad title={step === 'enter' ? 'Set PIN' : 'Confirm PIN'} subtitle={step === 'enter' ? 'Enter a 4-digit PIN' : 'Enter PIN again'} pin={pin} onKey={handleKey} onDelete={handleDelete} colors={colors} />;
}

// PIN Entry screen (used for locking)
export default function PINLockScreen({ onUnlock }) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleKey = (key) => {
    if (pin.length >= 4) return;
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(async () => {
        const ok = await verifyPin(newPin);
        if (ok) {
          onUnlock?.();
        } else {
          Vibration.vibrate(400);
          setAttempts(a => a + 1);
          setPin('');
          if (attempts >= 4) Alert.alert('Too many attempts', 'Please sign in again.');
        }
      }, 100);
    }
  };

  return <PINPad title="Enter PIN" subtitle={attempts > 0 ? `${attempts} failed attempt${attempts > 1 ? 's' : ''}` : 'Enter your 4-digit PIN'} pin={pin} onKey={handleKey} onDelete={() => setPin(p => p.slice(0, -1))} colors={colors} />;
}

function PINPad({ title, subtitle, pin, onKey, onDelete, colors }) {
  const dots = [0, 1, 2, 3];
  const keys = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 }}>
        <Ionicons name="lock-closed-outline" size={32} color="#fff" />
      </View>
      <Text style={{ fontSize: FontSize.xl, fontWeight: '800', color: colors.text, marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: FontSize.sm, color: colors.textSecondary, marginBottom: 32 }}>{subtitle}</Text>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 40 }}>
        {dots.map(i => (
          <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: i < pin.length ? colors.primary : colors.border }} />
        ))}
      </View>
      <View style={{ gap: 16 }}>
        {keys.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 24 }}>
            {row.map((key, ki) => (
              key === '' ? <View key={ki} style={{ width: 72, height: 72 }} /> :
              <TouchableOpacity key={ki}
                onPress={() => key === '⌫' ? onDelete() : onKey(key)}
                style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: key === '⌫' ? colors.background : colors.card, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                {key === '⌫'
                  ? <Ionicons name="backspace-outline" size={22} color={colors.text} />
                  : <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text }}>{key}</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
