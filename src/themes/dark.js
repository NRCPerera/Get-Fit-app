/**
 * Dark Theme Colors
 * 
 * GetFit Blue + Purple + Cyan brand and semantic status palette — dark mode.
 * Import these colors via ThemeContext, never directly.
 */

// Core Color Palette (shared with light theme)
const palette = {
  // Brand — Blue (brighter variants for dark backgrounds)
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
    800: '#1F2937',
    900: '#111827',
    950: '#0B1020',
  },
};

// Dark Mode Color Tokens
export const darkColors = {
  // Brand Colors — lighter for dark backgrounds
  primary: palette.blue[500],
  primaryDark: palette.blue[600],
  primaryLight: palette.blue[300],

  // Secondary — Purple
  secondary: palette.purple[500],
  secondaryDark: palette.purple[600],
  secondaryLight: palette.purple[300],

  // Accent — Cyan
  accent: palette.cyan[400],
  accentDark: palette.cyan[500],
  accentLight: palette.cyan[200],

  accentGradient: [palette.blue[600], palette.purple[600], palette.cyan[500]],
  shimmer: '#FFFFFF12',
  glow: palette.blue[500],
  glass: '#111827EB',
  glassBorder: '#FFFFFF20',
  onPrimary: '#FFFFFF',

  // Functional Colors — brighter on dark backgrounds for readability
  success: '#34D399',
  successDark: '#10B981',
  error: '#F87171',
  errorDark: '#EF4444',
  warning: '#FBBF24',
  warningDark: '#F59E0B',
  info: palette.blue[400],
  infoDark: palette.blue[500],
  danger: '#F87171',

  // Semantic status backgrounds (dark tinted surfaces)
  successBg: '#052E16',
  warningBg: '#2A2110',
  errorBg: '#2A1414',
  infoBg: '#0C1E3D',

  // Backgrounds — premium dark navy, never pure black
  background: palette.gray[950],
  backgroundSecondary: palette.gray[900],
  backgroundTertiary: palette.gray[800],

  // Text — off-white, never pure white
  text: '#F9FAFB',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textDisabled: palette.gray[600],
  textInverse: palette.gray[900],

  // UI Elements
  border: '#334155',
  borderLight: '#1E293B',
  divider: '#334155',
  card: palette.gray[800],
  cardElevated: '#243044',
  surface: palette.gray[900],

  // Interactive states
  ripple: 'rgba(59, 130, 246, 0.12)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Gradients (kept for backward compatibility; shared across headers and controls)
  gradients: {
    primary: [palette.blue[600], palette.blue[700], palette.blue[800]],
    secondary: [palette.purple[600], palette.purple[700]],
    success: ['#10B981', '#059669'],
    dark: [palette.gray[900], palette.gray[950]],
    warm: [palette.cyan[400], palette.cyan[500]],
    blue: [palette.blue[500], palette.blue[600]],
    premium: [palette.blue[700], palette.purple[700]],
    heroGradient: [palette.blue[700], palette.gray[950]],
  },

  // Legacy support
  white: palette.white,
  black: palette.black,
  disabled: palette.gray[600],
};

export default darkColors;
