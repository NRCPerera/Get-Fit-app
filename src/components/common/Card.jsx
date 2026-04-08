import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function Card({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
}) {
  const Container = onPress ? TouchableOpacity : View;
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const shadows = dynamicTheme.shadows;

  const paddingMap = {
    none: 0,
    sm: theme.spacing[2],
    md: theme.spacing[4],
    lg: theme.spacing[6],
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.card,
      borderWidth: 0,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    elevated: {
      backgroundColor: colors.cardElevated,
      borderWidth: 0,
      ...shadows.lg,
    },
    flat: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 0,
    },
  };

  return (
    <Container
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[
        styles.card,
        variantStyles[variant] || variantStyles.default,
        {
          padding: paddingMap[padding] || paddingMap.md,
          borderRadius: theme.borderRadius.lg,
        },
        style,
      ]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    // Base styles applied via variant
  },
});
