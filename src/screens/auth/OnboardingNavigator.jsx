import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import OnboardingScreen1 from './OnboardingScreen1';
import OnboardingScreen2 from './OnboardingScreen2';
import OnboardingScreen3 from './OnboardingScreen3';
import OnboardingPagination from './OnboardingPagination';
import { storage } from '../../utils/storage';
import { theme } from '../../styles/theme';

const Stack = createNativeStackNavigator();
const { width } = Dimensions.get('window');

const OnboardingNavigator = ({ navigation }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const totalScreens = 3;

  const handleNext = async () => {
    if (currentScreen < totalScreens - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      // Mark onboarding as completed
      // The AppNavigator will automatically detect the change and re-render with Auth navigator
      await storage.setOnboardingCompleted();
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed
    // The AppNavigator will automatically detect the change and re-render with Auth navigator
    await storage.setOnboardingCompleted();
  };

  const renderScreen = (screenNumber) => {
    switch (screenNumber) {
      case 0:
        return <OnboardingScreen1 />;
      case 1:
        return <OnboardingScreen2 />;
      case 2:
        return <OnboardingScreen3 />;
      default:
        return <OnboardingScreen1 />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screenContainer}>
        {renderScreen(currentScreen)}
      </View>
      
      <OnboardingPagination
        currentScreen={currentScreen}
        totalScreens={totalScreens}
        onNext={handleNext}
        onSkip={handleSkip}
        isLastScreen={currentScreen === totalScreens - 1}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  screenContainer: {
    flex: 1,
  },
});

export default OnboardingNavigator;
