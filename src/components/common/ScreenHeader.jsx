import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { glassmorphism } from '../../styles/shared';

/**
 * ScreenHeader - A reusable header component with back button
 * 
 * Features:
 * - Consistent back button across all screens
 * - Optional title and subtitle
 * - Optional right action button
 * - Safe area aware
 * 
 * @param {Object} props
 * @param {string} props.title - Main title text
 * @param {string} props.subtitle - Optional subtitle text
 * @param {boolean} props.showBackButton - Whether to show back button (default: true)
 * @param {Function} props.onBackPress - Custom back button handler (default: navigation.goBack)
 * @param {React.ReactNode} props.rightComponent - Optional component for right side
 * @param {string} props.rightIcon - Optional icon name for right button
 * @param {Function} props.onRightPress - Handler for right button press
 * @param {Object} props.style - Additional container styles
 * @param {boolean} props.transparent - Make header background transparent
 * @param {string} props.backIconColor - Color for back icon
 */
export default function ScreenHeader({
    title,
    subtitle,
    showBackButton = true,
    onBackPress,
    rightComponent,
    rightIcon,
    onRightPress,
    style,
    transparent = false,
    backIconColor,
}) {
    const navigation = useNavigation();
    const { theme: activeTheme, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const colors = activeTheme.colors;

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    const iconColor = backIconColor || colors.text;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }, !transparent && activeTheme.shadows.sm, transparent && styles.transparent, style]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={transparent ? 'transparent' : colors.background} />

            <View style={styles.content}>
                {/* Left side - Back button */}
                <View style={styles.leftContainer}>
                    {Boolean(showBackButton) && (
                        <TouchableOpacity
                            style={styles.backButton}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            onPress={handleBackPress}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View style={[styles.backButtonInner, glassmorphism(activeTheme)]}>
                                <Ionicons name="chevron-back" size={24} color={iconColor} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center - Title */}
                <View style={styles.centerContainer}>
                    {Boolean(title) && (
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                            {title}
                        </Text>
                    )}
                    {Boolean(subtitle) && (
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                {/* Right side - Optional action */}
                <View style={styles.rightContainer}>
                    {rightComponent}
                    {Boolean(!rightComponent && rightIcon && onRightPress) && (
                        <TouchableOpacity
                            style={styles.rightButton}
                            onPress={onRightPress}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name={rightIcon} size={24} color={colors.text} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
        paddingHorizontal: theme.spacing[4],
        paddingBottom: theme.spacing[3],
        borderBottomWidth: 0,
        borderBottomColor: theme.colors.border,
    },
    transparent: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
    },
    leftContainer: {
        width: 44,
        alignItems: 'flex-start',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonInner: {
        width: 36,
        height: 36,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 2,
        textAlign: 'center',
    },
    rightContainer: {
        width: 44,
        alignItems: 'flex-end',
    },
    rightButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
