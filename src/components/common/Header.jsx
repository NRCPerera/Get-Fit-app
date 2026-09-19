import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

export default function Header({ title, showBack = false, onBack, rightComponent }) {
  const navigation = useNavigation();
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation.canGoBack()) navigation.goBack();
  };
  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
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
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, borderBottomWidth: 1 },
  left: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: theme.spacing.sm, paddingHorizontal: 6, paddingVertical: 2 },
  title: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
