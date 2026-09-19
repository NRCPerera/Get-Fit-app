import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { MotionView } from './Motion';

export default function Loading({ inline = false, style }) {
  const { theme } = useTheme();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading" accessibilityState={{ busy: true }}
      style={[styles.container, !inline && { flex: 1, backgroundColor: theme.colors.background }, style]}>
      <MotionView style={styles.container}>
        <MotionView pulse style={[styles.icon, { backgroundColor: theme.colors.primary + '12' }, inline && { width: 36, height: 36 }]}>
          <Ionicons name="fitness" size={inline ? 22 : 36} color={theme.colors.primary} />
        </MotionView>
        {!inline && <Text style={[styles.text, { color: theme.colors.textSecondary }]}>Getting things ready...</Text>}
      </MotionView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  icon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  text: { marginTop: 18, fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
});
