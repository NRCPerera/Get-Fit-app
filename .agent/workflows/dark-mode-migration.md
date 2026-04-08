# Dark Mode Migration Guide

This guide explains how to migrate any screen to support dark mode using the centralized `useStyles` hook.

## Quick Reference

### Files Created
- `src/styles/useStyles.js` - The main hook that provides dynamic styles and colors
- `src/context/ThemeContext.js` - The context provider for theme state

### How It Works
1. `ThemeContext` manages the current theme (light/dark/system)
2. `useStyles` hook returns dynamic colors and pre-built styles based on the current theme
3. The `Card`, `Button`, `Input`, `Loading`, and `EmptyState` components already use dynamic colors

## Migration Steps for Each Screen

### Step 1: Add the import
```javascript
import { useStyles } from '../../styles/useStyles';
```

### Step 2: Get dynamic values in your component
```javascript
const MyScreen = () => {
  const { colors, isDark, styles: themeStyles } = useStyles();
  // ... rest of component
};
```

### Step 3: Update container styles
```javascript
// Before
<View style={styles.container}>

// After
<View style={[styles.container, { backgroundColor: colors.background }]}>
```

### Step 4: Update text colors inline
```javascript
// Before
<Text style={styles.title}>Title</Text>

// After
<Text style={[styles.title, { color: colors.text }]}>Title</Text>
```

### Step 5: Remove hardcoded colors from StyleSheet
Keep the StyleSheet for structural styles (padding, flexbox, borders) but remove color values:

```javascript
// Before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
});

// After
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    // backgroundColor moved to inline style
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    // color moved to inline style
  },
});
```

## Color Reference

Available colors from `useStyles()`:

```javascript
const { colors } = useStyles();

// Main colors
colors.primary       // Red accent
colors.secondary     // Gold accent
colors.success       // Green
colors.warning       // Yellow/Gold
colors.error         // Red for errors
colors.info          // Blue

// Backgrounds
colors.background           // Main background (white/black)
colors.backgroundSecondary  // Secondary background
colors.backgroundTertiary   // Tertiary background

// Text
colors.text           // Primary text color
colors.textSecondary  // Secondary text
colors.textTertiary   // Tertiary/muted text
colors.textDisabled   // Disabled text

// UI Elements
colors.border         // Border color
colors.divider        // Divider lines
colors.card           // Card background
colors.cardElevated   // Elevated card background

// Gradients (for LinearGradient)
colors.gradients.primary   // [red shades]
colors.gradients.secondary // [gold shades]
colors.gradients.success   // [green shades]
```

## Pre-built Styles from useStyles()

The hook also returns pre-built styles you can use directly:

```javascript
const { styles: themeStyles, colors } = useStyles();

// Containers
themeStyles.container        // Full screen container
themeStyles.safeArea         // Safe area container
themeStyles.centeredContainer // Centered container

// Cards
themeStyles.card             // Default card
themeStyles.cardElevated     // Elevated card
themeStyles.cardOutlined     // Outlined card

// Text
themeStyles.text             // Default text
themeStyles.textSecondary    // Secondary text
themeStyles.headerTitle      // Page title
themeStyles.sectionTitle     // Section title

// Buttons
themeStyles.iconButton       // Icon button
themeStyles.linkText         // Link text

// Layouts
themeStyles.row              // Flex row
themeStyles.rowSpaceBetween  // Space between row
themeStyles.divider          // Horizontal divider

// And many more!
```

## Example: Full Screen Migration

### Before (static theme)
```javascript
import { theme } from '../../styles/theme';

const MyScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Hello</Text>
    <Text style={styles.subtitle}>Welcome</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing[4],
  },
  title: {
    fontSize: 24,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});
```

### After (dynamic theme)
```javascript
import { theme } from '../../styles/theme';
import { useStyles } from '../../styles/useStyles';

const MyScreen = () => {
  const { colors } = useStyles();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Hello</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing[4],
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 16,
  },
});
```

## StatusBar Handling

For screens with a gradient header, keep `barStyle="light-content"`.

For regular screens, use dynamic bar style:
```javascript
const { isDark } = useStyles();

<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
```

## Testing Dark Mode

1. Go to Profile screen
2. Scroll to "Appearance" section
3. Select "Dark" mode
4. Navigate through the app to test

## Already Updated Screens

- ✅ LoginScreen
- ✅ RegisterScreen  
- ✅ ProfileScreen
- ✅ AboutScreen (example implementation)
- ✅ NotificationsScreen (partial)
- ✅ ChatScreen (partial)
- ✅ HomeScreen (partial)

## Common Components (Auto-themed)

These components already use dynamic colors:
- ✅ Card
- ✅ Button
- ✅ Input
- ✅ Loading
- ✅ EmptyState
- ✅ ThemeSelector
