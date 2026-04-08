import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

/**
 * GradientCard - An attractive card with gradient background
 * 
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Card subtitle
 * @param {string} props.icon - Ionicon name
 * @param {string} props.value - Large value to display
 * @param {string} props.valueLabel - Label for the value
 * @param {string[]} props.colors - Gradient colors array
 * @param {Function} props.onPress - Press handler
 * @param {Object} props.style - Additional styles
 * @param {string} props.variant - 'primary' | 'secondary' | 'success' | 'warning' | 'info'
 */
export default function GradientCard({
    title,
    subtitle,
    icon,
    value,
    valueLabel,
    colors,
    onPress,
    style,
    variant = 'primary',
    children,
}) {
    const gradientColors = colors || getGradientColors(variant);

    const content = (
        <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, style]}
        >
            <View style={styles.content}>
                {icon && (
                    <View style={styles.iconContainer}>
                        <Ionicons name={icon} size={28} color="rgba(255,255,255,0.9)" />
                    </View>
                )}

                <View style={styles.textContainer}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>

                {(value !== undefined || valueLabel) && (
                    <View style={styles.valueContainer}>
                        {value !== undefined && <Text style={styles.value}>{value}</Text>}
                        {valueLabel && <Text style={styles.valueLabel}>{valueLabel}</Text>}
                    </View>
                )}

                {children}
            </View>

            {/* Decorative elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
        </LinearGradient>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const getGradientColors = (variant) => {
    switch (variant) {
        case 'primary':
            return ['#4C6EF5', '#748FFC', '#91A7FF'];
        case 'secondary':
            return ['#15AABF', '#22B8CF', '#3BC9DB'];
        case 'success':
            return ['#37B24D', '#51CF66', '#69DB7C'];
        case 'warning':
            return ['#F59F00', '#FCC419', '#FFE066'];
        case 'info':
            return ['#1C7ED6', '#339AF0', '#4DABF7'];
        case 'purple':
            return ['#7950F2', '#9775FA', '#B197FC'];
        case 'pink':
            return ['#E64980', '#F06595', '#F783AC'];
        case 'dark':
            return ['#212529', '#343A40', '#495057'];
        default:
            return ['#4C6EF5', '#748FFC', '#91A7FF'];
    }
};

const styles = StyleSheet.create({
    gradient: {
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing[5],
        overflow: 'hidden',
        position: 'relative',
        ...theme.shadows.lg,
    },
    content: {
        zIndex: 1,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing[3],
    },
    textContainer: {
        marginBottom: theme.spacing[2],
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#FFFFFF',
        marginBottom: theme.spacing[1],
    },
    subtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    },
    valueContainer: {
        marginTop: theme.spacing[2],
    },
    value: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: '#FFFFFF',
    },
    valueLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: 'rgba(255,255,255,0.85)',
        marginTop: theme.spacing[1],
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: -40,
        right: -40,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.08)',
        bottom: -20,
        left: -20,
    },
});
