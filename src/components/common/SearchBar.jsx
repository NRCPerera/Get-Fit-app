import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search', onClear, debounceMs = 400, style }) {
  const [text, setText] = useState(value || '');
  useEffect(() => { setText(value || ''); }, [value]);
  useEffect(() => {
    const id = setTimeout(() => onChangeText?.(text), debounceMs);
    return () => clearTimeout(id);
  }, [text]);
  const handleClear = () => { setText(''); onClear?.(); onChangeText?.(''); };
  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={text}
        onChangeText={setText}
        returnKeyType="search"
      />
      {!!text && (
        <TouchableOpacity onPress={handleClear} style={styles.clear}>
          {/* Simple clear icon */}
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
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.lg, paddingHorizontal: theme.spacing.md, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border },
  input: { flex: 1, color: theme.colors.text, fontSize: theme.typography.fontSize.md },
  clear: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.disabled },
});


