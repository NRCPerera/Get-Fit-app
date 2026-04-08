/**
 * Dynamic Styles Hook
 * 
 * This hook provides theme-aware styles for all screens.
 * Import and use this instead of static StyleSheet for automatic dark mode support.
 * 
 * Usage:
 * import { useStyles } from '../../styles/useStyles';
 * 
 * const MyScreen = () => {
 *   const { styles, colors, isDark } = useStyles();
 *   return <View style={styles.container}>...</View>;
 * };
 */

import { useMemo } from 'react';
import { StyleSheet, Platform, StatusBar } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { theme } from './theme';

export const useStyles = () => {
    const { theme: dynamicTheme, isDark } = useTheme();
    const colors = dynamicTheme.colors;
    const shadows = dynamicTheme.shadows;

    const styles = useMemo(() => StyleSheet.create({
        // ============================================
        // SCREEN CONTAINERS
        // ============================================
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        safeArea: {
            flex: 1,
            backgroundColor: colors.background,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },
        scrollContent: {
            flexGrow: 1,
            padding: theme.spacing[4],
            paddingBottom: theme.spacing[8],
        },
        centeredContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
        },

        // ============================================
        // HEADERS
        // ============================================
        headerContainer: {
            marginBottom: theme.spacing[6],
        },
        headerTitle: {
            fontSize: theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: colors.text,
            marginBottom: theme.spacing[1],
        },
        headerSubtitle: {
            fontSize: theme.typography.fontSize.md,
            color: colors.textSecondary,
            lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
        },
        sectionTitle: {
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: colors.text,
            marginBottom: theme.spacing[4],
        },
        sectionSubtitle: {
            fontSize: theme.typography.fontSize.sm,
            color: colors.textSecondary,
            marginTop: -theme.spacing[3],
            marginBottom: theme.spacing[4],
        },

        // ============================================
        // CARDS
        // ============================================
        card: {
            backgroundColor: colors.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            ...shadows.md,
        },
        cardElevated: {
            backgroundColor: colors.cardElevated,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            ...shadows.lg,
        },
        cardOutlined: {
            backgroundColor: colors.card,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            borderWidth: 1,
            borderColor: colors.border,
        },
        cardFlat: {
            backgroundColor: colors.backgroundSecondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
        },

        // ============================================
        // TEXT STYLES
        // ============================================
        text: {
            color: colors.text,
            fontSize: theme.typography.fontSize.md,
        },
        textSecondary: {
            color: colors.textSecondary,
            fontSize: theme.typography.fontSize.md,
        },
        textTertiary: {
            color: colors.textTertiary,
            fontSize: theme.typography.fontSize.sm,
        },
        textPrimary: {
            color: colors.primary,
            fontSize: theme.typography.fontSize.md,
        },
        textBold: {
            color: colors.text,
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.bold,
        },
        textSmall: {
            color: colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
        },
        textLarge: {
            color: colors.text,
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
        },
        textXLarge: {
            color: colors.text,
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
        },
        label: {
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: colors.text,
            marginBottom: theme.spacing[2],
        },

        // ============================================
        // BUTTONS & TOUCHABLES
        // ============================================
        touchable: {
            activeOpacity: 0.7,
        },
        iconButton: {
            width: 44,
            height: 44,
            borderRadius: theme.borderRadius.full,
            backgroundColor: colors.backgroundSecondary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconButtonPrimary: {
            width: 44,
            height: 44,
            borderRadius: theme.borderRadius.full,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        linkButton: {
            paddingVertical: theme.spacing[2],
        },
        linkText: {
            color: colors.primary,
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.semibold,
        },

        // ============================================
        // FORM ELEMENTS
        // ============================================
        inputContainer: {
            marginBottom: theme.spacing[4],
        },
        inputLabel: {
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: colors.text,
            marginBottom: theme.spacing[2],
        },
        input: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[3],
            fontSize: theme.typography.fontSize.md,
            color: colors.text,
        },
        inputFocused: {
            borderColor: colors.primary,
            borderWidth: 2,
        },
        inputError: {
            borderColor: colors.error,
        },
        errorText: {
            color: colors.error,
            fontSize: theme.typography.fontSize.sm,
            marginTop: theme.spacing[1],
        },
        helperText: {
            color: colors.textSecondary,
            fontSize: theme.typography.fontSize.xs,
            marginTop: theme.spacing[1],
        },

        // ============================================
        // LISTS
        // ============================================
        listItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing[3],
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        listItemContent: {
            flex: 1,
            marginLeft: theme.spacing[3],
        },
        listItemTitle: {
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.medium,
            color: colors.text,
        },
        listItemSubtitle: {
            fontSize: theme.typography.fontSize.sm,
            color: colors.textSecondary,
            marginTop: theme.spacing[1],
        },
        listItemIcon: {
            width: 40,
            height: 40,
            borderRadius: theme.borderRadius.full,
            backgroundColor: colors.backgroundSecondary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        listItemChevron: {
            marginLeft: theme.spacing[2],
        },

        // ============================================
        // AVATARS & IMAGES
        // ============================================
        avatarSmall: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.backgroundSecondary,
        },
        avatarMedium: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.backgroundSecondary,
        },
        avatarLarge: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.backgroundSecondary,
        },
        avatarXLarge: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.backgroundSecondary,
        },
        avatarPlaceholder: {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary + '20',
        },
        avatarText: {
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: colors.primary,
        },

        // ============================================
        // BADGES & CHIPS
        // ============================================
        badge: {
            paddingHorizontal: theme.spacing[2],
            paddingVertical: theme.spacing[1],
            borderRadius: theme.borderRadius.full,
            backgroundColor: colors.primary + '15',
        },
        badgeText: {
            fontSize: theme.typography.fontSize.xs,
            fontWeight: theme.typography.fontWeight.semibold,
            color: colors.primary,
        },
        badgeSuccess: {
            backgroundColor: colors.success + '15',
        },
        badgeSuccessText: {
            color: colors.success,
        },
        badgeWarning: {
            backgroundColor: colors.warning + '15',
        },
        badgeWarningText: {
            color: colors.warning,
        },
        badgeError: {
            backgroundColor: colors.error + '15',
        },
        badgeErrorText: {
            color: colors.error,
        },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            borderRadius: theme.borderRadius.full,
            backgroundColor: colors.backgroundSecondary,
            gap: theme.spacing[1],
        },
        chipText: {
            fontSize: theme.typography.fontSize.sm,
            color: colors.text,
        },
        chipSelected: {
            backgroundColor: colors.primary,
        },
        chipSelectedText: {
            color: colors.white,
        },

        // ============================================
        // DIVIDERS
        // ============================================
        divider: {
            height: 1,
            backgroundColor: colors.divider,
            marginVertical: theme.spacing[4],
        },
        dividerLight: {
            height: 1,
            backgroundColor: colors.borderLight,
            marginVertical: theme.spacing[2],
        },

        // ============================================
        // LOADING & EMPTY STATES
        // ============================================
        loadingContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
            gap: theme.spacing[4],
        },
        loadingText: {
            fontSize: theme.typography.fontSize.md,
            color: colors.textSecondary,
        },
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing[8],
        },
        emptyIcon: {
            marginBottom: theme.spacing[4],
        },
        emptyTitle: {
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
        },
        emptySubtitle: {
            fontSize: theme.typography.fontSize.md,
            color: colors.textSecondary,
            textAlign: 'center',
        },

        // ============================================
        // ALERTS & MESSAGES
        // ============================================
        alertContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing[3],
            borderRadius: theme.borderRadius.md,
            gap: theme.spacing[2],
        },
        alertSuccess: {
            backgroundColor: colors.success + '15',
        },
        alertSuccessText: {
            color: colors.success,
            flex: 1,
        },
        alertError: {
            backgroundColor: colors.error + '15',
        },
        alertErrorText: {
            color: colors.error,
            flex: 1,
        },
        alertWarning: {
            backgroundColor: colors.warning + '15',
        },
        alertWarningText: {
            color: colors.warning,
            flex: 1,
        },
        alertInfo: {
            backgroundColor: colors.info + '15',
        },
        alertInfoText: {
            color: colors.info,
            flex: 1,
        },

        // ============================================
        // MODAL & OVERLAYS
        // ============================================
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: colors.card,
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing[6],
            width: '90%',
            maxWidth: 400,
            ...shadows.xl,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing[4],
        },
        modalTitle: {
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: colors.text,
        },
        modalBody: {
            marginBottom: theme.spacing[4],
        },
        modalFooter: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: theme.spacing[3],
        },

        // ============================================
        // STATS & METRICS
        // ============================================
        statsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: theme.spacing[4],
        },
        statItem: {
            alignItems: 'center',
        },
        statValue: {
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: colors.text,
        },
        statLabel: {
            fontSize: theme.typography.fontSize.sm,
            color: colors.textSecondary,
            marginTop: theme.spacing[1],
        },

        // ============================================
        // ROWS & LAYOUTS
        // ============================================
        row: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        rowSpaceBetween: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        rowCenter: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        column: {
            flexDirection: 'column',
        },
        columnCenter: {
            flexDirection: 'column',
            alignItems: 'center',
        },
        flex1: {
            flex: 1,
        },
        gap1: { gap: theme.spacing[1] },
        gap2: { gap: theme.spacing[2] },
        gap3: { gap: theme.spacing[3] },
        gap4: { gap: theme.spacing[4] },

        // ============================================
        // MARGINS & PADDING HELPERS
        // ============================================
        mb2: { marginBottom: theme.spacing[2] },
        mb3: { marginBottom: theme.spacing[3] },
        mb4: { marginBottom: theme.spacing[4] },
        mb6: { marginBottom: theme.spacing[6] },
        mt2: { marginTop: theme.spacing[2] },
        mt3: { marginTop: theme.spacing[3] },
        mt4: { marginTop: theme.spacing[4] },
        p2: { padding: theme.spacing[2] },
        p3: { padding: theme.spacing[3] },
        p4: { padding: theme.spacing[4] },
        px4: { paddingHorizontal: theme.spacing[4] },
        py4: { paddingVertical: theme.spacing[4] },

        // ============================================
        // SPECIAL COMPONENTS
        // ============================================
        gradientHeader: {
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + theme.spacing[4] : theme.spacing[4],
            paddingBottom: theme.spacing[6],
            paddingHorizontal: theme.spacing[4],
        },
        floatingActionButton: {
            position: 'absolute',
            right: theme.spacing[4],
            bottom: theme.spacing[4],
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...shadows.lg,
        },
        searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: theme.borderRadius.lg,
            paddingHorizontal: theme.spacing[4],
            height: 48,
            gap: theme.spacing[2],
        },
        searchInput: {
            flex: 1,
            fontSize: theme.typography.fontSize.md,
            color: colors.text,
        },
        tabBar: {
            flexDirection: 'row',
            backgroundColor: colors.backgroundSecondary,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[1],
        },
        tab: {
            flex: 1,
            paddingVertical: theme.spacing[2],
            alignItems: 'center',
            borderRadius: theme.borderRadius.md,
        },
        tabActive: {
            backgroundColor: colors.card,
            ...shadows.sm,
        },
        tabText: {
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: colors.textSecondary,
        },
        tabTextActive: {
            color: colors.primary,
            fontWeight: theme.typography.fontWeight.semibold,
        },
    }), [colors, shadows, isDark]);

    return {
        styles,
        colors,
        isDark,
        theme: dynamicTheme,
        spacing: theme.spacing,
        typography: theme.typography,
        borderRadius: theme.borderRadius,
    };
};

export default useStyles;
