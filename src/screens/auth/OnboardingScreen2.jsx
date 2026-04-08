import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { headerStyles } from '../../styles/shared';

const OnboardingScreen2 = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="people" size={80} color={theme.colors.secondary} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={headerStyles.title}>Expert Trainers</Text>
          <Text style={headerStyles.subtitle}>
            Connect with certified personal trainers who will create 
            customized workout plans tailored to your fitness level and goals.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[8],
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
  },
});

export default OnboardingScreen2;
