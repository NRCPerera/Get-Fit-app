import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, getTheme } from '../themes';

const THEME_STORAGE_KEY = '@app_theme_mode';

// Theme Context
const ThemeContext = createContext({
    theme: lightTheme,
    isDark: false,
    toggleTheme: () => { },
    setThemeMode: () => { },
    themeMode: 'system', // 'light', 'dark', 'system'
});

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState('system'); // 'light', 'dark', 'system'
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference
    useEffect(() => {
        const loadThemePreference = async () => {
            try {
                const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
                    setThemeModeState(savedMode);
                }
            } catch (error) {
                console.log('Error loading theme preference:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadThemePreference();
    }, []);

    // Determine if dark mode is active
    const isDark = useMemo(() => {
        if (themeMode === 'system') {
            return systemColorScheme === 'dark';
        }
        return themeMode === 'dark';
    }, [themeMode, systemColorScheme]);

    // Get current theme object
    const theme = useMemo(() => getTheme(isDark), [isDark]);

    // Toggle between light and dark (memoized to prevent re-renders)
    const toggleTheme = useCallback(async () => {
        const newMode = isDark ? 'light' : 'dark';
        setThemeModeState(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.log('Error saving theme preference:', error);
        }
    }, [isDark]);

    // Set specific theme mode (memoized to prevent re-renders)
    const setThemeMode = useCallback(async (mode) => {
        if (['light', 'dark', 'system'].includes(mode)) {
            setThemeModeState(mode);
            try {
                await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
            } catch (error) {
                console.log('Error saving theme preference:', error);
            }
        }
    }, []);

    const value = useMemo(() => ({
        theme,
        isDark,
        toggleTheme,
        setThemeMode,
        themeMode,
        isLoaded,
    }), [theme, isDark, themeMode, isLoaded]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook to use theme
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Export context for direct access if needed
export default ThemeContext;
