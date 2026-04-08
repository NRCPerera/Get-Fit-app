import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';

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

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            navigation.goBack();
        }
    };

    const iconColor = backIconColor || theme.colors.text;

    return (
        <View style={[styles.container, transparent && styles.transparent, style]}>
            <StatusBar barStyle="dark-content" backgroundColor={transparent ? 'transparent' : theme.colors.background} />

            <View style={styles.content}>
                {/* Left side - Back button */}
                <View style={styles.leftContainer}>
                    {showBackButton && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBackPress}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View style={styles.backButtonInner}>
                                <Ionicons name="chevron-back" size={24} color={iconColor} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center - Title */}
                <View style={styles.centerContainer}>
                    {title && (
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                    )}
                    {subtitle && (
                        <Text style={styles.subtitle} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>

                {/* Right side - Optional action */}
                <View style={styles.rightContainer}>
                    {rightComponent}
                    {!rightComponent && rightIcon && onRightPress && (
                        <TouchableOpacity
                            style={styles.rightButton}
                            onPress={onRightPress}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name={rightIcon} size={24} color={theme.colors.text} />
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
        borderBottomWidth: 1,
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
