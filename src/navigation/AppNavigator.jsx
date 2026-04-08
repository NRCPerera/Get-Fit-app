import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import MemberNavigator from './MemberNavigator';
import InstructorNavigator from './InstructorNavigator';
import LoadingScreen from '../screens/common/LoadingScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import { storage } from '../utils/storage';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, role, loading, user } = useSelector((state) => state.auth);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const completed = await storage.getOnboardingCompleted();
        setIsOnboardingCompleted(completed);
      } catch (error) {
        setIsOnboardingCompleted(false);
      } finally {
        setIsInitializing(false);
      }
    };

    checkOnboardingStatus();

    // Set up an interval to re-check onboarding status (in case it changes)
    // This allows the navigator to update when onboarding is completed
    const interval = setInterval(() => {
      storage.getOnboardingCompleted()
        .then(completed => {
          if (completed !== isOnboardingCompleted) {
            setIsOnboardingCompleted(completed);
          }
        })
        .catch(() => { });
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [isOnboardingCompleted]);

  // Show loading screen while checking onboarding status or auth loading
  if (isInitializing || loading) {
    return <LoadingScreen />;
  }

  // Show onboarding for new users
  if (!isOnboardingCompleted) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  }

  // Show auth or main app based on authentication status
  // Also check if email is verified - if not, keep user in auth flow
  const isFullyAuthenticated = isAuthenticated && user?.isEmailVerified;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isFullyAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {role === 'member' && (
            <Stack.Screen name="Member" component={MemberNavigator} />
          )}
          {role === 'instructor' && (
            <Stack.Screen name="Instructor" component={InstructorNavigator} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

