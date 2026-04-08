import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Modal, AppState, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { membershipAPI } from '../../api/membership.api';
import { paymentAPI } from '../../api/payment.api';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../utils/helpers';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import PayHereWebView from '../../components/payment/PayHereWebView';
import BackButton from '../../components/common/BackButton';

const MembershipPlansScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useSelector((state) => state.auth);
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [plans, setPlans] = useState([]);
  const [activeMembership, setActiveMembership] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewPaymentUrl, setWebViewPaymentUrl] = useState(null);
  const [webViewPaymentParams, setWebViewPaymentParams] = useState(null);
  const appState = useRef(AppState.currentState);
  const paymentCheckInterval = useRef(null);

  // Check payment status when screen is focused (user returns from PayHere)
  useFocusEffect(
    useCallback(() => {
      if (paymentId && processingPayment && !paymentCompleted) {
        // User returned to app, check payment status
        verifyPayment(paymentId);
      }
    }, [paymentId, processingPayment, paymentCompleted])
  );

  // Monitor app state to check payment when user returns from browser
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        paymentId &&
        processingPayment &&
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
  }, [paymentId, processingPayment, paymentCompleted]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [plansRes, membershipsRes] = await Promise.all([
        membershipAPI.getPlans(),
        membershipAPI.getMyMemberships(),
      ]);
      const planData = plansRes?.data?.plans || plansRes?.data || [];
      const membershipData = membershipsRes?.data || {};
      setPlans(planData);
      setActiveMembership(membershipData.activeMembership || null);
      setHistory(membershipData.history || []);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Unable to load membership information.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPurchasingPlanId('');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const confirmPurchase = (plan) => {
    // Determine price based on gender
    const price = user?.gender === 'Female' && plan.priceFemale ? plan.priceFemale : plan.price;

    Alert.alert(
      'Confirm Purchase',
      `Activate the ${plan.name} plan for LKR ${price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'default', onPress: () => handlePurchase(plan.id) }
      ]
    );
  };

  const handlePaymentSuccess = useCallback(async (payment) => {
    try {
      // Reload membership data to show updated status
      await load();

      Alert.alert(
        'Success!',
        'Payment completed and membership activated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setPaymentCompleted(true);
              setProcessingPayment(false);
              setShowWebView(false);
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert(
        'Payment Success, Activation Failed',
        'Your payment was successful but membership activation failed. Please contact support.',
        [
          {
            text: 'OK',
            onPress: () => {
              setProcessingPayment(false);
              setShowWebView(false);
            }
          }
        ]
      );
    } finally {
      setPurchasingPlanId('');
    }
  }, [load]);

  // Poll for payment status while processing
  useEffect(() => {
    if (paymentId && processingPayment && !paymentCompleted) {
      // Poll every 3 seconds to check payment status
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
            setProcessingPayment(false);
            setShowWebView(false);
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
            setProcessingPayment(false);
            Alert.alert(
              'Payment Status',
              'Payment is still being processed. Please check your payment history later.',
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
  }, [paymentId, processingPayment, paymentCompleted, handlePaymentSuccess]);

  const verifyPayment = async (paymentIdToCheck) => {
    try {
      setProcessingPayment(true);

      // Poll payment history to check if payment was completed
      // Payment is completed via PayHere return URL handler, not from this function
      const res = await paymentAPI.getPaymentHistory();
      const payments = res?.data?.items || [];
      const payment = payments.find(p => p._id === paymentIdToCheck || p.id === paymentIdToCheck);

      if (payment?.status === 'completed') {
        setPaymentCompleted(true);
        await handlePaymentSuccess(payment);
      } else if (payment?.status === 'failed' || payment?.status === 'cancelled') {
        setProcessingPayment(false);
        setShowWebView(false);
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
              setProcessingPayment(false);
              setShowWebView(false);
              Alert.alert('Payment Failed', 'Your payment was not completed. Please try again.');
            } else {
              Alert.alert(
                'Payment Processing',
                'Your payment is being verified. Please wait or check your payment history shortly.',
                [{ text: 'OK' }]
              );
              setProcessingPayment(false);
            }
          } catch (err) {
            Alert.alert(
              'Payment Processing',
              'Your payment is being verified. Please check your payment history shortly.',
              [{ text: 'OK' }]
            );
            setProcessingPayment(false);
          }
        }, 3000);
      }
    } catch (err) {
      Alert.alert(
        'Payment Processing',
        'Your payment is being verified. Please check your payment history shortly.',
        [{ text: 'OK' }]
      );
      setProcessingPayment(false);
    }
  };

  const handlePurchase = async (planId) => {
    try {
      setPurchasingPlanId(planId);
      const res = await membershipAPI.purchaseMembership(planId);

      const payment = res?.data?.payment;
      const paymentUrl = res?.data?.paymentUrl;
      const paymentParams = res?.data?.paymentParams;

      if (!payment || !payment._id) {
        throw new Error('Payment creation failed');
      }

      if (!paymentUrl || !paymentParams) {
        throw new Error('Payment URL not received');
      }

      setPaymentId(payment._id);
      setWebViewPaymentUrl(paymentUrl);
      setWebViewPaymentParams(paymentParams);
      setPurchasingPlanId('');
      setShowWebView(true);
      setProcessingPayment(true);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to initialize payment.');
      setPurchasingPlanId('');
    }
  };

  const renderActiveMembership = () => {
    if (!activeMembership) {
      return (
        <Card variant="elevated" style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="card-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No active membership</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Choose a plan below to activate your membership and unlock personalized workouts.
          </Text>
        </Card>
      );
    }

    return (
      <Card variant="elevated" style={styles.activeCard}>
        <View style={styles.activeHeader}>
          <View style={[styles.activeIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="card" size={28} color={colors.primary} />
          </View>
          <View style={styles.activeInfo}>
            <Text style={[styles.activeTitle, { color: colors.text }]}>{activeMembership.planName}</Text>
            <Text style={[styles.activeSubtitle, { color: colors.textSecondary }]}>Active membership</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Active</Text>
          </View>
        </View>
        <View style={[styles.activeDates, { borderTopColor: colors.border }]}>
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Start Date</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {formatDate(new Date(activeMembership.startDate), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>End Date</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>
              {formatDate(new Date(activeMembership.endDate), 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderPlanCard = (plan) => {
    const isPurchasing = purchasingPlanId === plan.id;
    const isActive = activeMembership?.planId === plan.id;
    // Determine price based on gender
    const price = user?.gender === 'Female' && plan.priceFemale ? plan.priceFemale : plan.price;

    return (
      <Card key={plan.id} variant="elevated" style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.planPrice, { color: colors.primary }]}>LKR {price.toFixed(2)}</Text>
            <Text style={[styles.planDuration, { color: colors.textSecondary }]}>{plan.durationDays} days</Text>
          </View>
        </View>
        <Text style={[styles.planDescription, { color: colors.textSecondary }]}>{plan.description}</Text>
        <View style={styles.planMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{plan.durationDays} days access</Text>
          </View>
        </View>
        <Button
          title={isActive ? 'Current Plan' : 'Select Plan'}
          onPress={() => !isActive && confirmPurchase(plan)}
          disabled={isActive || isPurchasing}
          loading={isPurchasing}
          fullWidth
          variant={isActive ? 'outline' : 'primary'}
          icon={isActive ? 'checkmark-circle' : 'card-outline'}
          style={styles.planButton}
        />
      </Card>
    );
  };

  const renderHistory = () => {
    if (!history.length) {
      return (
        <Text style={[styles.emptyHistoryText, { color: colors.textSecondary }]}>No membership history yet.</Text>
      );
    }

    return history.map((membership) => (
      <Card key={membership._id || membership.id} variant="outlined" style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <Text style={[styles.historyPlan, { color: colors.text }]}>{membership.planName}</Text>
          <View style={[
            styles.historyStatus,
            membership.status === 'active' ? { backgroundColor: colors.success + '20' } : { backgroundColor: colors.textSecondary + '30' }
          ]}>
            <Text style={[styles.historyStatusText, { color: colors.text }]}>
              {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.historyDates, { color: colors.textSecondary }]}>
          {formatDate(new Date(membership.startDate), 'MMM dd, yyyy')} - {formatDate(new Date(membership.endDate), 'MMM dd, yyyy')}
        </Text>
        <Text style={[styles.historyAmount, { color: colors.text }]}>
          Paid LKR {membership.amount.toFixed(2)} {membership.currency?.toUpperCase()}
        </Text>
      </Card>
    ));
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.text }]}>
          Loading membership details...
        </Text>
      </View>
    );
  }

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
          <BackButton style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Membership Plans</Text>
            <Text style={styles.headerSubtitle}>Choose the plan that fits you</Text>
          </View>
          <View style={styles.planCountBadge}>
            <Text style={styles.planCountText}>{plans.length}</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIconContainer}>
            <Ionicons
              name={activeMembership ? "checkmark-circle" : "card-outline"}
              size={24}
              color={activeMembership ? "#38D9A9" : "rgba(255,255,255,0.7)"}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <Text style={styles.statusValue}>
              {activeMembership ? activeMembership.planName : 'No Active Plan'}
            </Text>
          </View>
          {activeMembership && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#087F5B" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Membership */}
        {renderActiveMembership()}

        {/* Available Plans */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Plans</Text>
          {plans.map(renderPlanCard)}
        </View>

        {/* Membership History */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Membership History</Text>
          {renderHistory()}
        </View>

        {/* Processing State */}
        {processingPayment && !paymentCompleted && !showWebView && (
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
            <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>Your membership has been activated.</Text>
          </Card>
        )}

        {/* PayHere WebView Modal */}
        <Modal
          visible={showWebView}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            if (!processingPayment) {
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
                          setProcessingPayment(false);
                          setPurchasingPlanId('');
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
                  setProcessingPayment(false);
                  Alert.alert(
                    'Payment Cancelled',
                    'Your payment was cancelled. You can try again.',
                    [{ text: 'OK' }]
                  );
                }}
                onClose={() => {
                  setShowWebView(false);
                  setProcessingPayment(false);
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  planCountBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCountText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  statusValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  activeBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[4],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  loaderText: {
    marginTop: theme.spacing[4],
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'center',
  },
  loaderSubtext: {
    marginTop: theme.spacing[2],
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  activeCard: {
    marginBottom: theme.spacing[6],
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  activeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  activeInfo: {
    flex: 1,
  },
  activeTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: theme.spacing[1],
    letterSpacing: -0.3,
  },
  activeSubtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing[1],
  },
  dateValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing[10],
    marginBottom: theme.spacing[6],
  },
  emptyIcon: {
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing[2],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
    lineHeight: 22,
    opacity: 0.8,
  },
  section: {
    marginBottom: theme.spacing[8],
  },
  planCard: {
    marginBottom: theme.spacing[4],
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    letterSpacing: -0.3,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  planDuration: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing[1],
  },
  planDescription: {
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing[4],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
  },
  planMeta: {
    flexDirection: 'row',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  metaText: {
    fontSize: theme.typography.fontSize.sm,
  },
  planButton: {
    marginTop: theme.spacing[2],
  },
  historyCard: {
    marginBottom: theme.spacing[3],
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  historyPlan: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  historyStatus: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  historyStatusActive: {
  },
  historyStatusInactive: {
  },
  historyStatusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  historyDates: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing[1],
  },
  historyAmount: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyHistoryText: {
    fontSize: theme.typography.fontSize.md,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing[4],
  },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[12],
    minHeight: 200,
    marginTop: theme.spacing[6],
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  successIcon: {
    marginBottom: theme.spacing[4],
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: theme.spacing[4],
    textAlign: 'center',
    letterSpacing: -0.5,
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

export default MembershipPlansScreen;
