import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, StatusBar, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import Loading from '../../components/common/Loading';
import { userAPI } from '../../api/user.api';
import { membershipAPI } from '../../api/membership.api';
import { scheduleAPI } from '../../api/schedule.api';
import { paymentAPI } from '../../api/payment.api';
import { getUnreadCount } from '../../api/message.api';
import { workoutAPI } from '../../api/workout.api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { screenStyles, headerStyles } from '../../styles/shared';



const { width } = Dimensions.get('window');
// Workouts are now fetched from the backend API

const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [selectedCategory, setSelectedCategory] = useState('beginner');
  const [profile, setProfile] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [customWorkouts, setCustomWorkouts] = useState({ beginner: [], intermediate: [], advanced: [] });
  const appState = useRef(AppState.currentState);



  // Fetch unread message count

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadMessages(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.log('Error fetching unread count:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const [profileRes, membershipRes, scheduleRes, paymentRes, workoutsRes] = await Promise.all([
        userAPI.getProfile().catch(() => null),
        membershipAPI.getMyMemberships().catch(() => null),
        scheduleAPI.getMySchedules().catch(() => null),
        paymentAPI.getPaymentHistory().catch(() => null),
        workoutAPI.getPublicWorkouts().catch(() => null),
      ]);

      setProfile(profileRes?.data?.user || profileRes?.data || null);
      setActiveMembership(membershipRes?.data?.activeMembership || null);
      setSchedules(scheduleRes?.data?.items || []);
      setPayments(paymentRes?.data?.items || []);

      // Set workouts from API response
      if (workoutsRes?.data?.grouped) {
        setCustomWorkouts(workoutsRes.data.grouped);
      } else if (workoutsRes?.data?.items) {
        // Fallback: group workouts manually if grouped is not provided
        const items = workoutsRes.data.items;
        setCustomWorkouts({
          beginner: items.filter(w => w.difficulty === 'beginner'),
          intermediate: items.filter(w => w.difficulty === 'intermediate'),
          advanced: items.filter(w => w.difficulty === 'advanced')
        });
      }

      // Also fetch unread messages
      await fetchUnreadMessages();
    } catch (err) {
      setError('Unable to load latest data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUnreadMessages]);

  useEffect(() => { loadData(); }, [loadData]);
  // Listen for push notifications to update unread count
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      if (data?.type === 'message') {
        fetchUnreadMessages();
      }
    });

    return () => subscription.remove();
  }, [fetchUnreadMessages]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchUnreadMessages();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [fetchUnreadMessages]);

  // Poll for unread messages and refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUnreadMessages();

      const pollInterval = setInterval(() => {
        fetchUnreadMessages();
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(pollInterval);
    }, [fetchUnreadMessages])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const displayName = useMemo(() => profile?.name || profile?.firstName || 'Athlete', [profile]);
  const activePlanName = activeMembership?.planName || 'No active plan';

  const upcomingSchedules = useMemo(() => {
    return schedules
      .filter(s => !s.startDate || new Date(s.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
      .slice(0, 3);
  }, [schedules]);

  const handleWorkoutPress = (workout) => {
    // Navigate to custom workout detail screen with the workout data
    navigation.navigate('CustomWorkoutDetail', { workout });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.textSecondary;
    }
  };



  const renderPlanCard = (plan) => (
    <TouchableOpacity
      key={plan._id}
      activeOpacity={0.9}
      style={styles.planCardContainer}
      onPress={() => handleWorkoutPress(plan)}
    >
      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={[styles.planCard, { borderColor: colors.border }]}
      >
        <View style={styles.planHeader}>
          <View style={[styles.planIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="fitness" size={24} color={colors.primary} />
          </View>
          <View style={[styles.planBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.planBadgeText, { color: colors.primary }]}>{plan.duration}</Text>
          </View>
        </View>
        <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
        <Text style={[styles.planDesc, { color: colors.textSecondary }]} numberOfLines={2}>{plan.description}</Text>
        <View style={styles.planFooter}>
          <Text style={[styles.planWorkouts, { color: colors.textSecondary }]}>{plan.workoutsPerWeek}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(plan.difficulty) + '20' }]}>
            <Text style={[styles.difficultyBadgeText, { color: getDifficultyColor(plan.difficulty) }]}>
              {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const quickStats = [
    {
      id: 'plan',
      label: 'Membership',
      value: activeMembership ? 'Active' : 'Inactive',
      subValue: activePlanName,
      icon: 'sparkles',
      gradient: theme.colors.gradients.primary,
      action: () => navigation.navigate('MembershipPlans'),
    },
    {
      id: 'schedules',
      label: 'My Schedules',
      value: schedules.length.toString(),
      subValue: 'Upcoming',
      icon: 'calendar',
      gradient: theme.colors.gradients.blue,
      action: () => navigation.navigate('Schedules'),
    },
    {
      id: 'payments',
      label: 'Wallet',
      value: payments.length.toString(),
      subValue: 'Transactions',
      icon: 'wallet',
      gradient: theme.colors.gradients.secondary,
      action: () => navigation.navigate('Instructors', { screen: 'PaymentHistory' }),
    },
    {
      id: 'progress',
      label: 'Activity',
      value: '85%',
      subValue: 'Weekly Goal',
      icon: 'trending-up',
      gradient: theme.colors.gradients.warm,
      action: () => navigation.navigate('ProgressTracking'),
    }
  ];

  if (loading) return <Loading />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Decorative Background */}
      <View style={styles.bgDecoration}>
        <LinearGradient
          colors={isDark ? [colors.primary, colors.background] : [colors.primary, colors.background]}
          style={styles.bgGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.bgCircle1, { backgroundColor: colors.primaryLight + '30' }]} />
        <View style={[styles.bgCircle2, { backgroundColor: colors.secondary + '20' }]} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {displayName}</Text>
            <Text style={styles.subGreeting}>Ready to work out today?</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubbles" size={22} color="#fff" />
              {unreadMessages > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={24} color="#fff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.gridContainer}>
          {quickStats.map((stat) => (
            <TouchableOpacity
              key={stat.id}
              activeOpacity={0.9}
              style={styles.gridItemWrapper}
              onPress={stat.action}
            >
              <LinearGradient
                colors={stat.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gridItem}
              >
                <View style={styles.gridIcon}>
                  <Ionicons name={stat.icon} size={24} color="#fff" />
                </View>
                <View>
                  <Text style={styles.gridValue}>{stat.value}</Text>
                  <Text style={styles.gridLabel}>{stat.label}</Text>
                  <Text style={styles.gridSub}>{stat.subValue}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Active Subscription Banner */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('MembershipPlans')}
          >
            <LinearGradient
              colors={activeMembership ? theme.colors.gradients.success : ['#374151', '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.membershipBanner}
            >
              <View style={styles.bannerContent}>
                <View>
                  <Text style={styles.bannerLabel}>Current Plan</Text>
                  <Text style={styles.bannerTitle}>{activePlanName}</Text>
                  <Text style={styles.bannerDate}>
                    {activeMembership
                      ? `Renews ${formatDate(new Date(activeMembership.endDate), 'MMM dd')}`
                      : 'Tap to view membership options'}
                  </Text>
                </View>
                <View style={styles.bannerIcon}>
                  <Ionicons
                    name={activeMembership ? "shield-checkmark" : "shield-outline"}
                    size={32}
                    color="#fff"
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Upcoming Workout Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Up Next</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Schedules')}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((schedule, index) => (
                <TouchableOpacity
                  key={schedule._id || index}
                  style={[styles.scheduleItem, { backgroundColor: colors.surface }]}
                  onPress={() => navigation.navigate('Schedules', { screen: 'ScheduleDetail', params: { id: schedule._id, fromHome: true } })}
                >
                  <View style={styles.scheduleLeft}>
                    <View style={[styles.scheduleTimeBox, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.scheduleDay, { color: colors.primary }]}>
                        {schedule.startDate ? new Date(schedule.startDate).getDate() : 'Today'}
                      </Text>
                      <Text style={[styles.scheduleMonth, { color: colors.primary }]}>
                        {schedule.startDate ? new Date(schedule.startDate).toLocaleString('default', { month: 'short' }) : 'Now'}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.scheduleName, { color: colors.text }]}>{schedule.name}</Text>
                      <Text style={[styles.scheduleDetails, { color: colors.textSecondary }]}>
                        {schedule.exercises?.length || 0} exercises • {schedule.difficulty || 'General'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="play-circle" size={32} color={colors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptySchedule, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming workouts</Text>
                <Button
                  title="Create Schedule"
                  size="sm"
                  variant="outline"
                  style={{ marginTop: 12 }}
                  onPress={() => navigation.navigate('Schedules')}
                />
              </View>
            )}
          </View>

          {/* Recommended Plans Horizontal Scroll */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>For You</Text>
            {(customWorkouts.beginner.length > 0 || customWorkouts.intermediate.length > 0 || customWorkouts.advanced.length > 0) ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
              >
                {customWorkouts.beginner.map(renderPlanCard)}
                {customWorkouts.intermediate.map(renderPlanCard)}
                {customWorkouts.advanced.map(renderPlanCard)}
              </ScrollView>
            ) : (
              <View style={[styles.emptySchedule, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <Ionicons name="fitness-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workout programs available yet</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  bgDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    zIndex: 0,
  },
  bgGradient: {
    flex: 1,
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  bgCircle2: {
    position: 'absolute',
    top: 50,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(118, 69, 69, 0.8)',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    // backgroundColor, borderColor applied inline
    borderWidth: 1,
  },
  messageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    // backgroundColor, borderColor applied inline
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  messageBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  gridItemWrapper: {
    width: '50%',
    padding: 8,
  },
  gridItem: {
    padding: 16,
    borderRadius: 24,
    height: 160,
    justifyContent: 'space-between',
    // shadowColor applied inline
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  mainContent: {
    // backgroundColor applied inline
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  membershipBanner: {
    padding: 24,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 30,
    // shadowColor applied inline
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerDate: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  bannerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // color applied inline
  },
  sectionLink: {
    // color applied inline
    fontWeight: '600',
    fontSize: 14,
  },
  scheduleItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scheduleTimeBox: {
    // backgroundColor applied inline
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleDay: {
    fontSize: 18,
    fontWeight: 'bold',
    // color applied inline
  },
  scheduleMonth: {
    fontSize: 12,
    // color applied inline
    textTransform: 'uppercase',
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    // color applied inline
    marginBottom: 2,
  },
  scheduleDetails: {
    fontSize: 13,
    // color applied inline
  },
  emptySchedule: {
    // backgroundColor, borderColor applied inline
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  emptyText: {
    // color applied inline
    marginTop: 8,
    fontSize: 14,
  },
  hScroll: {
    paddingRight: 20,
    gap: 16,
  },
  planCardContainer: {
    width: 200,
    marginRight: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 24,
    height: 220,
    justifyContent: 'space-between',
    borderWidth: 1,
    // borderColor applied inline
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planIcon: {
    padding: 8,
    // backgroundColor applied inline
    borderRadius: 12,
  },
  planBadge: {
    // backgroundColor applied inline
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    // color applied inline
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    // color applied inline
    marginTop: 12,
  },
  planDesc: {
    fontSize: 13,
    // color applied inline
    lineHeight: 18,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  planWorkouts: {
    fontSize: 12,
    fontWeight: '600',
    // color applied inline
  },
  difficulyBadge: {
    paddinHorizontal: 8,
    paddigVertical: 4,
    bordeRadius: 8,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  }
});

export default HomeScreen;