import React, { useEffect, useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/common/LoadingScreen';
import MandatoryUpdateScreen from './src/components/common/MandatoryUpdateScreen';
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
import { checkAppVersion } from './src/services/appVersion';

const LightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563EB',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#111827',
    border: '#E5E7EB',
    notification: '#06B6D4',
  },
};

const DarkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3B82F6',
    background: '#0B1020',
    card: '#1F2937',
    text: '#F9FAFB',
    border: '#334155',
    notification: '#22D3EE',
  },
};

const AppContent = () => {
  const { isDark } = useTheme();
  const [versionCheckComplete, setVersionCheckComplete] = useState(false);
  const [versionInfo, setVersionInfo] = useState(null);

  const navigationTheme = useMemo(() => (
    isDark ? DarkNavigationTheme : LightNavigationTheme
  ), [isDark]);

  useEffect(() => {
    let isMounted = true;

    const runVersionCheck = async () => {
      const result = await checkAppVersion();
      if (!isMounted) {
        return;
      }

      setVersionInfo(result);
      setVersionCheckComplete(true);
    };

    runVersionCheck();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!versionCheckComplete ? (
        <LoadingScreen />
      ) : versionInfo?.updateRequired ? (
        <MandatoryUpdateScreen versionInfo={versionInfo} />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    setStoreRef(store);
    store.dispatch(loadStoredAuth()).then((action) => {
      if (action.payload?.user?.isEmailVerified) {
        store.dispatch(fetchUserProfile());
        store.dispatch(fetchMedicalForm());
        store.dispatch(fetchNotifications());
        store.dispatch(fetchUnreadCount());
        store.dispatch(fetchSchedules());
        store.dispatch(fetchMeasurementHistory());
        store.dispatch(fetchLatestMeasurement());
        store.dispatch(fetchPaymentHistory());
        store.dispatch(fetchMyMemberships());
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
