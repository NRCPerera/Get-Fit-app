import React, { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredAuth } from './src/store/slices/authSlice';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { setStoreRef } from './src/api/client';

// Custom navigation themes
const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#DC2626', // Red
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#171717',
    border: '#E5E5E5',
    notification: '#D4AF37', // Gold
  },
};

const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#DC2626', // Red
    background: '#000000',
    card: '#171717',
    text: '#FFFFFF',
    border: '#404040',
    notification: '#D4AF37', // Gold
  },
};

// Inner component that uses theme context
const AppContent = () => {
  const { isDark, theme } = useTheme();

  const navigationTheme = useMemo(() =>
    isDark ? DarkNavigationTheme : LightNavigationTheme,
    [isDark]
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    // Wire up store reference so API client can trigger logout on auth failure
    setStoreRef(store);
    // Load stored authentication on app start
    store.dispatch(loadStoredAuth());
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
  );
}
