import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import Button from '../../components/common/Button';

const OnboardingPagination = ({ 
  currentScreen, 
  totalScreens, 
  onNext, 
  onSkip, 
  isLastScreen 
}) => {
  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={onSkip}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalScreens }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentScreen ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Next/Get Started Button */}
      <Button
        title={isLastScreen ? 'Get Started' : 'Next'}
        onPress={onNext}
        variant="primary"
        icon={!isLastScreen ? "arrow-forward-outline" : "checkmark-circle-outline"}
        iconRight={!isLastScreen}
        size="md"
        style={styles.nextButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[6],
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  skipButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
  },
  skipText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  dot: {
    height: 8,
    borderRadius: theme.borderRadius.full,
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: theme.colors.border,
  },
  nextButton: {
    minWidth: 120,
  },
});

export default OnboardingPagination;
