import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { format, parse, isValid } from 'date-fns';
import { theme } from '../../styles/theme';

/**
 * DatePickerInput - A date input component with calendar popup
 * 
 * Features:
 * - Displays a calendar modal for date selection
 * - Supports min/max date constraints
 * - Shows formatted date in the input field
 * - Consistent styling with other Input components
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the input
 * @param {string} props.value - Selected date in YYYY-MM-DD format
 * @param {Function} props.onDateChange - Callback when date is selected (receives YYYY-MM-DD string)
 * @param {string} props.placeholder - Placeholder text when no date selected
 * @param {string} props.minDate - Minimum selectable date (YYYY-MM-DD)
 * @param {string} props.maxDate - Maximum selectable date (YYYY-MM-DD)
 * @param {string} props.error - Error message to display
 * @param {string} props.helperText - Helper text to display below input
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {Object} props.style - Additional styles for container
 * @param {string} props.displayFormat - Date format for display (default: 'MMM dd, yyyy')
 */
export default function DatePickerInput({
    label,
    value,
    onDateChange,
    placeholder = 'Select date',
    minDate,
    maxDate,
    error,
    helperText,
    required = false,
    disabled = false,
    style,
    displayFormat = 'MMM dd, yyyy',
}) {
    const [showCalendar, setShowCalendar] = useState(false);

    // Format the date for display
    const getDisplayValue = () => {
        if (!value) return null;
        try {
            const date = parse(value, 'yyyy-MM-dd', new Date());
            if (isValid(date)) {
                return format(date, displayFormat);
            }
        } catch (e) {
            // Return the raw value if parsing fails
        }
        return value;
    };

    const displayValue = getDisplayValue();

    const handleDayPress = (day) => {
        onDateChange(day.dateString);
        setShowCalendar(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onDateChange('');
    };

    // Get today's date for default min if not specified
    const today = new Date().toISOString().split('T')[0];

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            <TouchableOpacity
                style={[
                    styles.inputWrapper,
                    error && styles.inputWrapperError,
                    disabled && styles.inputWrapperDisabled,
                ]}
                onPress={() => !disabled && setShowCalendar(true)}
                activeOpacity={disabled ? 1 : 0.7}
            >
                <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={disabled ? theme.colors.textTertiary : theme.colors.textSecondary}
                    style={styles.icon}
                />
                <Text
                    style={[
                        styles.inputText,
                        !displayValue && styles.placeholder,
                        disabled && styles.disabledText,
                    ]}
                >
                    {displayValue || placeholder}
                </Text>

                {value && !disabled ? (
                    <TouchableOpacity
                        onPress={handleClear}
                        style={styles.clearButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={theme.colors.textSecondary}
                        />
                    </TouchableOpacity>
                ) : (
                    <Ionicons
                        name="chevron-down"
                        size={18}
                        color={theme.colors.textSecondary}
                    />
                )}
            </TouchableOpacity>

            {error && (
                <Text style={styles.error}>{error}</Text>
            )}

            {helperText && !error && (
                <Text style={styles.helperText}>{helperText}</Text>
            )}

            {/* Calendar Modal */}
            <Modal
                visible={showCalendar}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCalendar(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCalendar(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {label || 'Select Date'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowCalendar(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={28} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Calendar
                            onDayPress={handleDayPress}
                            markedDates={
                                value
                                    ? {
                                        [value]: {
                                            selected: true,
                                            selectedColor: theme.colors.primary,
                                        },
                                    }
                                    : {}
                            }
                            minDate={minDate}
                            maxDate={maxDate}
                            theme={{
                                backgroundColor: theme.colors.background,
                                calendarBackground: theme.colors.background,
                                textSectionTitleColor: theme.colors.text,
                                selectedDayBackgroundColor: theme.colors.primary,
                                selectedDayTextColor: theme.colors.white,
                                todayTextColor: theme.colors.primary,
                                dayTextColor: theme.colors.text,
                                textDisabledColor: theme.colors.textTertiary,
                                dotColor: theme.colors.primary,
                                selectedDotColor: theme.colors.white,
                                arrowColor: theme.colors.primary,
                                monthTextColor: theme.colors.text,
                                textDayFontWeight: '400',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14,
                            }}
                        />

                        {/* Quick action buttons */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={() => {
                                    onDateChange(today);
                                    setShowCalendar(false);
                                }}
                            >
                                <Text style={styles.quickActionText}>Today</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickActionButton}
                                onPress={() => {
                                    onDateChange('');
                                    setShowCalendar(false);
                                }}
                            >
                                <Text style={styles.quickActionText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: theme.spacing[3],
    },
    label: {
        marginBottom: theme.spacing[2],
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    required: {
        color: theme.colors.error,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        minHeight: 48,
    },
    inputWrapperError: {
        borderColor: theme.colors.error,
        borderWidth: 2,
    },
    inputWrapperDisabled: {
        backgroundColor: theme.colors.backgroundSecondary,
        opacity: 0.7,
    },
    icon: {
        marginRight: theme.spacing[2],
    },
    inputText: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text,
    },
    placeholder: {
        color: theme.colors.textTertiary,
    },
    disabledText: {
        color: theme.colors.textSecondary,
    },
    clearButton: {
        padding: theme.spacing[1],
    },
    error: {
        color: theme.colors.error,
        marginTop: theme.spacing[1],
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    helperText: {
        color: theme.colors.textSecondary,
        marginTop: theme.spacing[1],
        fontSize: theme.typography.fontSize.xs,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text,
    },
    closeButton: {
        padding: theme.spacing[1],
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing[4],
        paddingVertical: theme.spacing[4],
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    quickActionButton: {
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[2],
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.full,
    },
    quickActionText: {
        color: theme.colors.primary,
        fontWeight: theme.typography.fontWeight.medium,
        fontSize: theme.typography.fontSize.sm,
    },
});
