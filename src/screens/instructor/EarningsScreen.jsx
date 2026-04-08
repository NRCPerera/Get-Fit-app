import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { paymentAPI } from '../../api/payment.api';
import { instructorAPI } from '../../api/instructor.api';
import Loading from '../../components/common/Loading';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../utils/helpers';

const EarningsScreen = () => {
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalClients: 0,
    totalSessions: 0,
    avgRating: 0
  });

  const loadData = useCallback(async () => {
    try {
      const [earningsRes, statsRes] = await Promise.all([
        paymentAPI.getInstructorEarnings().catch(() => ({ data: { items: [], total: 0 } })),
        instructorAPI.getMyStats().catch(() => ({ data: { stats: null } }))
      ]);

      const earningsData = earningsRes?.data || earningsRes;
      const statsData = statsRes?.data?.stats || statsRes?.data?.data?.stats;

      const paymentsList = earningsData.items || earningsData.data?.items || [];
      setPayments(paymentsList);
      setStats(statsData || {
        totalEarnings: earningsData.total || 0,
        totalClients: 0,
        totalSessions: 0,
        avgRating: 0
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Calculate earnings based on period
  const periodEarnings = useMemo(() => {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredPayments = payments.filter(p => {
      const paymentDate = new Date(p.transactionDate || p.createdAt);
      return paymentDate >= startDate;
    });

    return filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments, period]);

  // Calculate monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const monthlyData = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.transactionDate || payment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          earnings: 0,
          sessions: 0
        };
      }
      
      monthlyData[monthKey].earnings += payment.amount || 0;
      monthlyData[monthKey].sessions += 1;
    });

    return Object.values(monthlyData)
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateB - dateA;
      })
      .slice(0, 6); // Show last 6 months
  }, [payments]);

  // Get recent earnings (last 10)
  const recentEarnings = useMemo(() => {
    return payments.slice(0, 10).map(payment => {
      // Try to get client name from userId (populated) or metadata
      let clientName = 'Client';
      if (payment.userId) {
        if (typeof payment.userId === 'object' && payment.userId.name) {
          clientName = payment.userId.name;
        } else if (typeof payment.userId === 'string') {
          clientName = 'Client';
        }
      } else if (payment.metadata?.clientName) {
        clientName = payment.metadata.clientName;
      }
      
      const description = payment.description || payment.metadata?.description || 'Training Session';
      
      return {
        id: payment._id,
        client: clientName,
        session: description,
        amount: payment.amount || 0,
        date: payment.transactionDate || payment.createdAt,
        status: payment.status || 'completed'
      };
    });
  }, [payments]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return formatDate(date, 'MMM dd, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  // Calculate total earnings and this month earnings (must be before early return)
  const totalEarnings = useMemo(() => {
    return stats.totalEarnings || payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [stats.totalEarnings, payments]);

  const thisMonthEarnings = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return payments
      .filter(p => {
        const paymentDate = new Date(p.transactionDate || p.createdAt);
        return paymentDate >= startOfMonth;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Loading />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Earnings Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your income and payment history</Text>
      </View>

      <View style={[styles.periodSelector, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={[styles.periodButton, period === 'week' && [styles.periodButtonActive, { backgroundColor: colors.card }]]}
          onPress={() => setPeriod('week')}
        >
          <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'week' && { color: colors.primary }]}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'month' && [styles.periodButtonActive, { backgroundColor: colors.card }]]}
          onPress={() => setPeriod('month')}
        >
          <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'month' && { color: colors.primary }]}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodButton, period === 'year' && [styles.periodButtonActive, { backgroundColor: colors.card }]]}
          onPress={() => setPeriod('year')}
        >
          <Text style={[styles.periodText, { color: colors.textSecondary }, period === 'year' && { color: colors.primary }]}>Year</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Ionicons name="cash" size={32} color={colors.primary} />
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(totalEarnings)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Earnings</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Ionicons name="calendar" size={32} color={colors.success} />
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(periodEarnings)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Earnings</Text>
        {recentEarnings.length > 0 ? (
          recentEarnings.map((earning) => (
            <View key={earning.id} style={[styles.earningCard, { backgroundColor: colors.card }]}>
              <View style={styles.earningHeader}>
                <View style={styles.earningInfo}>
                  <Text style={[styles.earningClient, { color: colors.text }]}>{earning.client}</Text>
                  <Text style={[styles.earningSession, { color: colors.textSecondary }]}>{earning.session}</Text>
                </View>
                <View style={styles.earningAmountContainer}>
                  <Text style={[styles.earningAmount, { color: colors.text }]}>{formatCurrency(earning.amount)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(earning.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(earning.status) }]}>
                      {earning.status}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.earningFooter, { borderTopColor: colors.border }]}>
                <View style={styles.earningDate}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.earningDateText, { color: colors.textSecondary }]}>{formatDateDisplay(earning.date)}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="cash-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No earnings yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Your earnings will appear here once clients make payments</Text>
          </View>
        )}
      </View>

      {monthlyBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Breakdown</Text>
          {monthlyBreakdown.map((month, index) => (
            <View key={index} style={[styles.monthCard, { backgroundColor: colors.card }]}>
              <View style={styles.monthHeader}>
                <Text style={[styles.monthName, { color: colors.text }]}>{month.month}</Text>
                <Text style={[styles.monthEarnings, { color: colors.primary }]}>{formatCurrency(month.earnings)}</Text>
              </View>
              <View style={styles.monthDetails}>
                <View style={styles.monthDetailItem}>
                  <Ionicons name="fitness-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.monthDetailText, { color: colors.textSecondary }]}>{month.sessions} {month.sessions === 1 ? 'payment' : 'payments'}</Text>
                </View>
                {month.sessions > 0 && (
                  <View style={styles.monthDetailItem}>
                    <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.monthDetailText, { color: colors.textSecondary }]}>
                      Avg: {formatCurrency(Math.round(month.earnings / month.sessions))}/payment
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="download-outline" size={20} color={colors.white} />
          <Text style={[styles.actionButtonText, { color: colors.white }]}>Export Statement</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Ionicons name="card-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Payment Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  periodButtonActive: {
    ...theme.shadows.sm,
  },
  periodText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  summaryValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  earningCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  earningInfo: {
    flex: 1,
  },
  earningClient: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  earningSession: {
    fontSize: theme.typography.fontSize.sm,
  },
  earningAmountContainer: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  earningFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
  },
  earningDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  earningDateText: {
    fontSize: theme.typography.fontSize.xs,
  },
  monthCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.medium,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  monthName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  monthEarnings: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  monthDetails: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  monthDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  monthDetailText: {
    fontSize: theme.typography.fontSize.sm,
  },
  emptyState: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  actionButtonSecondary: {
    borderWidth: 2,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default EarningsScreen;
