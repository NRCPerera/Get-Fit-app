import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { getInitials, getFileUrl } from '../../utils/helpers';

const sizeMap = { sm: 32, md: 44, lg: 64, xl: 88 };

export default function Avatar({ source, name, size = 'md' }) {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const dimension = sizeMap[size] || sizeMap.md;
  const borderRadius = dimension / 2;
  if (source) {
    const imageUri = getFileUrl(source) || source;
    return <Image source={{ uri: imageUri }} style={{ width: dimension, height: dimension, borderRadius }} />;
  }
  const initials = getInitials(name || '');
  return (
    <View style={[styles.placeholder, { width: dimension, height: dimension, borderRadius, backgroundColor: colors.primary + '20' }] }>
      <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
    </View>
  );
}

Avatar.propTypes = {
  source: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.oneOf(['sm','md','lg','xl']),
};

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: theme.typography.fontWeight.bold },
});
