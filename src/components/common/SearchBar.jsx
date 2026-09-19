import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function SearchBar({ value, onChangeText, placeholder = 'Search', onClear, debounceMs = 400, style }) {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const [text, setText] = useState(value || '');
  useEffect(() => { setText(value || ''); }, [value]);
  useEffect(() => {
    const id = setTimeout(() => onChangeText?.(text), debounceMs);
    return () => clearTimeout(id);
  }, [text]);
  const handleClear = () => { setText(''); onClear?.(); onChangeText?.(''); };
  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, style]}>
      <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={text}
        onChangeText={setText}
        returnKeyType="search"
      />
      {!!text && (
        <TouchableOpacity onPress={handleClear} style={[styles.clear, { backgroundColor: colors.disabled }]}>
          <Ionicons name="close" size={12} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  placeholder: PropTypes.string,
  onClear: PropTypes.func,
  debounceMs: PropTypes.number,
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.md, paddingVertical: 10, borderWidth: 1 },
  searchIcon: { marginRight: theme.spacing.sm },
  input: { flex: 1, fontSize: theme.typography.fontSize.md },
  clear: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
