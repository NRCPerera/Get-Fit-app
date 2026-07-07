import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { verifyOTP, resendOTP } from '../../store/slices/authSlice';
import { screenStyles, headerStyles } from '../../styles/shared';
import BackButton from '../../components/common/BackButton';

const VerifyEmailScreen = () => {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { loading, error, pendingEmailVerification, user } = useSelector((state) => state.auth);
  
  const email = route.params?.email || pendingEmailVerification || user?.email;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
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

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP code');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      await dispatch(verifyOTP({ email, otp: otpCode })).unwrap();
      Alert.alert('Success', 'Email verified successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Login')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', error?.message || 'OTP verification failed');
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) {
      Alert.alert('Please wait', `You can resend OTP in ${countdown} seconds`);
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setResending(true);
      await dispatch(resendOTP(email)).unwrap();
      Alert.alert('Success', 'OTP has been resent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
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
          <BackButton style={styles.backButton} color={colors.text} />
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="mail-outline" size={64} color={colors.primary} />
          </View>

          <Text style={headerStyles.title}>Verify Your Email</Text>
          <Text style={headerStyles.subtitle}>
            We've sent a 6-digit OTP code to{'\n'}
            <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
          </Text>

          <Card variant="elevated" style={styles.formCard}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[
                    styles.otpInput,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.backgroundSecondary },
                    digit && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                    error && { borderColor: colors.error }
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

            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {typeof error === 'string' ? error : error?.message || 'An error occurred'}
                </Text>
              </View>
            )}

            <Button
              title={loading ? 'Verifying...' : 'Verify OTP'}
              onPress={handleVerify}
              loading={loading}
              fullWidth
              icon="checkmark-circle-outline"
              size="lg"
              style={styles.verifyButton}
            />

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

            <Text style={[styles.note, { color: colors.textSecondary }]}>
              The OTP code will expire in 10 minutes.
            </Text>
          </Card>
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
  emailText: {
    fontWeight: theme.typography.fontWeight.semibold,
    // color: colors.primary - applied inline
  },
  formCard: {
    width: '100%',
    marginBottom: theme.spacing[6],
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
  otpInputError: {
    // borderColor: colors.error - applied inline
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
    // color: colors.error - applied inline
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  verifyButton: {
    marginBottom: theme.spacing[4],
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
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
  note: {
    fontSize: theme.typography.fontSize.xs,
    // color: colors.textSecondary - applied inlinee.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VerifyEmailScreen;

