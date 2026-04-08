import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  
  const [email, setEmail] = useState('');
  const [requestingOTP, setRequestingOTP] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      const response = await authAPI.forgotPassword(email.trim());
      if (response.success) {
        Alert.alert('Success', 'OTP has been sent to your email address');
        setCurrentStep(2);
        setCountdown(60);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to send OTP. Please try again.';
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
      const response = await authAPI.forgotPassword(email.trim());
      if (response.success) {
        Alert.alert('Success', 'OTP has been resent to your email');
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to resend OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP code');
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
      const response = await authAPI.resetPassword(email.trim(), otpCode, password);
      if (response.success) {
        Alert.alert('Success', 'Password reset successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to reset password. Please check your OTP and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={screenStyles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton
            style={styles.backButton}
            iconName="arrow-back"
            color={colors.text}
            onPress={() => {
              if (currentStep === 2) {
                setCurrentStep(1);
                setOtp(['', '', '', '', '', '']);
                setPassword('');
                setConfirmPassword('');
              } else {
                navigation.goBack();
              }
            }}
          />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons 
              name={currentStep === 1 ? "lock-closed-outline" : "key-outline"} 
              size={64} 
              color={colors.primary} 
            />
          </View>

          <Text style={headerStyles.title}>
            {currentStep === 1 ? 'Forgot Password' : 'Reset Password'}
          </Text>
          <Text style={headerStyles.subtitle}>
            {currentStep === 1 
              ? 'Enter your email address and we\'ll send you an OTP code to reset your password.'
              : `We've sent a 6-digit OTP code to\n${email}\nEnter the code and your new password below.`}
          </Text>

          {currentStep === 1 ? (
            <Card variant="elevated" style={styles.formCard}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
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
          ) : (
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
                      digit && [styles.otpInputFilled, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]
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

              <View style={[styles.resendContainer]}>
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>Didn't receive the code?</Text>
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resending || countdown > 0}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.resendButtonText,
                    { color: colors.primary },
                    (resending || countdown > 0) && { color: colors.textTertiary }
                  ]}>
                    {resending 
                      ? 'Sending...' 
                      : countdown > 0 
                        ? `Resend in ${countdown}s` 
                        : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>

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
<Text style={[styles.note, { color: colors.textSecondary }]}>
  The OTP code will expire in 10 minutes.
</Text>
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
    // backgroundColor: colors.primary + '15' - applied inline
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
    // color: colors.text - applied inline
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
    // borderColor: colors.border - applied inline
    borderRadius: theme.borderRadius.md,
    textAlign: 'center',
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    // color: colors.text - applied inline
    // backgroundColor: colors.backgroundSecondary - applied inline
  },
  otpInputFilled: {
    // borderColor: colors.primary - applied inline
    // backgroundColor: colors.primary + '10' - applied inline
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[6],
  },
  resendText: {
    fontSize: theme.typography.fontSize.sm,
    // color: colors.textSecondary - applied inline
  },
  resendButtonText: {
    fontSize: theme.typography.fontSize.sm,
    // color: colors.primary - applied inline
    fontWeight: theme.typography.fontWeight.semibold,
  },
  resendButtonTextDisabled: {
    // color: colors.textTertiary - applied inline
  },
  button: {
    marginTop: theme.spacing[2],
  },
  note: {
    fontSize: theme.typography.fontSize.xs,
    // color: colors.textSecondary - applied inlinee.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing[4],
    fontStyle: 'italic',
  },
});

export default ForgotPasswordScreen;
