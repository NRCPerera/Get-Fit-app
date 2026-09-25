import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScaleTouchable } from './Motion';
import { Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
}) {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  const variants = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.white,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.white,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text,
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.errorDark,
      color: colors.white,
      borderWidth: 0,
    },
    success: {
      backgroundColor: colors.successDark,
      color: colors.white,
      borderWidth: 0,
    },
  };

  const sizes = {
    sm: {
      paddingVertical: theme.spacing[2],
      paddingHorizontal: theme.spacing[3],
      fontSize: theme.typography.fontSize.sm,
      minHeight: 36,
    },
    md: {
      paddingVertical: theme.spacing[3],
      paddingHorizontal: theme.spacing[4],
      fontSize: theme.typography.fontSize.md,
      minHeight: 48,
    },
    lg: {
      paddingVertical: theme.spacing[4],
      paddingHorizontal: theme.spacing[6],
      fontSize: theme.typography.fontSize.lg,
      minHeight: 56,
    },
  };

  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  const isDisabled = disabled || loading;

  return (
    <ScaleTouchable
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: v.backgroundColor,
          borderColor: v.borderColor || colors.primary,
          borderWidth: v.borderWidth,
          borderRadius: theme.borderRadius.full,
          opacity: isDisabled ? 0.6 : 1,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          minHeight: s.minHeight,
          width: fullWidth ? '100%' : undefined,
        },
        variant === 'primary' && !isDisabled && { ...dynamicTheme.shadows.md, shadowColor: colors.glow },
        style,
      ]}
    >
      {(Boolean(variant === 'primary' || variant === 'secondary')) && (
        <LinearGradient pointerEvents="none" colors={colors.gradients[variant]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: StyleSheet.flatten(style)?.borderRadius ?? theme.borderRadius.full }]} />
      )}
      {loading ? (
        <ActivityIndicator color={v.color} size="small" />
      ) : (
        <View style={styles.content}>
          {Boolean(icon && !iconRight) && (
            <View style={styles.iconLeft}>
              {typeof icon === 'string' ? (
                <Ionicons name={icon} size={20} color={v.color} />
              ) : (
                icon
              )}
            </View>
          )}
          <Text
            style={[
              styles.text,
              {
                color: v.color,
                fontSize: s.fontSize,
                fontWeight: theme.typography.fontWeight.semibold,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {Boolean(icon && iconRight) && (
            <View style={styles.iconRight}>
              {typeof icon === 'string' ? (
                <Ionicons name={icon} size={20} color={v.color} />
              ) : (
                icon
              )}
            </View>
          )}
        </View>
      )}
    </ScaleTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
  },
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: theme.spacing[1],
  },
  iconRight: {
    marginLeft: theme.spacing[1],
  },
});
