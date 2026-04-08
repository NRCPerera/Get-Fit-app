import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Linking from 'expo-linking';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredAuth } from './src/store/slices/authSlice';
import { theme } from './src/styles/theme';

export default function App() {
  useEffect(() => {
    // Load stored authentication on app start
    store.dispatch(loadStoredAuth());

    // Handle deep links (e.g., payment returns)
    const handleDeepLink = (event) => {
      const { url } = event;
      
      // Parse payment return URLs
      if (url.includes('payment/return') || url.includes('paymentId=')) {
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const paymentId = urlParams.get('paymentId');
        const status = url.includes('cancel') ? 'cancel' : 'success';
        
        // Navigate to payment screen with status
        // This will be handled by the payment screens
      }
    };

    // Get initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // Configure linking for navigation
  const linking = {
    prefixes: ['getfit://', 'https://getfit.app', 'http://getfit.app'],
    config: {
      screens: {
        Member: {
          screens: {
            Instructor: {
              screens: {
                SubscriptionPayment: 'payment/subscription',
                Payment: 'payment',
              },
            },
          },
        },
      },
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
