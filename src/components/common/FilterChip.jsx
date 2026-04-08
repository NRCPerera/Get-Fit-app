import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function FilterChip({ label, selected = false, onPress, style }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.chip, { backgroundColor: selected ? theme.colors.primary : theme.colors.backgroundSecondary, borderColor: selected ? theme.colors.primary : theme.colors.border }, style]}>
      <Text style={[styles.text, { color: selected ? '#fff' : theme.colors.text }]}>{label}</Text>
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


