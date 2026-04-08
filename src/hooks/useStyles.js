/**
 * useStyles Hook
 * Returns dynamically themed styles based on current theme mode
 */

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Hook to get common screen styles with dynamic theming
 */
export const useScreenStyles = () => {
    const { theme } = useTheme();

    return useMemo(() => StyleSheet.create({
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
    }), [theme]);
};

/**
 * Hook to get common header styles with dynamic theming
 */
export const useHeaderStyles = () => {
    const { theme } = useTheme();

    return useMemo(() => StyleSheet.create({
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
    }), [theme]);
};

/**
 * Hook to get common card styles with dynamic theming
 */
export const useCardStyles = () => {
    const { theme } = useTheme();

    return useMemo(() => StyleSheet.create({
        card: {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            ...theme.shadows.md,
        },
        cardElevated: {
            backgroundColor: theme.colors.cardElevated,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            ...theme.shadows.lg,
        },
        cardOutlined: {
            backgroundColor: theme.colors.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
    }), [theme]);
};

/**
 * Hook to get common text styles with dynamic theming
 */
export const useTextStyles = () => {
    const { theme } = useTheme();

    return useMemo(() => StyleSheet.create({
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
    }), [theme]);
};

/**
 * Combined hook for all common styles
 */
export const useAppStyles = () => {
    const { theme, isDark } = useTheme();
    const screenStyles = useScreenStyles();
    const headerStyles = useHeaderStyles();
    const cardStyles = useCardStyles();
    const textStyles = useTextStyles();

    return {
        theme,
        isDark,
        screenStyles,
        headerStyles,
        cardStyles,
        textStyles,
    };
};

export default useAppStyles;
