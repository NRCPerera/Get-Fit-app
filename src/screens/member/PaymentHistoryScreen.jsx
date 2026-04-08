import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { paymentAPI } from '../../api/payment.api';
import BackButton from '../../components/common/BackButton';

const PaymentHistoryScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await paymentAPI.getPaymentHistory();
      const data = res?.data?.items || res?.items || res?.data || [];
      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const formatAmount = (payment) => {
    const currency = payment.currency ? payment.currency.toUpperCase() : 'LKR';
    return `${currency} ${Number(payment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getPaymentType = (payment) => {
    const type = payment.metadata?.type || (payment.instructorId ? 'instructor' : 'general');
    if (type === 'membership') return 'Membership';
    if (type === 'subscription') return 'Subscription';
    if (payment.instructorId) return 'Instructor';
    return 'Payment';
  };

  const getDescription = (payment) => {
    if (payment.metadata?.planName) return payment.metadata.planName;
    if (payment.description) return payment.description;
    return '—';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'pending': return 'time';
      case 'failed': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return colors.warning;
      case 'failed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getTypeIcon = (payment) => {
    const type = payment.metadata?.type || (payment.instructorId ? 'instructor' : 'general');
    switch (type) {
      case 'membership': return 'card';
      case 'subscription': return 'person';
      default: return 'wallet';
    }
  };

  const stats = useMemo(() => {
    const total = items.reduce((acc, item) => acc + (item.amount || 0), 0);
    const completed = items.filter(i => i.status === 'completed').length;
    const pending = items.filter(i => i.status === 'pending').length;
    return { total, completed, pending, count: items.length };
  }, [items]);

  const filteredItems = filter === 'all'
    ? items
    : items.filter(i => i.status === filter);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} activeOpacity={0.85}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconBg, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Ionicons name={getTypeIcon(item)} size={24} color={getStatusColor(item.status)} />
        </View>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardType, { color: colors.text }]}>{getPaymentType(item)}</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={1}>{getDescription(item)}</Text>
          </View>
          <Text style={styles.cardAmount}>{formatAmount(item)}</Text>
        </View>
        <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.headerTitle}>Payment History</Text>
            <Text style={styles.headerSubtitle}>Track all your transactions</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{stats.count}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="wallet" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statValue}>LKR {(stats.total / 1000).toFixed(1)}K</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
        {['all', 'completed', 'pending'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              { backgroundColor: colors.backgroundSecondary },
              filter === f && styles.filterButtonActive
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              { color: colors.textSecondary },
              filter === f && styles.filterTextActive
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={filteredItems}
        keyExtractor={(i) => i._id || i.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1C7ED6"
          />
        }
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="wallet-outline" size={48} color="#1C7ED6" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Payments Yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {filter === 'all'
                ? 'Your payment history will appear here'
                : `No ${filter} payments found`}
            </Text>
          </View>
        ) : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: theme.spacing[2],
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[2],
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#DC2626',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing[4],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing[2],
  },
  error: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  listContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardLeft: {
    marginRight: theme.spacing[3],
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  cardInfo: {
    flex: 1,
    marginRight: theme.spacing[2],
  },
  cardType: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: -0.3,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing[2],
    borderTopWidth: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[6],
    marginTop: theme.spacing[8],
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: theme.spacing[2],
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
});

export default PaymentHistoryScreen;
