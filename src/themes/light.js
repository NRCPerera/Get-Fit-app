/**
 * Light Theme Colors
 * 
 * This file defines all color values for the light theme.
 * Import these colors via ThemeContext, never directly.
 */

// Core Color Palette
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

// Light Mode Color Tokens
export const lightColors = {
  // Brand Colors
  primary: palette.red[400],
  primaryDark: palette.red[500],
  primaryLight: palette.red[300],

  // Accent - Gold
  secondary: palette.gold[500],
  secondaryDark: palette.gold[600],
  secondaryLight: palette.gold[400],

  // Functional Colors
  success: '#10B981',
  successDark: '#059669',
  error: palette.red[400],
  errorDark: palette.red[500],
  warning: palette.gold[500],
  warningDark: palette.gold[600],
  info: '#3B82F6',
  infoDark: '#2563EB',
  danger: palette.red[500],

  // Backgrounds
  background: palette.white,
  backgroundSecondary: palette.gray[100],
  backgroundTertiary: palette.gray[200],

  // Text
  text: palette.gray[900],
  textSecondary: palette.gray[600],
  textTertiary: palette.gray[400],
  textDisabled: palette.gray[300],
  textInverse: palette.white,

  // UI Elements
  border: palette.gray[200],
  borderLight: palette.gray[100],
  divider: palette.gray[200],
  card: palette.white,
  cardElevated: palette.white,
  surface: palette.white,

  // Interactive states
  ripple: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradients
  gradients: {
    primary: [palette.red[500], palette.red[600], palette.red[700]],
    secondary: [palette.gold[400], palette.gold[500], palette.gold[600]],
    success: ['#10B981', '#059669'],
    dark: [palette.gray[800], palette.gray[900]],
    warm: [palette.gold[400], palette.gold[500]],
    blue: ['#3B82F6', '#2563EB'],
    premium: [palette.red[600], palette.gold[500]],
    heroGradient: [palette.red[500], palette.black],
  },

  // Legacy support
  white: palette.white,
  black: palette.black,
  disabled: palette.gray[300],
};

export default lightColors;
