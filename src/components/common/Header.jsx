import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';

export default function Header({ title, showBack = false, onBack, rightComponent }) {
  const navigation = useNavigation();
  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation.canGoBack()) navigation.goBack();
  };
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>{'‹'}</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>{rightComponent || null}</View>
    </View>
  );
}

Header.propTypes = {
  title: PropTypes.string,
  showBack: PropTypes.bool,
  onBack: PropTypes.func,
  rightComponent: PropTypes.element,
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.background, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  left: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: theme.spacing.sm, paddingHorizontal: 6, paddingVertical: 2 },
  backText: { fontSize: 28, color: theme.colors.text },
  title: { fontSize: theme.typography.fontSize.lg, color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold },
  right: { minWidth: 40, alignItems: 'flex-end' },
});


