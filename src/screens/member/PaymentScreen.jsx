import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, AppState, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { paymentAPI } from '../../api/payment.api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import BackButton from '../../components/common/BackButton';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('Membership');
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const appState = useRef(AppState.currentState);

  // Quick amount options
  const quickAmounts = [1000, 2500, 5000, 10000];

  // Check payment status when screen is focused (user returns from PayHere)
  useFocusEffect(
    React.useCallback(() => {
      if (paymentId && processing) {
        checkPaymentStatus();
      }
    }, [paymentId, processing])
  );

  // Monitor app state to check payment when user returns from browser
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        paymentId &&
        processing
      ) {
        checkPaymentStatus();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [paymentId, processing]);

  const checkPaymentStatus = async () => {
    if (!paymentId) return;

    try {
      const res = await paymentAPI.confirmPayment(paymentId);
      if (res?.data?.payment?.status === 'completed') {
        setProcessing(false);
        Alert.alert('Success', 'Payment completed successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else if (res?.data?.payment?.status === 'failed' || res?.data?.payment?.status === 'cancelled') {
        setProcessing(false);
        Alert.alert('Payment Failed', 'Your payment was not completed. Please try again.');
      }
    } catch (err) {
    }
  };

  const canPay = parseFloat(amount || '0') > 0 && !loading;

  const createIntent = async () => {
    try {
      setLoading(true);
      const res = await paymentAPI.createPaymentIntent({
        amount: parseFloat(amount),
        currency: 'LKR',
        description: purpose
      });

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
      setProcessing(true);

      // PayHere sandbox supports GET requests with query parameters
      // Build URL with all payment parameters
      const params = Object.keys(paymentParams)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(paymentParams[key])}`)
        .join('&');
      const fullPaymentUrl = `${paymentUrl}?${params}`;

      // Open PayHere payment page
      const canOpen = await Linking.canOpenURL(fullPaymentUrl);
      if (canOpen) {
        await Linking.openURL(fullPaymentUrl);
        Alert.alert(
          'Payment',
          'You will be redirected to PayHere to complete payment. Please return to this app after payment.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Cannot open payment page. Please check your internet connection.');
        setProcessing(false);
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to create payment intent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Gradient Header */}
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        {/* Decorative circles */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        
        <View style={styles.headerTop}>
          <BackButton style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Make Payment</Text>
            <Text style={styles.headerSubtitle}>Secure payment via PayHere</Text>
          </View>
          <View style={styles.secureIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
          </View>
        </View>

        {/* Payment Icon */}
        <View style={styles.headerIconContainer}>
          <View style={styles.headerIcon}>
            <Ionicons name="card" size={40} color="#DC2626" />
          </View>
          <Text style={styles.headerIconText}>Secure Payment</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Amount Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Select Amount</Text>
          <View style={styles.quickAmounts}>
            {quickAmounts.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.quickAmountBtn,
                  { backgroundColor: colors.white },
                  amount === String(amt) && styles.quickAmountBtnActive
                ]}
                onPress={() => setAmount(String(amt))}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quickAmountText,
                  { color: colors.text },
                  amount === String(amt) && styles.quickAmountTextActive
                ]}>
                  LKR {amt.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: colors.white }]}>
          <Input
            label="Amount (LKR)"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            leftIcon="cash-outline"
          />

          <Input
            label="Purpose"
            placeholder="e.g. Membership, Training"
            value={purpose}
            onChangeText={setPurpose}
            leftIcon="document-text-outline"
          />

          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={20} color="#DC2626" />
            </View>
            <Text style={[styles.infoText, { color: colors.text }]}>
              You will be redirected to PayHere's secure payment page to complete your transaction.
            </Text>
          </View>

          {/* Security Features */}
          <View style={[styles.securityFeatures, { borderTopColor: colors.border }]}>
            <View style={styles.securityItem}>
              <Ionicons name="lock-closed" size={16} color={colors.success} />
              <Text style={[styles.securityText, { color: colors.textSecondary }]}>256-bit SSL</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              <Text style={[styles.securityText, { color: colors.textSecondary }]}>PCI Compliant</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="card" size={16} color={colors.success} />
              <Text style={[styles.securityText, { color: colors.textSecondary }]}>Visa/Master</Text>
            </View>
          </View>

          <Button
            title={processing ? "Processing..." : "Proceed to Payment"}
            onPress={createIntent}
            disabled={!canPay || processing}
            loading={loading}
            fullWidth
            icon="lock-closed"
            size="lg"
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
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
    letterSpacing: 0.5,
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
  headerIconContainer: {
    alignItems: 'center',
  },
  headerIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerIconText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: theme.typography.fontWeight.medium,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  section: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[3],
    letterSpacing: 0.3,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAmountBtnActive: {
    backgroundColor: '#DC2626',
  },
  quickAmountText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  quickAmountTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    borderRadius: 20,
    padding: theme.spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DC2626' + '10',
    borderRadius: 16,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    gap: theme.spacing[3],
  },
  infoIconContainer: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  securityFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderTopWidth: 1,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  securityText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  submitButton: {
    marginTop: theme.spacing[2],
  },
});

export { PaymentScreen };
