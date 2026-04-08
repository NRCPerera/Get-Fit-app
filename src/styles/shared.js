/**
 * Shared UI Styles and Utilities
 * Reusable style patterns for consistent design
 */

import { StyleSheet } from 'react-native';
import { theme } from './theme';

/**
 * Common screen container styles
 */
export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[12],
  },
  content: {
    padding: theme.spacing[6],
  },
});

/**
 * Common header styles
 */
export const headerStyles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
});

/**
 * Common card styles
 */
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    ...theme.shadows.md,
  },
  cardElevated: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    ...theme.shadows.lg,
  },
  cardOutlined: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});

/**
 * Common text styles
 */
export const textStyles = StyleSheet.create({
  body: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.md,
  },
  bodySecondary: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.md,
  },
  caption: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing[2],
  },
  link: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  error: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.medium,
  },
  success: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

/**
 * Common spacing utilities
 */
export const spacing = {
  // Vertical spacing between sections
  sectionGap: theme.spacing[6],
  // Gap between related items
  itemGap: theme.spacing[4],
  // Small gap between tightly related items
  tightGap: theme.spacing[2],
};

/**
 * Common layout utilities
 */
export const layout = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
};

/**
 * Helper function to create consistent card styles
 */
export const createCardStyle = (variant = 'default', padding = 'md') => {
  const paddingMap = {
    none: 0,
    sm: theme.spacing[2],
    md: theme.spacing[4],
    lg: theme.spacing[6],
  };

  const baseStyle = {
    borderRadius: theme.borderRadius.lg,
    padding: paddingMap[padding] || paddingMap.md,
    marginBottom: theme.spacing[4],
  };

  switch (variant) {
    case 'elevated':
      return {
        ...baseStyle,
        backgroundColor: theme.colors.background,
        ...theme.shadows.lg,
      };
    case 'outlined':
      return {
        ...baseStyle,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
      };
    case 'flat':
      return {
        ...baseStyle,
        backgroundColor: theme.colors.backgroundSecondary,
      };
    default:
      return {
        ...baseStyle,
        backgroundColor: theme.colors.background,
        ...theme.shadows.md,
      };
  }
};

