import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function Loading({ inline = false, style }) {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  if (inline) {
    return (
      <View style={[styles.inline, style]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inline: { alignItems: 'center', justifyContent: 'center' },
});


