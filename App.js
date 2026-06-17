import React, { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredAuth } from './src/store/slices/authSlice';
import { fetchUserProfile } from './src/store/slices/userSlice';
import { fetchExercises } from './src/store/slices/exerciseSlice';
import { fetchSchedules } from './src/store/slices/scheduleSlice';
import { fetchInstructors } from './src/store/slices/instructorSlice';
import { fetchNutritionPlans } from './src/store/slices/nutritionSlice';
import { fetchWorkouts } from './src/store/slices/workoutSlice';
import { fetchMembershipPlans, fetchMyMemberships } from './src/store/slices/membershipSlice';
import { fetchPaymentHistory } from './src/store/slices/paymentSlice';
import { fetchMeasurementHistory, fetchLatestMeasurement } from './src/store/slices/measurementSlice';
import { fetchMedicalForm } from './src/store/slices/medicalSlice';
import { fetchNotifications, fetchUnreadCount } from './src/store/slices/notificationSlice';
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
    // Load stored authentication on app start, then fetch profile and all domain data
    store.dispatch(loadStoredAuth()).then((action) => {
      // After auth is loaded, fetch all initial data if authenticated
      if (action.payload?.user?.isEmailVerified) {
        // Fetch user and profile data
        store.dispatch(fetchUserProfile());
        store.dispatch(fetchMedicalForm());
        store.dispatch(fetchNotifications());
        store.dispatch(fetchUnreadCount());

        // Fetch member-specific data
        store.dispatch(fetchSchedules());
        store.dispatch(fetchMeasurementHistory());
        store.dispatch(fetchLatestMeasurement());
        store.dispatch(fetchPaymentHistory());
        store.dispatch(fetchMyMemberships());

        // Fetch public/library data
        store.dispatch(fetchWorkouts());
        store.dispatch(fetchExercises());
        store.dispatch(fetchInstructors());
        store.dispatch(fetchMembershipPlans());
        store.dispatch(fetchNutritionPlans());
      }
    });
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
