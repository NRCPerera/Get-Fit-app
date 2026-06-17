import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// Static theme for LAYOUT only (spacing, borderRadius, typography sizes)
import { theme } from '../../styles/theme';
// Dynamic theme for COLORS (responds to light/dark mode)
import { useTheme } from '../../context/ThemeContext';
import { clearError, loginUser } from '../../store/slices/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import KeyboardAvoidingWrapper from '../../components/common/KeyboardAvoidingWrapper';
import { screenStyles, headerStyles } from '../../styles/shared';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { error } = useSelector((state) => state.auth);
  
  // Get dynamic theme colors - this responds to light/dark mode changes
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const authErrorMessage = typeof error === 'string' ? error : error?.message || '';

  useFocusEffect(
    useCallback(() => {
      dispatch(clearError());
    }, [dispatch])
  );

  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`;
    }
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      dispatch(clearError());
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (error) {
      if (error?.isRateLimited) {
        const retryTime = error.retryAfter ? formatTimeRemaining(error.retryAfter) : '15 minutes';
        Alert.alert(
          'Too Many Login Attempts',
          `${error.message || 'Too many login attempts.'}\n\nPlease try again in ${retryTime}.`,
          [{ text: 'OK' }]
        );
      } else {
        const errorMessage = error?.message || error || 'An error occurred during login';
        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper
      style={[screenStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="fitness" size={48} color={colors.primary} />
          </View>
          <Text style={[headerStyles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[headerStyles.subtitle, { color: colors.textSecondary }]}>Sign in to continue your fitness journey</Text>
        </View>

        {/* Form Card */}
        <Card variant="elevated" style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={(value) => {
              if (authErrorMessage) {
                dispatch(clearError());
              }
              setEmail(value);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={authErrorMessage.toLowerCase().includes('email') ? authErrorMessage : ''}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(value) => {
              if (authErrorMessage) {
                dispatch(clearError());
              }
              setPassword(value);
            }}
            secureTextEntry
            showPasswordToggle
            leftIcon="lock-closed-outline"
            error={authErrorMessage.toLowerCase().includes('password') ? authErrorMessage : ''}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title={loading ? 'Signing In...' : 'Sign In'}
            onPress={handleLogin}
            loading={loading}
            fullWidth
            icon="log-in-outline"
            size="lg"
            style={styles.loginButton}
          />
        </Card>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={[styles.registerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
};

/**
 * Styles for LoginScreen
 * 
 * PATTERN: Keep LAYOUT in StyleSheet, apply COLORS inline.
 * - StyleSheet: spacing, sizing, positioning, border radius, typography size
 * - Inline: backgroundColor, color, borderColor (anything that changes with theme)
 */
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    // backgroundColor applied inline: { backgroundColor: colors.primary + '15' }
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  formCard: {
    marginBottom: theme.spacing[6],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing[2],
    marginBottom: theme.spacing[4],
    padding: theme.spacing[1],
  },
  forgotPasswordText: {
    fontSize: theme.typography.fontSize.sm,
    // color applied inline: { color: colors.primary }
    fontWeight: theme.typography.fontWeight.semibold,
  },
  loginButton: {
    marginTop: theme.spacing[2],
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: theme.typography.fontSize.md,
    // color applied inline: { color: colors.textSecondary }
  },
  registerLink: {
    fontSize: theme.typography.fontSize.md,
    // color applied inline: { color: colors.primary }
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default LoginScreen;
