import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

const LoadingScreen = () => {
    const { theme: dynamicTheme, isDark } = useTheme();
    const colors = dynamicTheme.colors;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.text, { color: colors.textPrimary }]}>Welcome to Get Fit</Text>
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>Preparing your fitness journey...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
    },
    subtext: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
    },
});

export default LoadingScreen;
