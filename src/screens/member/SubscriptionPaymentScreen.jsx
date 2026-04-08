import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
  Modal,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { paymentAPI } from '../../api/payment.api';
import { instructorAPI } from '../../api/instructor.api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PayHereWebView from '../../components/payment/PayHereWebView';
import BackButton from '../../components/common/BackButton';

const SubscriptionPaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const {
    instructorId,
    instructorUserId,
    instructorName,
    instructorMonthlyRate,
    instructorSpecialty
  } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewPaymentUrl, setWebViewPaymentUrl] = useState(null);
  const [webViewPaymentParams, setWebViewPaymentParams] = useState(null);
  const appState = useRef(AppState.currentState);
  const paymentCheckInterval = useRef(null);

  // Monthly subscription = monthly rate (directly from instructor)
  const subscriptionAmount = instructorMonthlyRate || 5000;

  // Check payment status when screen is focused (user returns from PayHere)
  useFocusEffect(
    useCallback(() => {
      if (paymentId && processing && !paymentCompleted) {
        // User returned to app, check payment status
        verifyPayment(paymentId);
      }
    }, [paymentId, processing, paymentCompleted])
  );

  // Monitor app state to check payment when user returns from browser
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        paymentId &&
        processing &&
        !paymentCompleted
      ) {
        // App came to foreground, check payment status
        verifyPayment(paymentId);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [paymentId, processing, paymentCompleted]);

  const handlePaymentSuccess = useCallback(async (payment) => {
    try {
      // Check if subscription was already activated by PayHere webhook
      let subscriptionActive = false;

      try {
        const statusRes = await instructorAPI.checkSubscriptionStatus(instructorUserId);
        if (statusRes?.data?.isSubscribed || statusRes?.isSubscribed) {
          subscriptionActive = true;
        }
      } catch (statusErr) {
        // Status check failed, try to create subscription
      }

      if (!subscriptionActive) {
        // Subscription not yet active, try to create/activate it
        const subscribeRes = await instructorAPI.subscribeToInstructor(
          instructorUserId,
          payment._id
        );

        // Check for success - includes "Already subscribed" as success
        if (subscribeRes?.success || subscribeRes?.data?.subscription) {
          subscriptionActive = true;
        }
      }

      if (subscriptionActive) {
        Alert.alert(
          'Success!',
          'Payment completed and subscription activated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('InstructorDetail', {
                  id: instructorId,
                  paymentSuccess: true
                });
              }
            }
          ]
        );
      } else {
        throw new Error('Subscription activation failed');
      }
    } catch (e) {
      // Check if error is "Already subscribed" - this is actually a success case
      const errorMessage = e?.response?.data?.message || e?.message || '';
      if (errorMessage.toLowerCase().includes('already subscribed')) {
        Alert.alert(
          'Success!',
          'Payment completed and subscription is active!',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('InstructorDetail', {
                  id: instructorId,
                  paymentSuccess: true
                });
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Payment Success',
          'Your payment was successful! The subscription should be active. If you don\'t see it, please contact support.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('InstructorDetail', {
                  id: instructorId,
                  paymentSuccess: true
                });
              }
            }
          ]
        );
      }
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  }, [instructorId, instructorUserId, navigation]);

  // Poll for payment status while processing
  useEffect(() => {
    if (paymentId && processing && !paymentCompleted) {
      // Poll every 3 seconds to check payment status from history
      // Payment can only be completed via PayHere webhook
      paymentCheckInterval.current = setInterval(async () => {
        try {
          const res = await paymentAPI.getPaymentHistory();
          const payments = res?.data?.items || [];
          const payment = payments.find(p => p._id === paymentId || p.id === paymentId);

          if (payment?.status === 'completed') {
            setPaymentCompleted(true);
            await handlePaymentSuccess(payment);
            if (paymentCheckInterval.current) {
              clearInterval(paymentCheckInterval.current);
            }
          } else if (payment?.status === 'failed' || payment?.status === 'cancelled') {
            setProcessing(false);
            Alert.alert('Payment Failed', 'Your payment was not completed. Please try again.');
            if (paymentCheckInterval.current) {
              clearInterval(paymentCheckInterval.current);
            }
          }
        } catch (err) {
        }
      }, 3000); // Check every 3 seconds

      // Stop polling after 5 minutes
      setTimeout(() => {
        if (paymentCheckInterval.current) {
          clearInterval(paymentCheckInterval.current);
          if (!paymentCompleted) {
            setProcessing(false);
            Alert.alert(
              'Payment Pending',
              'Your payment is being verified by PayHere. Please check your payment history shortly.',
              [{ text: 'OK' }]
            );
          }
        }
      }, 300000); // 5 minutes
    }

    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
      }
    };
  }, [paymentId, processing, paymentCompleted, handlePaymentSuccess]);

  const verifyPayment = async (paymentIdToCheck) => {
    try {
      setProcessing(true);

      // Poll payment history to check if payment was completed
      // Payment is completed via PayHere return URL handler, not from this function
      const res = await paymentAPI.getPaymentHistory();
      const payments = res?.data?.items || [];
      const payment = payments.find(p => p._id === paymentIdToCheck || p.id === paymentIdToCheck);

      if (payment?.status === 'completed') {
        setPaymentCompleted(true);
        await handlePaymentSuccess(payment);
      } else if (payment?.status === 'failed' || payment?.status === 'cancelled') {
        setProcessing(false);
        Alert.alert('Payment Failed', 'Your payment was not completed. Please try again.');
      } else {
        // Payment might still be pending - poll again after delay
        setTimeout(async () => {
          try {
            const retryRes = await paymentAPI.getPaymentHistory();
            const retryPayments = retryRes?.data?.items || [];
            const retryPayment = retryPayments.find(p => p._id === paymentIdToCheck || p.id === paymentIdToCheck);

            if (retryPayment?.status === 'completed') {
              setPaymentCompleted(true);
              await handlePaymentSuccess(retryPayment);
            } else if (retryPayment?.status === 'failed' || retryPayment?.status === 'cancelled') {
              setProcessing(false);
              Alert.alert('Payment Failed', 'Your payment was not completed. Please try again.');
            } else {
              Alert.alert(
                'Payment Processing',
                'Your payment is being verified. Please wait or check your payment history shortly.',
                [{ text: 'OK' }]
              );
              setProcessing(false);
            }
          } catch (err) {
            Alert.alert(
              'Payment Processing',
              'Your payment is being verified. Please check your payment history shortly.',
              [{ text: 'OK' }]
            );
            setProcessing(false);
          }
        }, 3000);
      }
    } catch (err) {
      Alert.alert(
        'Payment Processing',
        'Your payment is being verified. Please check your payment history shortly.',
        [{ text: 'OK' }]
      );
      setProcessing(false);
    }
  };

  const initializePayment = async () => {
    try {
      setLoading(true);

      // Create payment with PayHere
      const paymentRes = await paymentAPI.createSubscriptionPayment({
        instructorId: instructorUserId,
        amount: subscriptionAmount,
        currency: 'LKR',
        description: `Monthly subscription to ${instructorName || 'Instructor'}`
      });

      const payment = paymentRes?.data?.payment;
      const paymentUrl = paymentRes?.data?.paymentUrl;
      const paymentParams = paymentRes?.data?.paymentParams;

      if (!payment || !payment._id) {
        throw new Error('Payment creation failed');
      }

      if (!paymentUrl || !paymentParams) {
        throw new Error('Payment URL not received');
      }

      setPaymentId(payment._id);
      setWebViewPaymentUrl(paymentUrl);
      setWebViewPaymentParams(paymentParams);
      setLoading(false);
      setShowWebView(true);
      setProcessing(true);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to initialize payment');
      setLoading(false);
      setProcessing(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Gradient Header */}
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative circles */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        
        <View style={styles.headerTop}>
          <BackButton style={styles.backBtn} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Subscribe</Text>
            <Text style={styles.headerSubtitle}>Complete payment to start</Text>
          </View>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
          </View>
        </View>

        {/* Instructor Preview */}
        <View style={styles.instructorPreview}>
          <View style={styles.previewAvatarContainer}>
            <Ionicons name="person" size={28} color="#7950F2" />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>{instructorName || 'Instructor'}</Text>
            {instructorSpecialty && (
              <Text style={styles.previewSpecialty}>{instructorSpecialty}</Text>
            )}
          </View>
          <View style={styles.previewAmount}>
            <Text style={styles.previewAmountValue}>LKR {subscriptionAmount.toLocaleString()}</Text>
            <Text style={styles.previewAmountLabel}>/month</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Instructor Card */}
        <Card variant="elevated" style={styles.instructorCard}>
          <View style={styles.instructorHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <View style={styles.instructorInfo}>
              <Text style={[styles.instructorName, { color: colors.text }]}>{instructorName || 'Instructor'}</Text>
              {instructorSpecialty && (
                <Text style={[styles.instructorSpecialty, { color: colors.textSecondary }]}>{instructorSpecialty}</Text>
              )}
            </View>
          </View>
          <View style={[styles.amountContainer, { borderTopColor: colors.border }]}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Monthly Subscription</Text>
            <Text style={[styles.amount, { color: colors.primary }]}>LKR {subscriptionAmount.toFixed(2)}</Text>
          </View>
        </Card>

        {!processing && !paymentCompleted && (
          <Card variant="elevated" style={styles.paymentForm}>
            <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Secure Payment via PayHere</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  You will be redirected to PayHere's secure payment page to complete your transaction.
                  PayHere supports credit/debit cards, mobile wallets, and internet banking.
                </Text>
              </View>
            </View>

            <Button
              title={`Pay LKR ${subscriptionAmount.toFixed(2)}`}
              onPress={initializePayment}
              loading={loading}
              fullWidth
              icon="lock-closed"
              size="lg"
              style={styles.payButton}
            />

            <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
              Your payment is processed securely by PayHere. No card details are stored on our servers.
            </Text>
          </Card>
        )}

        {/* Processing State */}
        {processing && !paymentCompleted && (
          <Card variant="elevated" style={styles.stateCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.stateTitle, { color: colors.text }]}>Processing payment...</Text>
            <Text style={[styles.stateSubtext, { color: colors.textSecondary }]}>
              Please complete the payment on PayHere and return to this app.
            </Text>
          </Card>
        )}

        {/* Success State */}
        {paymentCompleted && (
          <Card variant="elevated" style={styles.stateCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.success }]}>Payment Successful!</Text>
            <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>Finalizing your subscription...</Text>
          </Card>
        )}

        {/* PayHere WebView Modal */}
        <Modal
          visible={showWebView}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            if (!processing) {
              setShowWebView(false);
            }
          }}
        >
          <SafeAreaView style={[styles.webViewContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={[styles.webViewHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.webViewCloseButton}
                onPress={() => {
                  Alert.alert(
                    'Cancel Payment?',
                    'Are you sure you want to cancel? Your payment will not be processed.',
                    [
                      { text: 'No', style: 'cancel' },
                      {
                        text: 'Yes',
                        style: 'destructive',
                        onPress: () => {
                          setShowWebView(false);
                          setProcessing(false);
                          setLoading(false);
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.webViewTitle, { color: colors.text }]}>PayHere Payment</Text>
              <View style={styles.webViewCloseButton} />
            </View>
            {webViewPaymentUrl && webViewPaymentParams && (
              <PayHereWebView
                paymentUrl={webViewPaymentUrl}
                paymentParams={webViewPaymentParams}
                onPaymentSuccess={async (returnedPaymentId) => {
                  setShowWebView(false);
                  const idToCheck = returnedPaymentId || paymentId;
                  if (idToCheck) {
                    await verifyPayment(idToCheck);
                  }
                }}
                onPaymentCancel={(returnedPaymentId) => {
                  setShowWebView(false);
                  setProcessing(false);
                  Alert.alert(
                    'Payment Cancelled',
                    'Your payment was cancelled. You can try again.',
                    [{ text: 'OK' }]
                  );
                }}
                onClose={() => {
                  setShowWebView(false);
                  setProcessing(false);
                }}
              />
            )}
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: theme.spacing[6],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing[3],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  secureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instructorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  previewAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  previewSpecialty: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  previewAmount: {
    alignItems: 'flex-end',
  },
  previewAmountValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  previewAmountLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[4],
  },
  instructorCard: {
    marginBottom: theme.spacing[6],
  },
  instructorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
    letterSpacing: 0.3,
  },
  instructorSpecialty: {
    fontSize: theme.typography.fontSize.sm,
  },
  amountContainer: {
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
  amount: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  paymentForm: {
    marginBottom: theme.spacing[6],
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    gap: theme.spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[2],
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  payButton: {
    marginTop: theme.spacing[2],
  },
  disclaimer: {
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    marginTop: theme.spacing[4],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.xs,
  },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[12],
    minHeight: 200,
    borderRadius: 20,
  },
  successIcon: {
    marginBottom: theme.spacing[4],
  },
  stateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing[4],
    textAlign: 'center',
  },
  stateSubtext: {
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing[2],
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
  },
  successTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing[4],
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing[2],
    textAlign: 'center',
  },
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderBottomWidth: 1,
  },
  webViewTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  webViewCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubscriptionPaymentScreen;
