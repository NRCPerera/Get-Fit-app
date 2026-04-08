/**
 * Custom hook for safe area insets
 * Provides consistent safe area handling across all screens
 */

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';

/**
 * Hook that returns safe area insets with fallback values for Android
 * @returns {Object} Safe area insets with top, bottom, left, right values
 */
export const useSafeArea = () => {
    const insets = useSafeAreaInsets();

    return {
        top: insets.top || (Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0),
        bottom: insets.bottom || 0,
        left: insets.left || 0,
        right: insets.right || 0,
    };
};

/**
 * Get minimum header padding top for screens with custom headers
 * This ensures the header clears the notch/status bar area
 */
export const getHeaderPaddingTop = (insetTop) => {
    // Add extra padding on top of the safe area inset for visual breathing room
    const extraPadding = 10;
    return insetTop + extraPadding;
};

export default useSafeArea;
