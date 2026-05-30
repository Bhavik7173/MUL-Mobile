import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LoadingScreen } from './src/components/UI';
import { i18n } from './src/utils/i18n';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen, { isOnboardingDone } from './src/screens/OnboardingScreen';
import PINLockScreen, { isPinEnabled } from './src/screens/PINLockScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { isAuthenticated, initializing } = useAuth();
  const [appReady, setAppReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const init = async () => {
      await i18n.init();
      const onboarded = await isOnboardingDone();
      const pinEnabled = await isPinEnabled();
      setShowOnboarding(!onboarded);
      if (onboarded && isAuthenticated && pinEnabled) setShowPin(true);
      setAppReady(true);
    };
    if (!initializing) init();
  }, [initializing, isAuthenticated]);

  if (initializing || !appReady) return <LoadingScreen />;

  if (showOnboarding) return (
    <OnboardingScreen onDone={() => setShowOnboarding(false)} />
  );

  if (showPin) return (
    <PINLockScreen onUnlock={() => setShowPin(false)} />
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <Toast />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
export default App;
