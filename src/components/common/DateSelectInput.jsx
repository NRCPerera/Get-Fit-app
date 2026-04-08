import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

const MONTHS = [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' }
];

const DateSelectInput = ({
    label,
    value,
    onChange,
    error,
    labelStyle
}) => {
    const { theme: dynamicTheme } = useTheme();
    const colors = dynamicTheme.colors;
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showDayPicker, setShowDayPicker] = useState(false);

    // Parse current value
    const parseDate = (dateString) => {
        if (!dateString) return { year: '', month: '', day: '' };
        const parts = dateString.split('-');
        if (parts.length !== 3) return { year: '', month: '', day: '' };
        return { year: parts[0], month: parts[1], day: parts[2] };
    };

    const { year, month, day } = parseDate(value);

    // Generate ranges
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

    const getDaysInMonth = (y, m) => {
        if (!y || !m) return 31;
        return new Date(parseInt(y), parseInt(m), 0).getDate();
    };

    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const handleYearChange = (selectedYear) => {
        // If selecting a year, and current selected day is invalid for new month/year (e.g. Feb 29), adjust day
        const newMaxDays = getDaysInMonth(selectedYear, month || '01');
        let newDay = day;
        if (day && parseInt(day) > newMaxDays) {
            newDay = newMaxDays.toString().padStart(2, '0');
        }

        onChange(`${selectedYear}-${month || '01'}-${newDay || '01'}`);
        setShowYearPicker(false);
    };

    const handleMonthChange = (selectedMonth) => {
        const newMaxDays = getDaysInMonth(year || currentYear, selectedMonth);
        let newDay = day;
        if (day && parseInt(day) > newMaxDays) {
            newDay = newMaxDays.toString().padStart(2, '0');
        }

        onChange(`${year || currentYear}-${selectedMonth}-${newDay || '01'}`);
        setShowMonthPicker(false);
    };

    const handleDayChange = (selectedDay) => {
        onChange(`${year || currentYear}-${month || '01'}-${selectedDay}`);
        setShowDayPicker(false);
    };

    const PickerModal = ({ visible, data, onSelect, onClose, title, displayKey = null }) => (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => (displayKey ? item.value : item)}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.pickerItem, { borderBottomColor: colors.border + '40' }]}
                                onPress={() => onSelect(displayKey ? item.value : item)}
                            >
                                <Text style={[styles.pickerItemText, { color: colors.text }]}>
                                    {displayKey ? item.label : item}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, { color: colors.text }, labelStyle]}>{label}</Text>}

            <View style={styles.selectorsContainer}>
                {/* Year Selector */}
                <TouchableOpacity
                    style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }, error && { borderColor: colors.error }]}
                    onPress={() => setShowYearPicker(true)}
                >
                    <Text style={[styles.selectorText, { color: colors.text }, !year && { color: colors.textTertiary }]}>
                        {year || 'Year'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Month Selector */}
                <TouchableOpacity
                    style={[styles.selector, styles.monthSelector, { backgroundColor: colors.surface, borderColor: colors.border }, error && { borderColor: colors.error }]}
                    onPress={() => setShowMonthPicker(true)}
                >
                    <Text style={[styles.selectorText, { color: colors.text }, !month && { color: colors.textTertiary }]}>
                        {month ? MONTHS.find(m => m.value === month)?.label : 'Month'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {/* Day Selector */}
                <TouchableOpacity
                    style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }, error && { borderColor: colors.error }]}
                    onPress={() => setShowDayPicker(true)}
                >
                    <Text style={[styles.selectorText, { color: colors.text }, !day && { color: colors.textTertiary }]}>
                        {day || 'Day'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

            <PickerModal
                visible={showYearPicker}
                data={years}
                title="Select Year"
                onSelect={handleYearChange}
                onClose={() => setShowYearPicker(false)}
            />

            <PickerModal
                visible={showMonthPicker}
                data={MONTHS}
                displayKey="label"
                title="Select Month"
                onSelect={handleMonthChange}
                onClose={() => setShowMonthPicker(false)}
            />

            <PickerModal
                visible={showDayPicker}
                data={days}
                title="Select Day"
                onSelect={handleDayChange}
                onClose={() => setShowDayPicker(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing[4],
    },
    label: {
        marginBottom: theme.spacing[2],
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    selectorsContainer: {
        flexDirection: 'row',
        gap: theme.spacing[2],
    },
    selector: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48, // Match input height (md)
        paddingHorizontal: theme.spacing[3],
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
    },
    monthSelector: {
        flex: 1.5, // Give month slightly more space
    },
    selectorError: {
        borderColor: theme.colors.error,
    },
    selectorText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text,
    },
    placeholderText: {
        color: theme.colors.textTertiary,
    },
    errorText: {
        color: theme.colors.error,
        marginTop: theme.spacing[1],
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: theme.borderRadius['2xl'],
        borderTopRightRadius: theme.borderRadius['2xl'],
        maxHeight: '50%',
        padding: theme.spacing[4],
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing[4],
        paddingBottom: theme.spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text,
    },
    pickerItem: {
        paddingVertical: theme.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border + '40',
    },
    pickerItemText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text,
        textAlign: 'center',
    },
});

export default DateSelectInput;
