/**
 * Design System - Red, Gold, Black & White
 * Premium athletic aesthetic with dark mode support
 * 
 * NOTE: This file is kept for backward compatibility.
 * New code should import from '../themes' instead.
 * 
 * For dynamic theming, use:
 *   import { useTheme } from '../context/ThemeContext';
 *   const { theme } = useTheme();
 *   const colors = theme.colors;
 */

// Re-export everything from the new themes folder
export {
  lightColors,
  darkColors,
  lightTheme,
  darkTheme,
  getTheme,
  typography,
  spacing,
  borderRadius,
  getShadows,
} from '../themes';

// Import for local use
import {
  lightColors,
  lightTheme,
  getShadows,
} from '../themes';

// Default shadows for light mode (backward compatibility)
export const shadows = getShadows(false);

// Export colors as default light mode (backward compatibility)
export const colors = lightColors;

// Default theme export (light mode for backward compatibility)
// This is used by static StyleSheet definitions that need layout values
export const theme = lightTheme;
