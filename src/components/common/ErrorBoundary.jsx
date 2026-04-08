import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { theme } from '../../styles/theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log error to monitoring here if desired
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message || 'An unexpected error occurred.'}</Text>
          <Button title="Reload" onPress={this.handleReload} variant="primary" style={styles.button} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg, backgroundColor: theme.colors.background },
  title: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  message: { fontSize: theme.typography.fontSize.md, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: theme.spacing.lg },
  button: { width: '60%' },
});


