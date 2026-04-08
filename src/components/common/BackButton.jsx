import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

/**
 * BackButton - Uses navigation stack memory to go back to the previous screen.
 * Calls navigation.goBack() which returns to whatever screen the user came from.
 *
 * @param {string} color - Icon color (default: '#FFFFFF')
 * @param {number} size - Icon size (default: 24)
 * @param {string} iconName - Ionicons name (default: 'chevron-back')
 * @param {object} style - Additional button styles
 * @param {Function} onPress - Custom handler (overrides default goBack)
 */
export default function BackButton({
  color = '#FFFFFF',
  size = 24,
  iconName = 'chevron-back',
  style,
  onPress,
}) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name={iconName} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
