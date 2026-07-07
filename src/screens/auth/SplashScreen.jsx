import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

const SplashScreen = () => {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="fitness" size={64} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.primary }]}>Get Fit</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your fitness journey starts here</Text>
      <ActivityIndicator 
        size="large" 
        color={colors.primary} 
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: colors.background - applied inline
    padding: theme.spacing[6],
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    // backgroundColor: colors.primary + '15' - applied inline
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    // color: colors.primary - applied inline
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    // color: colors.textSecondary - applied inline
    textAlign: 'center',
    marginBottom: theme.spacing[8],
  },
  loader: {
    marginTop: theme.spacing[4],
  },
});

export default SplashScreen;

