import React from 'react';
import { MotionView, ScaleTouchable } from './Motion';
import { glassmorphism } from '../../styles/shared';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function Card({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
  animated = true,
}) {
  const Container = onPress ? ScaleTouchable : View;
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
    glass: { ...glassmorphism(dynamicTheme), ...shadows.md },
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
          padding: paddingMap[padding] ?? paddingMap.md,
          borderRadius: theme.borderRadius.xl,
        },
        style,
      ]}
    >
      {Boolean(animated && variant === 'elevated') && (
        <MotionView pulse pointerEvents="none" style={[StyleSheet.absoluteFillObject, {
          borderRadius: StyleSheet.flatten(style)?.borderRadius ?? theme.borderRadius.xl,
          borderWidth: 1, borderColor: colors.glow + '25',
        }]} />
      )}
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  card: {
    // Base styles applied via variant
  },
});
