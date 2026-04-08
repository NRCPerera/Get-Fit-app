import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const ThemeSelector = () => {
    const { theme, isDark, toggleTheme, themeMode, setThemeMode } = useTheme();
    const { colors, spacing, typography, borderRadius } = theme;

    const options = [
        { key: 'light', label: 'Light', icon: 'sunny' },
        { key: 'dark', label: 'Dark', icon: 'moon' },
        { key: 'system', label: 'System', icon: 'phone-portrait' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Appearance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Choose your preferred theme
            </Text>

            <View style={[styles.optionsContainer, { backgroundColor: colors.backgroundSecondary }]}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.option,
                            {
                                backgroundColor: themeMode === option.key ? colors.primary : 'transparent',
                                borderRadius: borderRadius.md,
                            },
                        ]}
                        onPress={() => setThemeMode(option.key)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={option.icon}
                            size={24}
                            color={themeMode === option.key ? colors.white : colors.textSecondary}
                        />
                        <Text
                            style={[
                                styles.optionText,
                                {
                                    color: themeMode === option.key ? colors.white : colors.text,
                                },
                            ]}
                        >
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Quick Toggle */}
            <View style={[styles.toggleContainer, { borderTopColor: colors.border }]}>
                <View style={styles.toggleLeft}>
                    <Ionicons
                        name={isDark ? 'moon' : 'sunny'}
                        size={24}
                        color={isDark ? colors.secondary : colors.primary}
                    />
                    <Text style={[styles.toggleLabel, { color: colors.text }]}>
                        Dark Mode
                    </Text>
                </View>
                <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={isDark ? colors.secondary : colors.white}
                    ios_backgroundColor={colors.border}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    optionsContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
        gap: 4,
    },
    option: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        marginTop: 20,
        borderTopWidth: 1,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ThemeSelector;
