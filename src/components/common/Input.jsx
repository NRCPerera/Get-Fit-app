import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  secureTextEntry,
  leftIcon,
  rightIcon,
  multiline = false,
  editable = true,
  keyboardType,
  autoCapitalize = 'none',
  style,
  inputStyle,
  size = 'md',
  showPasswordToggle = false,
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  const sizeMap = {
    sm: {
      paddingVertical: theme.spacing[2],
      paddingHorizontal: theme.spacing[3],
      fontSize: theme.typography.fontSize.sm,
      minHeight: 40,
    },
    md: {
      paddingVertical: theme.spacing[3],
      paddingHorizontal: theme.spacing[4],
      fontSize: theme.typography.fontSize.md,
      minHeight: 48,
    },
    lg: {
      paddingVertical: theme.spacing[4],
      paddingHorizontal: theme.spacing[4],
      fontSize: theme.typography.fontSize.lg,
      minHeight: 56,
    },
  };

  const s = sizeMap[size] || sizeMap.md;
  const isPassword = secureTextEntry && showPasswordToggle;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error
              ? colors.error
              : isFocused
                ? colors.primary
                : colors.border,
            backgroundColor: editable
              ? colors.background
              : colors.backgroundSecondary,
            borderWidth: isFocused ? 2 : 1,
            borderRadius: theme.borderRadius.md,
            paddingHorizontal: s.paddingHorizontal,
            paddingVertical: s.paddingVertical,
            minHeight: multiline ? 100 : s.minHeight,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.iconLeft}>
            {typeof leftIcon === 'string' ? (
              <Ionicons
                name={leftIcon}
                size={20}
                color={colors.textSecondary}
              />
            ) : (
              leftIcon
            )}
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            {
              fontSize: s.fontSize,
              color: colors.text,
              paddingVertical: 0, // Handled by wrapper
            },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? !isPasswordVisible : secureTextEntry}
          editable={editable}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconRight}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <View style={styles.iconRight}>
            {typeof rightIcon === 'string' ? (
              <Ionicons
                name={rightIcon}
                size={20}
                color={colors.textSecondary}
              />
            ) : (
              rightIcon
            )}
          </View>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing[3],
  },
  label: {
    marginBottom: theme.spacing[2],
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    padding: 0,
  },
  iconLeft: {
    marginRight: theme.spacing[2],
    justifyContent: 'center',
  },
  iconRight: {
    marginLeft: theme.spacing[2],
    justifyContent: 'center',
  },
  error: {
    color: theme.colors.error,
    marginTop: theme.spacing[1],
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  helperText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing[1],
    fontSize: theme.typography.fontSize.xs,
  },
});
