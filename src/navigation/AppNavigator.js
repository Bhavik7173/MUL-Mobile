// src/navigation/AppNavigator.js
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import DashboardScreen          from '../screens/DashboardScreen';
import DailyEntryScreen         from '../screens/DailyEntryScreen';
import ClockInScreen            from '../screens/ClockInScreen';
import WorkEntriesScreen        from '../screens/WorkEntriesScreen';
import PayslipScreen            from '../screens/PayslipScreen';
import SettingsScreen           from '../screens/SettingsScreen';
import VacationScreen           from '../screens/VacationScreen';
import SickDaysScreen           from '../screens/SickDaysScreen';
import AnalyticsScreen          from '../screens/AnalyticsScreen';
import ProfileScreen            from '../screens/ProfileScreen';
import TaxSimulatorScreen       from '../screens/TaxSimulatorScreen';
import IncomeProjectionScreen   from '../screens/IncomeProjectionScreen';
import AttendanceCalendarScreen from '../screens/AttendanceCalendarScreen';
import OfflineSyncScreen        from '../screens/OfflineSyncScreen';
import BiometricSetupScreen     from '../screens/BiometricSetupScreen';
import OvertimeCalculatorScreen from '../screens/OvertimeCalculatorScreen';
import SalaryComparisonScreen   from '../screens/SalaryComparisonScreen';
import ExpenseTrackerScreen     from '../screens/ExpenseTrackerScreen';
import ActivityLogScreen        from '../screens/ActivityLogScreen';
import { PINSetupScreen }       from '../screens/PINLockScreen';
import LanguageScreen           from '../screens/LanguageScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MORE_SECTIONS = [
  {
    title: '📊 Reports & Analysis',
    items: [
      { label: 'Analytics',        icon: 'bar-chart-outline',          color: '#6366f1', route: 'Analytics' },
      { label: 'Salary Comparison',icon: 'git-compare-outline',        color: '#3b82f6', route: 'SalaryComparison' },
      { label: 'Income Forecast',  icon: 'trending-up-outline',        color: '#06b6d4', route: 'IncomeProjection' },
      { label: 'Overtime Calc',    icon: 'time-outline',               color: '#f59e0b', route: 'OvertimeCalculator' },
      { label: 'Tax Simulator',    icon: 'calculator-outline',         color: '#8b5cf6', route: 'TaxSimulator' },
    ],
  },
  {
    title: '⏱ Time & Attendance',
    items: [
      { label: 'Clock In/Out',     icon: 'timer-outline',              color: '#10b981', route: 'ClockIn' },
      { label: 'Attendance',       icon: 'calendar-outline',           color: '#3b82f6', route: 'Attendance' },
      { label: 'Vacation',         icon: 'airplane-outline',           color: '#f59e0b', route: 'Vacation' },
      { label: 'Sick Days',        icon: 'medkit-outline',             color: '#ef4444', route: 'SickDays' },
    ],
  },
  {
    title: '💰 Finance',
    items: [
      { label: 'Expenses',         icon: 'receipt-outline',            color: '#ec4899', route: 'ExpenseTracker' },
    ],
  },
  {
    title: '🔐 Account & Security',
    items: [
      { label: 'Profile',          icon: 'person-circle-outline',      color: '#10b981', route: 'Profile' },
      { label: 'Biometric Login',  icon: 'finger-print-outline',       color: '#ec4899', route: 'BiometricSetup' },
      { label: 'PIN Lock',         icon: 'lock-closed-outline',        color: '#8b5cf6', route: 'PINSetup' },
      { label: 'Activity Log',     icon: 'list-outline',               color: '#6b7280', route: 'ActivityLog' },
      { label: 'Offline Sync',     icon: 'cloud-offline-outline',      color: '#64748b', route: 'OfflineSync' },
    ],
  },
  {
    title: '⚙️ Preferences',
    items: [
      { label: 'Language',         icon: 'language-outline',           color: '#3b82f6', route: 'Language' },
      { label: 'Settings',         icon: 'settings-outline',           color: '#6b7280', route: 'Settings' },
    ],
  },
];

function MoreHomeScreen({ navigation }) {
  const { colors } = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 80 }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 }}>More</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 24 }}>All features in one place</Text>
      {MORE_SECTIONS.map(section => (
        <View key={section.title} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 10, letterSpacing: 0.5 }}>
            {section.title}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {section.items.map(({ label, icon, color, route }) => (
              <TouchableOpacity
                key={route}
                onPress={() => navigation.navigate(route)}
                activeOpacity={0.8}
                style={{
                  width: '47%', backgroundColor: colors.card, borderRadius: 14,
                  padding: 14, borderWidth: 0.5, borderColor: colors.border,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${color}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome"          component={MoreHomeScreen} />
      <Stack.Screen name="Analytics"         component={AnalyticsScreen} />
      <Stack.Screen name="SalaryComparison"  component={SalaryComparisonScreen} />
      <Stack.Screen name="IncomeProjection"  component={IncomeProjectionScreen} />
      <Stack.Screen name="OvertimeCalculator" component={OvertimeCalculatorScreen} />
      <Stack.Screen name="TaxSimulator"      component={TaxSimulatorScreen} />
      <Stack.Screen name="ClockIn"           component={ClockInScreen} />
      <Stack.Screen name="Attendance"        component={AttendanceCalendarScreen} />
      <Stack.Screen name="Vacation"          component={VacationScreen} />
      <Stack.Screen name="SickDays"          component={SickDaysScreen} />
      <Stack.Screen name="ExpenseTracker"    component={ExpenseTrackerScreen} />
      <Stack.Screen name="Profile"           component={ProfileScreen} />
      <Stack.Screen name="BiometricSetup"    component={BiometricSetupScreen} />
      <Stack.Screen name="PINSetup"          component={({ navigation }) => <PINSetupScreen onDone={() => navigation.goBack()} />} />
      <Stack.Screen name="ActivityLog"       component={ActivityLogScreen} />
      <Stack.Screen name="OfflineSync"       component={OfflineSyncScreen} />
      <Stack.Screen name="Language"          component={LanguageScreen} />
      <Stack.Screen name="Settings"          component={SettingsScreen} />
    </Stack.Navigator>
  );
}

const TABS = [
  { name: 'Dashboard',    component: DashboardScreen,   icon: 'grid',         iconOut: 'grid-outline' },
  { name: 'Clock',        component: ClockInScreen,     icon: 'timer',        iconOut: 'timer-outline' },
  { name: 'Daily Entry',  component: DailyEntryScreen,  icon: 'add-circle',   iconOut: 'add-circle-outline' },
  { name: 'Entries',      component: WorkEntriesScreen, icon: 'list',         iconOut: 'list-outline' },
  { name: 'More',         component: MoreStack,         icon: 'ellipsis-horizontal-circle', iconOut: 'ellipsis-horizontal-circle-outline' },
];

export default function AppNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find(t => t.name === route.name);
        return {
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? tab.icon : tab.iconOut} size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 0.5, paddingBottom: 8, paddingTop: 6, height: 62 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        };
      }}
    >
      {TABS.map(tab => <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />)}
    </Tab.Navigator>
  );
}
