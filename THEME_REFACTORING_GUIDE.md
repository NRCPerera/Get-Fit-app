# Theme System Refactoring Guide

This document explains how to implement the Light/Dark theme system in the Get-Fit app.

## Architecture Overview

```
src/
├── themes/                    # NEW: Centralized theme definitions
│   ├── light.js              # Light mode color tokens
│   ├── dark.js               # Dark mode color tokens  
│   └── index.js              # Theme objects + shared values (typography, spacing)
├── context/
│   └── ThemeContext.js       # Theme provider + useTheme hook
├── styles/
│   ├── theme.js              # Backward compatibility re-exports
│   ├── shared.js             # Common layout styles
│   └── useStyles.js          # Dynamic styles hook (optional)
```

## Core Concept

**Keep LAYOUT styles in StyleSheet, apply COLORS inline.**

| StyleSheet (static)           | Inline Styles (dynamic)     |
|-------------------------------|----------------------------|
| padding, margin               | backgroundColor            |
| width, height, flex           | color (text)               |
| borderRadius                  | borderColor                |
| fontSize, fontWeight          | shadowColor                |
| alignItems, justifyContent    | tintColor                  |

## How to Refactor a Screen

### Step 1: Import the theme hook

```javascript
// Static theme for LAYOUT only
import { theme } from '../../styles/theme';
// Dynamic theme for COLORS  
import { useTheme } from '../../context/ThemeContext';
```

### Step 2: Get dynamic colors in component

```javascript
const MyScreen = () => {
  // Get dynamic theme - responds to light/dark mode changes
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  
  // ... rest of component
};
```

### Step 3: Apply colors inline

```jsx
// ❌ WRONG - Color in StyleSheet (won't change with theme)
<View style={styles.card}>
  <Text style={styles.title}>Hello</Text>
</View>

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF' },  // ❌ Hardcoded
  title: { color: theme.colors.text },   // ❌ Static reference
});

// ✅ CORRECT - Color applied inline
<View style={[styles.card, { backgroundColor: colors.card }]}>
  <Text style={[styles.title, { color: colors.text }]}>Hello</Text>
</View>

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16 },  // ✅ Layout only
  title: { fontSize: 18, fontWeight: '600' }, // ✅ Typography only
});
```

### Step 4: Handle gradients

```jsx
import { LinearGradient } from 'expo-linear-gradient';

// Use dynamic gradient colors
<LinearGradient
  colors={colors.gradients.primary}  // ✅ Dynamic
  style={styles.gradientContainer}
/>
```

## Available Theme Colors

```javascript
const colors = {
  // Brand
  primary, primaryDark, primaryLight,
  secondary, secondaryDark, secondaryLight,
  
  // Functional
  success, error, warning, info, danger,
  
  // Backgrounds
  background,           // Main screen background
  backgroundSecondary,  // Cards, sections
  backgroundTertiary,   // Nested elements
  
  // Text
  text,            // Primary text
  textSecondary,   // Subtle text
  textTertiary,    // Muted text
  textDisabled,    // Disabled state
  textInverse,     // Text on colored bg
  
  // UI Elements
  border, borderLight, divider,
  card, cardElevated,
  
  // Gradients (arrays)
  gradients: { primary, secondary, success, ... }
};
```

## Quick Reference Patterns

### Container with theme background
```jsx
<View style={[styles.container, { backgroundColor: colors.background }]}>
```

### Text with theme color
```jsx
<Text style={[styles.title, { color: colors.text }]}>Title</Text>
<Text style={[styles.subtitle, { color: colors.textSecondary }]}>Subtitle</Text>
```

### Card with themed background and border
```jsx
<View style={[
  styles.card, 
  { 
    backgroundColor: colors.card,
    borderColor: colors.border,
  }
]}>
```

### Icon with theme color
```jsx
<Ionicons name="home" size={24} color={colors.primary} />
```

### StatusBar
```jsx
import { StatusBar } from 'react-native';

<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
```

### Conditional styling
```jsx
<View style={[
  styles.button,
  { backgroundColor: isActive ? colors.primary : colors.backgroundSecondary }
]}>
```

## Example: Complete Refactored Screen

```jsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';      // Layout values
import { useTheme } from '../../context/ThemeContext';  // Dynamic colors

const ExampleScreen = () => {
  // Get dynamic theme colors
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          This is a themed screen
        </Text>
      </View>

      {/* Card */}
      <View style={[
        styles.card, 
        { 
          backgroundColor: colors.card,
          borderColor: colors.border,
        }
      ]}>
        <Ionicons name="star" size={24} color={colors.primary} />
        <Text style={[styles.cardText, { color: colors.text }]}>
          Card content
        </Text>
      </View>
    </ScrollView>
  );
};

// StyleSheet contains LAYOUT ONLY - no colors!
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[4],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
  },
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  cardText: {
    fontSize: theme.typography.fontSize.md,
    flex: 1,
  },
});

export default ExampleScreen;
```

## Checklist for Each Screen

- [ ] Import `useTheme` from context
- [ ] Get `colors` from `dynamicTheme.colors`
- [ ] Remove all `theme.colors.xxx` from StyleSheet
- [ ] Apply `backgroundColor` inline for containers/cards
- [ ] Apply `color` inline for Text components
- [ ] Apply `borderColor` inline if using borders
- [ ] Use `colors.gradients.xxx` for LinearGradient
- [ ] Update StatusBar based on `isDark`
- [ ] Test in both light and dark mode

## Toggle Theme (for Settings Screen)

```jsx
import { useTheme } from '../../context/ThemeContext';

const SettingsScreen = () => {
  const { isDark, toggleTheme, setThemeMode, themeMode } = useTheme();

  return (
    <View>
      {/* Simple toggle */}
      <Switch value={isDark} onValueChange={toggleTheme} />
      
      {/* Or theme mode selector */}
      <Button title="Light" onPress={() => setThemeMode('light')} />
      <Button title="Dark" onPress={() => setThemeMode('dark')} />
      <Button title="System" onPress={() => setThemeMode('system')} />
    </View>
  );
};
```

## Common Mistakes to Avoid

1. ❌ Using `theme.colors.xxx` in StyleSheet
2. ❌ Defining local color constants in screens
3. ❌ Forgetting to apply `backgroundColor` on container
4. ❌ Hardcoding colors like `'#FFFFFF'` or `'#000000'`
5. ❌ Using `isDark` ternary for every color (use `colors` object instead)
