import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
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
      backgroundColor: colors.error,
      color: colors.white,
      borderWidth: 0,
    },
    success: {
      backgroundColor: colors.success,
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
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: v.backgroundColor,
          borderColor: v.borderColor || theme.colors.primary,
          borderWidth: v.borderWidth,
          borderRadius: theme.borderRadius.md,
          opacity: isDisabled ? 0.6 : 1,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          minHeight: s.minHeight,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.color} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && !iconRight && (
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
          {icon && iconRight && (
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
    </TouchableOpacity>
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
