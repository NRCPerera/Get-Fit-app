import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { authAPI } from '../../api/auth.api';
import { validateEmail } from '../../utils/validation';
import { screenStyles, headerStyles } from '../../styles/shared';
import BackButton from '../../components/common/BackButton';

const ForgotPasswordScreen = () => {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const fromEditProfile = route.params?.fromEditProfile;

  const [email, setEmail] = useState(route.params?.email || '');
  const [requestingOTP, setRequestingOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOTPChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      setPassword('');
      setConfirmPassword('');
      setVerifiedOtp('');
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(1);
      setOtp(['', '', '', '', '', '']);
      setVerifiedOtp('');
      setPassword('');
      setConfirmPassword('');
      return;
    }

    navigation.goBack();
  };

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setRequestingOTP(true);
      await authAPI.forgotPassword(email.trim());
      Alert.alert('Success', 'OTP has been sent to your email address');
      setCurrentStep(2);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setVerifiedOtp('');
      setPassword('');
      setConfirmPassword('');
      inputRefs.current[0]?.focus();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setRequestingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) {
      Alert.alert('Please wait', `You can resend OTP in ${countdown} seconds`);
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setResending(true);
      await authAPI.forgotPassword(email.trim());
      Alert.alert('Success', 'OTP has been resent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setVerifiedOtp('');
      setPassword('');
      setConfirmPassword('');
      if (currentStep > 2) {
        setCurrentStep(2);
      }
      inputRefs.current[0]?.focus();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to resend OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP code');
      return;
    }

    try {
      setVerifyingOTP(true);
      await authAPI.verifyPasswordResetOTP(email.trim(), otpCode);
      setVerifiedOtp(otpCode);
      setCurrentStep(3);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Invalid OTP code. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleResetPassword = async () => {
    if (!verifiedOtp) {
      Alert.alert('Error', 'Please verify your OTP first');
      setCurrentStep(2);
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setResetting(true);
      await authAPI.resetPassword(email.trim(), verifiedOtp, password);
      Alert.alert('Success', 'Password reset successfully!', [
        {
          text: 'OK',
          onPress: async () => {
            if (fromEditProfile) {
              try {
                await dispatch(logoutUser()).unwrap();
              } catch (_) {
                // App navigator will redirect once auth state clears
              }
              return;
            }
            navigation.navigate('Login');
          },
        },
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResetting(false);
    }
  };

  const getStepTitle = () => {
    if (currentStep === 1) return 'Forgot Password';
    if (currentStep === 2) return 'Verify OTP';
    return 'Set New Password';
  };

  const getStepSubtitle = () => {
    if (currentStep === 1) {
      return 'Enter your email address and we\'ll send you an OTP code to reset your password.';
    }
    if (currentStep === 2) {
      return `We've sent a 6-digit OTP code to\n${email}\nEnter the code below to continue.`;
    }
    return 'OTP verified. Enter your new password below.';
  };

  const getStepIcon = () => {
    if (currentStep === 1) return 'lock-closed-outline';
    if (currentStep === 2) return 'key-outline';
    return 'shield-checkmark-outline';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      style={[screenStyles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton
            style={styles.backButton}
            iconName="arrow-back"
            color={colors.text}
            onPress={handleBack}
          />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons
              name={getStepIcon()}
              size={64}
              color={colors.primary}
            />
          </View>

          <Text style={headerStyles.title}>{getStepTitle()}</Text>
          <Text style={headerStyles.subtitle}>{getStepSubtitle()}</Text>

          {currentStep === 1 && (
            <Card variant="elevated" style={styles.formCard}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
                editable={!fromEditProfile}
              />

              <Button
                title={requestingOTP ? 'Sending OTP...' : 'Send OTP'}
                onPress={handleRequestOTP}
                loading={requestingOTP}
                fullWidth
                icon="mail-outline"
                size="lg"
                style={styles.button}
              />
            </Card>
          )}

          {currentStep === 2 && (
            <Card variant="elevated" style={styles.formCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Enter OTP Code</Text>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary },
                      digit && [styles.otpInputFilled, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }],
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOTPChange(index, value)}
                    onKeyPress={({ nativeEvent }) => handleOTPKeyPress(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive the code?</Text>
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resending || countdown > 0}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.resendButtonText,
                    { color: colors.primary },
                    (resending || countdown > 0) && { color: colors.textTertiary },
                  ]}>
                    {resending
                      ? 'Sending...'
                      : countdown > 0
                        ? `Resend in ${countdown}s`
                        : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title={verifyingOTP ? 'Verifying OTP...' : 'Verify OTP'}
                onPress={handleVerifyOTP}
                loading={verifyingOTP}
                fullWidth
                icon="checkmark-circle-outline"
                size="lg"
                style={styles.button}
              />

              <Text style={[styles.note, { color: colors.textSecondary }]}>
                The OTP code will expire in 10 minutes.
              </Text>
            </Card>
          )}

          {currentStep === 3 && (
            <Card variant="elevated" style={styles.formCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>New Password</Text>
              <Input
                label="New Password"
                placeholder="Enter new password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showPasswordToggle
                leftIcon="lock-closed-outline"
                helperText="Minimum 8 characters"
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                showPasswordToggle
                leftIcon="lock-closed-outline"
              />

              <Button
                title={resetting ? 'Resetting Password...' : 'Reset Password'}
                onPress={handleResetPassword}
                loading={resetting}
                fullWidth
                icon="checkmark-circle-outline"
                size="lg"
                style={styles.button}
              />
            </Card>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing[6],
  },
  header: {
    marginBottom: theme.spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  formCard: {
    width: '100%',
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[3],
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing[4],
    gap: theme.spacing[2],
  },
  otpInput: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    textAlign: 'center',
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  otpInputFilled: {},
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[6],
  },
  resendText: {
    fontSize: theme.typography.fontSize.sm,
  },
  resendButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  button: {
    marginTop: theme.spacing[2],
  },
  note: {
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    marginTop: theme.spacing[4],
    fontStyle: 'italic',
  },
});

export default ForgotPasswordScreen;
