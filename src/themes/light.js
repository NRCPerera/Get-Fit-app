/**
 * Light Theme Colors
 * 
 * Indigo brand, desaturated semantic status palette.
 * Import these colors via ThemeContext, never directly.
 */

// Core Color Palette
const palette = {
  // Brand — Indigo
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#5B5FEF',
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
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },
  // Neutrals — slightly cool
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#EEF0F5',
    200: '#E3E5EC',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#1A1D29',
    950: '#0F1117',
  },
};

// Light Mode Color Tokens
export const lightColors = {
  // Brand Colors
  primary: palette.indigo[500],
  primaryDark: palette.indigo[600],
  primaryLight: palette.violet[500],

  // Accent — Violet
  secondary: palette.violet[600],
  secondaryDark: palette.violet[700],
  secondaryLight: palette.violet[400],

  // Functional Colors — desaturated, WCAG-safe on their respective Bg tokens
  success: '#0F766E',
  successDark: '#0D6B63',
  error: '#B91C1C',
  errorDark: '#991B1B',
  warning: '#B45309',
  warningDark: '#92400E',
  info: '#1D4ED8',
  infoDark: '#1E40AF',
  danger: '#B91C1C',

  // Semantic status backgrounds (tinted surfaces for badges / cards)
  successBg: '#ECFDF5',
  warningBg: '#FFFBEB',
  errorBg: '#FEF2F2',
  infoBg: '#EFF6FF',

  // Backgrounds — cool off-white, never pure white
  background: palette.gray[100],
  backgroundSecondary: palette.gray[200],
  backgroundTertiary: palette.gray[300],

  // Text — dark cool gray, never pure black
  text: palette.gray[900],
  textSecondary: palette.gray[500],
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
  ripple: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradients (kept for backward compatibility; headers should use flat fills)
  gradients: {
    primary: [palette.indigo[500], palette.indigo[600], palette.indigo[700]],
    secondary: [palette.violet[600], palette.violet[700], palette.violet[800]],
    success: ['#0F766E', '#0D6B63'],
    dark: [palette.gray[700], palette.gray[800]],
    warm: ['#B45309', '#92400E'],
    blue: ['#1D4ED8', '#1E40AF'],
    premium: [palette.indigo[500], palette.violet[600]],
    heroGradient: [palette.indigo[500], palette.gray[900]],
  },

  // Legacy support
  white: palette.white,
  black: palette.black,
  disabled: palette.gray[300],
};

export default lightColors;
