import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { MotionView } from './Motion';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function EmptyState({ icon, title, message, actionLabel, onAction }) {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {icon ? <MotionView pulse style={[styles.icon, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '20' }]}>{icon}</MotionView> : null}
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.cta}>
          <Button title={actionLabel} onPress={onAction} variant="primary" />
        </View>
      ) : null}
    </View>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.element,
  title: PropTypes.string,
  message: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  icon: { marginBottom: theme.spacing.lg, padding: 24, borderRadius: 9999, borderWidth: 1 },
  title: { fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, textAlign: 'center' },
  message: { lineHeight: 24, maxWidth: 340, marginTop: theme.spacing.sm, fontSize: theme.typography.fontSize.md, textAlign: 'center' },
  cta: { marginTop: theme.spacing.lg, width: '100%' },
});


