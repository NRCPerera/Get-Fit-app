/**
 * Dark Theme Colors
 * 
 * Indigo brand, desaturated semantic status palette — dark mode.
 * Import these colors via ThemeContext, never directly.
 */

// Core Color Palette (shared with light theme)
const palette = {
  // Brand — Indigo
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#7C7FFF',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  // Accent — Violet
  violet: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#9F7AEA',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  // Neutrals — cool dark
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1B1E27',
    900: '#0F1117',
    950: '#0A0C12',
  },
};

// Dark Mode Color Tokens
export const darkColors = {
  // Brand Colors — lighter for dark backgrounds
  primary: palette.indigo[500],
  primaryDark: palette.indigo[600],
  primaryLight: palette.violet[400],

  // Accent — Violet
  secondary: palette.violet[500],
  secondaryDark: palette.violet[600],
  secondaryLight: palette.violet[300],

  // Functional Colors — brighter on dark backgrounds for readability
  success: '#2DD4BF',
  successDark: '#14B8A6',
  error: '#F87171',
  errorDark: '#EF4444',
  warning: '#FBBF24',
  warningDark: '#F59E0B',
  info: '#60A5FA',
  infoDark: '#3B82F6',
  danger: '#F87171',

  // Semantic status backgrounds (dark tinted surfaces)
  successBg: '#0F2A26',
  warningBg: '#2A2110',
  errorBg: '#2A1414',
  infoBg: '#132238',

  // Backgrounds — cool off-black, never pure black
  background: palette.gray[900],
  backgroundSecondary: palette.gray[800],
  backgroundTertiary: palette.gray[700],

  // Text — off-white, never pure white
  text: '#F3F4F6',
  textSecondary: palette.gray[400],
  textTertiary: palette.gray[500],
  textDisabled: palette.gray[600],
  textInverse: palette.gray[900],

  // UI Elements
  border: '#262A36',
  borderLight: '#1F2330',
  divider: '#262A36',
  card: palette.gray[800],
  cardElevated: palette.gray[700],
  surface: palette.gray[800],

  // Interactive states
  ripple: 'rgba(255, 255, 255, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Gradients (kept for backward compatibility; headers should use flat fills)
  gradients: {
    primary: [palette.indigo[600], palette.indigo[700], palette.indigo[800]],
    secondary: [palette.violet[600], palette.violet[700], palette.violet[800]],
    success: ['#14B8A6', '#0F766E'],
    dark: [palette.gray[900], palette.gray[950]],
    warm: ['#F59E0B', '#D97706'],
    blue: ['#3B82F6', '#2563EB'],
    premium: [palette.indigo[600], palette.violet[700]],
    heroGradient: [palette.indigo[600], palette.gray[950]],
  },

  // Legacy support
  white: palette.white,
  black: palette.black,
  disabled: palette.gray[600],
};

export default darkColors;
