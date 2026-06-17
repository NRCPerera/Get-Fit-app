import React from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    StyleSheet,
    View,
    RefreshControl,
} from 'react-native';
import { theme } from '../../styles/theme';

/**
 * KeyboardAvoidingWrapper - A reusable wrapper for forms that handles keyboard avoidance
 * 
 * Features:
 * - Automatically adjusts view when keyboard appears
 * - Includes ScrollView for scrollable content
 * - Supports pull-to-refresh
 * - Proper padding for iOS notch and Android status bar
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {Object} props.style - Additional styles for container
 * @param {Object} props.contentContainerStyle - Additional styles for scroll content
 * @param {boolean} props.refreshing - Whether the refresh indicator is showing
 * @param {Function} props.onRefresh - Callback for pull-to-refresh
 * @param {number} props.keyboardVerticalOffset - Additional offset for keyboard (default: 0)
 * @param {boolean} props.scrollEnabled - Whether scrolling is enabled (default: true)
 * @param {string} props.behavior - KeyboardAvoidingView behavior (default: 'padding' on iOS, 'height' on Android)
 */
export default function KeyboardAvoidingWrapper({
    children,
    style,
    contentContainerStyle,
    refreshing = false,
    onRefresh,
    keyboardVerticalOffset = 0,
    scrollEnabled = true,
    behavior,
    showsVerticalScrollIndicator = false,
    backgroundColor,
    keyboardShouldPersistTaps = 'handled',
    keyboardDismissMode,
}) {
    // Determine behavior based on platform
    const keyboardBehavior = behavior || (Platform.OS === 'ios' ? 'padding' : 'height');
    const dismissMode = keyboardDismissMode || (Platform.OS === 'ios' ? 'interactive' : 'on-drag');

    // Calculate offset - iOS needs more offset due to navigation headers
    const offset = Platform.OS === 'ios' ? 90 + keyboardVerticalOffset : keyboardVerticalOffset;

    return (
        <KeyboardAvoidingView
            style={[styles.container, backgroundColor && { backgroundColor }, style]}
            behavior={keyboardBehavior}
            keyboardVerticalOffset={offset}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
                keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                keyboardDismissMode={dismissMode}
                contentInsetAdjustmentBehavior="automatic"
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                scrollEnabled={scrollEnabled}
                bounces={true}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                            colors={[theme.colors.primary]}
                        />
                    ) : undefined
                }
            >
                <View style={styles.contentWrapper}>
                    {children}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing[6], // Extra padding at bottom for keyboard
    },
    contentWrapper: {
        flex: 1,
    },
});
