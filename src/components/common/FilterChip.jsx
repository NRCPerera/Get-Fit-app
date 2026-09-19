import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function FilterChip({ label, selected = false, onPress, style }) {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.backgroundSecondary, borderColor: selected ? colors.primary : colors.border }, style]}>
      <Text style={[styles.text, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

FilterChip.propTypes = {
  label: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  onPress: PropTypes.func,
};

const styles = StyleSheet.create({
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: theme.borderRadius.round, borderWidth: 1, marginRight: theme.spacing.sm },
  text: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.medium },
});
