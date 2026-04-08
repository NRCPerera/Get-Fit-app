import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import KeyboardAvoidingWrapper from '../../components/common/KeyboardAvoidingWrapper';
import DateSelectInput from '../../components/common/DateSelectInput';
import { registerUser } from '../../store/slices/authSlice';
import { validateEmail } from '../../utils/validation';
import { screenStyles, headerStyles } from '../../styles/shared';

const RegisterScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { loading, error } = useSelector((state) => state.auth);
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  const ValidationSchema = useMemo(() => Yup.object().shape({
    name: Yup.string().min(2, 'Name too short').max(50, 'Name too long').required('Name is required'),
    email: Yup.string().test('is-email', 'Invalid email', (v) => validateEmail(v)).required('Email is required'),
    phone: Yup.string().matches(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone').nullable().optional(),
    dateOfBirth: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD').nullable().optional(),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm your password'),
    gender: Yup.string().oneOf(['Male', 'Female', 'Prefer not to say'], 'Invalid gender').nullable().optional(),
  }), []);

  const initialValues = { name: '', email: '', phone: '', dateOfBirth: '', password: '', confirmPassword: '', gender: '' };

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        password: values.password,
        gender: values.gender || undefined
      };
      const action = await dispatch(registerUser(payload));
      if (registerUser.fulfilled.match(action)) {
        if (action.payload?.requiresOTPVerification) {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'VerifyEmail',
                  params: { email: values.email },
                },
              ],
            })
          );
        } else {
          setStatus({ success: 'Registration successful. Please log in.' });
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        }
      } else {
        const errorMsg = typeof action.payload === 'string'
          ? action.payload
          : action.payload?.message || 'Registration failed';
        setStatus({ error: errorMsg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper
      style={[screenStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="fitness" size={48} color={colors.primary} />
          </View>
          <Text style={[headerStyles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[headerStyles.subtitle, { color: colors.textSecondary }]}>Join Get-Fit Gym and start your fitness journey</Text>
        </View>

        {/* Form */}
        <Formik
          initialValues={initialValues}
          validationSchema={ValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched, isSubmitting, status }) => (
            <Card variant="elevated" style={styles.formCard}>
              <Input
                label="Full Name *"
                placeholder="John Doe"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name ? errors.name : ''}
                leftIcon="person-outline"
                autoCapitalize="words"
              />

              <Input
                label="Email Address *"
                placeholder="you@example.com"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email ? errors.email : ''}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <Input
                label="Phone Number (Optional)"
                placeholder="+94 77 123 4567"
                value={values.phone}
                onChangeText={handleChange('phone')}
                onBlur={handleBlur('phone')}
                error={touched.phone && errors.phone ? errors.phone : ''}
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />

              <DateSelectInput
                label="Date of Birth (Optional)"
                value={values.dateOfBirth}
                onChange={(value) => setFieldValue('dateOfBirth', value)}
                error={touched.dateOfBirth && errors.dateOfBirth ? errors.dateOfBirth : ''}
              />

              <View style={{ marginBottom: theme.spacing[4] }}>
                <Text style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: colors.text,
                  marginBottom: theme.spacing[2],
                  marginLeft: theme.spacing[1]
                }}>
                  Gender (Optional)
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['Male', 'Female', 'Prefer not to say'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={{
                        flex: gender === 'Prefer not to say' ? 1.5 : 1,
                        paddingVertical: 12,
                        paddingHorizontal: 4,
                        borderRadius: theme.borderRadius.md,
                        borderWidth: 1,
                        borderColor: values.gender === gender ? colors.primary : colors.border,
                        backgroundColor: values.gender === gender ? colors.primary + '10' : colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => handleChange('gender')(gender)}
                    >
                      <Text style={{
                        color: values.gender === gender ? colors.primary : colors.textSecondary,
                        fontWeight: '600',
                        fontSize: 13,
                        textAlign: 'center',
                      }}>
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                label="Password *"
                placeholder="At least 8 characters"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                error={touched.password && errors.password ? errors.password : ''}
                secureTextEntry
                showPasswordToggle
                leftIcon="lock-closed-outline"
                helperText="Minimum 8 characters"
              />

              <Input
                label="Confirm Password *"
                placeholder="Re-enter your password"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : ''}
                secureTextEntry
                showPasswordToggle
                leftIcon="lock-closed-outline"
              />

              {status?.error && (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="alert-circle" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{status.error}</Text>
                </View>
              )}

              {status?.success && (
                <View style={[styles.successContainer, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.successText, { color: colors.success }]}>{status.success}</Text>
                </View>
              )}

              <Button
                title={isSubmitting || loading ? 'Creating Account...' : 'Create Account'}
                onPress={handleSubmit}
                loading={isSubmitting || loading}
                fullWidth
                icon="person-add-outline"
                size="lg"
                style={styles.submitButton}
              />
            </Card>
          )}
        </Formik>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingWrapper>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing[6],
    paddingTop: theme.spacing[12],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    // backgroundColor: colors.primary + '15' - applied inline
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  formCard: {
    marginBottom: theme.spacing[6],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: colors.error + '15' - applied inline
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[4],
    gap: theme.spacing[2],
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    // color: colors.error - applied inline
    fontWeight: theme.typography.fontWeight.medium,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: colors.success + '15' - applied inline
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[4],
    gap: theme.spacing[2],
  },
  successText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    // color: colors.success - applied inline
    fontWeight: theme.typography.fontWeight.medium,
  },
  submitButton: {
    marginTop: theme.spacing[2],
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: theme.typography.fontSize.md,
    // color: colors.textSecondary - applied inline
  },
  loginLink: {
    fontSize: theme.typography.fontSize.md,
    // color: colors.primary - applied inline
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default RegisterScreen;
