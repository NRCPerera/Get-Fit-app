/**
 * Dark Theme Colors
 * 
 * This file defines all color values for the dark theme.
 * Import these colors via ThemeContext, never directly.
 */

// Core Color Palette (shared with light theme)
const palette = {
  // Primary - Deep Red
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#DC2626',
    600: '#B91C1C',
    700: '#991B1B',
    800: '#7F1D1D',
    900: '#450A0A',
  },
  // Accent - Gold
  gold: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#D4AF37',
    600: '#B8860B',
    700: '#92400E',
    800: '#78350F',
    900: '#451A03',
  },
  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
};

// Dark Mode Color Tokens
export const darkColors = {
  // Brand Colors
  primary: palette.red[400],
  primaryDark: palette.red[500],
  primaryLight: palette.red[300],

  // Accent - Gold
  secondary: palette.gold[400],
  secondaryDark: palette.gold[500],
  secondaryLight: palette.gold[300],

  // Functional Colors
  success: '#34D399',
  successDark: '#10B981',
  error: palette.red[400],
  errorDark: palette.red[500],
  warning: palette.gold[400],
  warningDark: palette.gold[500],
  info: '#60A5FA',
  infoDark: '#3B82F6',
  danger: palette.red[400],

  // Backgrounds
  background: palette.gray[900],
  backgroundSecondary: palette.gray[800],
  backgroundTertiary: palette.gray[700],

  // Text
  text: palette.white,
  textSecondary: palette.gray[300],
  textTertiary: palette.gray[500],
  textDisabled: palette.gray[600],
  textInverse: palette.black,

  // UI Elements
  border: palette.gray[600],
  borderLight: palette.gray[700],
  divider: palette.gray[700],
  card: palette.gray[800],
  cardElevated: palette.gray[700],
  surface: palette.gray[800],

  // Interactive states
  ripple: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Gradients
  gradients: {
    primary: [palette.red[600], palette.red[700], palette.red[800]],
    secondary: [palette.gold[500], palette.gold[600], palette.gold[700]],
    success: ['#10B981', '#059669'],
    dark: [palette.gray[900], palette.black],
    warm: [palette.gold[500], palette.gold[600]],
    blue: ['#3B82F6', '#2563EB'],
    premium: [palette.red[700], palette.gold[600]],
    heroGradient: [palette.red[700], palette.black],
  },

  // Legacy support
  white: palette.white,
  black: palette.black,
  disabled: palette.gray[600],
};

export default darkColors;
