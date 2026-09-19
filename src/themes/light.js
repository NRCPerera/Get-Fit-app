/**
 * Light Theme Colors
 * 
 * GetFit Blue + Purple + Cyan brand and semantic status palette.
 * Import these colors via ThemeContext, never directly.
 */

// Core Color Palette
const palette = {
  // Brand — Blue
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  // Secondary — Purple
  purple: {
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
  // Accent — Cyan
  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },
  // Neutrals — slightly cool
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F1F5F9',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#0B1020',
  },
};

// Light Mode Color Tokens
export const lightColors = {
  // Brand Colors
  primary: palette.blue[600],
  primaryDark: palette.blue[700],
  primaryLight: palette.blue[100],

  // Secondary — Purple
  secondary: palette.purple[600],
  secondaryDark: palette.purple[700],
  secondaryLight: palette.purple[100],

  // Accent — Cyan
  accent: palette.cyan[500],
  accentDark: palette.cyan[600],
  accentLight: palette.cyan[100],

  accentGradient: [palette.blue[600], palette.purple[600], palette.cyan[500]],
  shimmer: '#FFFFFFCC',
  glow: palette.blue[600],
  glass: '#FFFFFFEB',
  glassBorder: '#FFFFFFCC',
  onPrimary: '#FFFFFF',

  // Functional Colors — desaturated, WCAG-safe on their respective Bg tokens
  success: '#10B981',
  successDark: '#059669',
  error: '#EF4444',
  errorDark: '#DC2626',
  warning: '#F59E0B',
  warningDark: '#D97706',
  info: palette.blue[700],
  infoDark: palette.blue[800],
  danger: '#DC2626',

  // Semantic status backgrounds (tinted surfaces for badges / cards)
  successBg: '#ECFDF5',
  warningBg: '#FFFBEB',
  errorBg: '#FEF2F2',
  infoBg: '#EFF6FF',

  // Backgrounds — cool off-white, never pure white
  background: '#F8FAFC',
  backgroundSecondary: palette.gray[100],
  backgroundTertiary: palette.gray[200],

  // Text — dark cool gray, never pure black
  text: '#111827',
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
  ripple: 'rgba(37, 99, 235, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradients (kept for backward compatibility; shared across headers and controls)
  gradients: {
    primary: [palette.blue[600], palette.blue[700], palette.blue[800]],
    secondary: [palette.purple[600], palette.purple[700]],
    success: ['#059669', '#047857'],
    dark: [palette.gray[700], palette.gray[800]],
    warm: [palette.cyan[500], palette.cyan[600]],
    blue: [palette.blue[700], palette.blue[800]],
    premium: [palette.blue[600], palette.purple[600]],
    heroGradient: [palette.blue[600], palette.gray[900]],
  },

  // Legacy support
  white: palette.white,
  black: palette.black,
  disabled: palette.gray[300],
};

export default lightColors;
