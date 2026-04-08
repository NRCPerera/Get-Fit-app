/**
 * Theme Index
 * 
 * Central export point for all theme-related values.
 * Use this for importing theme constants that don't change with mode.
 */

import { lightColors } from './light';
import { darkColors } from './dark';

// Typography (same for both themes)
export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing (same for both themes)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  // Legacy aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// Border Radius (same for both themes)
export const borderRadius = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  full: 9999,
  round: 9999,
};

// Dynamic shadows based on mode
export const getShadows = (isDark) => ({
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: isDark ? '#DC2626' : '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: isDark ? '#DC2626' : '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.4 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: isDark ? '#DC2626' : '#171717',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.5 : 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  xl: {
    shadowColor: isDark ? '#D4AF37' : '#171717',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: isDark ? 0.6 : 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  // Legacy aliases
  light: {
    shadowColor: isDark ? '#DC2626' : '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: isDark ? '#DC2626' : '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  heavy: {
    shadowColor: isDark ? '#D4AF37' : '#171717',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.5 : 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
});

// Light theme object
export const lightTheme = {
  colors: lightColors,
  typography,
  spacing,
  borderRadius,
  shadows: getShadows(false),
  isDark: false,
};

// Dark theme object
export const darkTheme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
  shadows: getShadows(true),
  isDark: true,
};

// Helper to get theme based on mode
export const getTheme = (isDark) => (isDark ? darkTheme : lightTheme);

// Re-export color types for reference
export { lightColors, darkColors };
