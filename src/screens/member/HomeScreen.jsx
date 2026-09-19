import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  StatusBar,
  AppState,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';

import { ScaleTouchable as TouchableOpacity, MotionView } from '../../components/common/Motion';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useTheme } from '../../context/ThemeContext';
import { membershipAPI } from '../../api/membership.api';
import { scheduleAPI } from '../../api/schedule.api';
import { paymentAPI } from '../../api/payment.api';
import { getUnreadCount } from '../../api/message.api';
import { workoutAPI } from '../../api/workout.api';
import { fetchUserProfile } from '../../store/slices/userSlice';
import { formatDate } from '../../utils/helpers';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  const [workoutCategory, setWorkoutCategory] = useState('all');

  // Get profile from Redux
  const { profile } = useSelector((state) => state.user);

  const [selectedCategory, setSelectedCategory] = useState('beginner');
  const [activeMembership, setActiveMembership] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [customWorkouts, setCustomWorkouts] = useState({
    beginner: [],
    intermediate: [],
    advanced: [],
    warmup: [],
    warmdown: [],
  });
  const appState = useRef(AppState.currentState);

  // Time-aware greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

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
      // Fetch profile from Redux, and other data from APIs
      const [membershipRes, scheduleRes, paymentRes, workoutsRes] = await Promise.all([
        membershipAPI.getMyMemberships().catch(() => null),
        scheduleAPI.getMySchedules().catch(() => null),
        paymentAPI.getPaymentHistory().catch(() => null),
        workoutAPI.getPublicWorkouts().catch(() => null),
      ]);

      // Dispatch profile fetch to refresh from Redux
      await dispatch(fetchUserProfile());

      setActiveMembership(membershipRes?.data?.activeMembership || null);
      setSchedules(scheduleRes?.data?.items || []);
      setPayments(paymentRes?.data?.items || []);

      // Set workouts from API response
      if (workoutsRes?.data?.grouped) {
        const g = workoutsRes.data.grouped;
        setCustomWorkouts({
          beginner: g.beginner || [],
          intermediate: g.intermediate || [],
          advanced: g.advanced || [],
          warmup: g.warmup || [],
          warmdown: g.warmdown || [],
        });
      } else if (workoutsRes?.data?.items) {
        // Fallback: group workouts manually if grouped is not provided
        const items = workoutsRes.data.items;
        setCustomWorkouts({
          beginner: items.filter((w) => w.difficulty === 'beginner'),
          intermediate: items.filter((w) => w.difficulty === 'intermediate'),
          advanced: items.filter((w) => w.difficulty === 'advanced'),
          warmup: items.filter((w) => w.difficulty === 'warmup'),
          warmdown: items.filter((w) => w.difficulty === 'warmdown'),
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
  }, [dispatch, fetchUnreadMessages]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen for push notifications to update unread count
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data?.type === 'message') {
        fetchUnreadMessages();
      }
    });

    return () => subscription.remove();
  }, [fetchUnreadMessages]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
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
      .filter((s) => !s.startDate || new Date(s.startDate) >= new Date())
      .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
      .slice(0, 3);
  }, [schedules]);

  const handleWorkoutPress = (workout) => {
    // Navigate to custom workout detail screen with the workout data
    navigation.navigate('CustomWorkoutDetail', { workout });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return colors.success;
      case 'intermediate':
        return colors.warning;
      case 'advanced':
        return colors.error;
      case 'warmup':
        return colors.accent || '#06B6D4';
      case 'warmdown':
        return colors.secondary || '#8B5CF6';
      default:
        return colors.textSecondary;
    }
  };

  const quickStats = [
    {
      id: 'plan',
      label: 'Membership',
      value: activeMembership ? 'Active' : 'Inactive',
      subValue: activePlanName,
      icon: 'sparkles',
      accentColor: activeMembership ? colors.success : colors.warning,
      accentBg: activeMembership
        ? (colors.successBg || colors.success + '15')
        : (colors.warningBg || colors.warning + '15'),
      action: () => navigation.navigate('MembershipPlans'),
    },
    {
      id: 'schedules',
      label: 'My Schedules',
      value: schedules.length.toString(),
      subValue: `${upcomingSchedules.length} Upcoming`,
      icon: 'calendar',
      accentColor: colors.info,
      accentBg: colors.infoBg || colors.info + '15',
      action: () => navigation.navigate('Schedules'),
    },
    {
      id: 'payments',
      label: 'Wallet',
      value: payments.length.toString(),
      subValue: 'Transactions',
      icon: 'wallet',
      accentColor: colors.primary,
      accentBg: colors.primaryLight || colors.primary + '15',
      action: () => navigation.navigate('Instructors', { screen: 'PaymentHistory' }),
    },
    {
      id: 'progress',
      label: 'Activity',
      value: '85%',
      subValue: 'Weekly Goal',
      icon: 'trending-up',
      accentColor: colors.accent || '#06B6D4',
      accentBg: (colors.accent || '#06B6D4') + '15',
      action: () => navigation.navigate('ProgressTracking'),
    },
  ];

  const quickActions = [
    {
      id: 'workouts',
      label: 'Schedules',
      icon: 'calendar-outline',
      color: colors.primary,
      bg: colors.primary + '16',
      action: () => navigation.navigate('Schedules'),
    },
    {
      id: 'trainers',
      label: 'Trainers',
      icon: 'people-outline',
      color: colors.secondary,
      bg: colors.secondary + '16',
      action: () => navigation.navigate('Instructors'),
    },
    {
      id: 'progress',
      label: 'Progress',
      icon: 'trending-up-outline',
      color: colors.accent || '#06B6D4',
      bg: (colors.accent || '#06B6D4') + '16',
      action: () => navigation.navigate('ProgressTracking'),
    },
    {
      id: 'plans',
      label: 'Plans',
      icon: 'shield-checkmark-outline',
      color: colors.success,
      bg: colors.success + '16',
      action: () => navigation.navigate('MembershipPlans'),
    },
  ];

  const renderPlanCard = (plan) => {
    const diffColor = getDifficultyColor(plan.difficulty);
    return (
      <TouchableOpacity
        key={plan._id}
        activeOpacity={0.88}
        style={styles.planCardContainer}
        onPress={() => handleWorkoutPress(plan)}
      >
        <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Top category accent bar */}
          <View style={[styles.planTopBar, { backgroundColor: diffColor }]} />

          <View style={styles.planCardInner}>
            <View style={styles.planHeader}>
              <View style={[styles.planIcon, { backgroundColor: diffColor + '18' }]}>
                <Ionicons name="fitness" size={20} color={diffColor} />
              </View>
              <View style={styles.planBadgesRow}>
                {plan.duration ? (
                  <View style={[styles.planBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.backgroundSecondary }]}>
                    <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
                    <Text style={[styles.planBadgeText, { color: colors.textSecondary }]}>{plan.duration}</Text>
                  </View>
                ) : null}
                <View style={[styles.difficultyBadge, { backgroundColor: diffColor + '18' }]}>
                  <Text style={[styles.difficultyBadgeText, { color: diffColor }]}>
                    {plan.difficulty?.charAt(0).toUpperCase() + plan.difficulty?.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.planContent}>
              <Text style={[styles.planName, { color: colors.text }]} numberOfLines={1}>{plan.name}</Text>
              <Text style={[styles.planDesc, { color: colors.textSecondary }]} numberOfLines={2}>{plan.description}</Text>
            </View>

            <View style={[styles.planFooter, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.borderLight }]}>
              <View style={styles.planWorkoutsTag}>
                <Ionicons name="repeat-outline" size={13} color={colors.textTertiary} />
                <Text style={[styles.planWorkouts, { color: colors.textSecondary }]}>
                  {plan.workoutsPerWeek || 'Routine'}
                </Text>
              </View>
              <View style={[styles.planArrowBtn, { backgroundColor: colors.primary + '14' }]}>
                <Text style={[styles.planStartText, { color: colors.primary }]}>View</Text>
                <Ionicons name="chevron-forward" size={12} color={colors.primary} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <Loading />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Atmospheric Brand Header Background */}
      <View style={styles.bgDecoration} pointerEvents="none">
        <LinearGradient
          colors={colors.accentGradient || [colors.primaryDark, colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.9 }}
          style={styles.bgGradient}
        />
        {/* Subtle decorative glow highlights */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.profileRow}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarWrap}>
              <Avatar
                source={profile?.profileImage || profile?.profilePicture || profile?.avatar}
                name={displayName}
                size="md"
              />
            </View>
            <View style={styles.greetingWrap}>
              <Text style={styles.subGreeting}>{greetingTime} 👋</Text>
              <Text style={styles.greeting} numberOfLines={1}>{displayName}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionGlassBtn}
              onPress={() => navigation.navigate('Messages')}
              accessibilityLabel="Messages"
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
              {unreadMessages > 0 && (
                <View style={[styles.messageBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.messageBadgeText}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionGlassBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              <View style={[styles.notificationDot, { backgroundColor: colors.error }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* VIP Digital Membership Card */}
        <View style={styles.passSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('MembershipPlans')}
            style={styles.membershipCardWrapper}
          >
            <LinearGradient
              colors={
                activeMembership
                  ? [colors.primaryDark, colors.primary, colors.secondary]
                  : [colors.secondaryDark || '#4C1D95', colors.primaryDark, colors.primary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.membershipPass}
            >
              {/* Internal pass decorative orbs */}
              <View style={styles.passOrb1} />
              <View style={styles.passOrb2} />

              <View style={styles.passTopRow}>
                <View style={styles.passBadge}>
                  <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                  <Text style={styles.passBadgeText}>
                    {activeMembership ? 'GETFIT VIP' : 'GETFIT PASS'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: activeMembership
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(245, 158, 11, 0.28)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusPulseDot,
                      { backgroundColor: activeMembership ? '#34D399' : '#FBBF24' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: activeMembership ? '#34D399' : '#FBBF24' },
                    ]}
                  >
                    {activeMembership ? 'ACTIVE' : 'EXPLORE'}
                  </Text>
                </View>
              </View>

              <View style={styles.passCenter}>
                <Text style={styles.passTitle}>{activePlanName}</Text>
                <Text style={styles.passSubtitle} numberOfLines={2}>
                  {activeMembership
                    ? `Renews on ${formatDate(new Date(activeMembership.endDate), 'MMM dd, yyyy')}`
                    : 'Unlock certified trainers, custom workout schedules & VIP perks'}
                </Text>
              </View>

              <View style={styles.passFooter}>
                <View style={styles.passActionPill}>
                  <Text style={styles.passActionText}>
                    {activeMembership ? 'Manage Membership' : 'Explore All Plans'}
                  </Text>
                  <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                </View>
                <Ionicons
                  name={activeMembership ? 'shield-checkmark' : 'shield-outline'}
                  size={26}
                  color="rgba(255, 255, 255, 0.75)"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={[styles.mainContent, { backgroundColor: colors.background }]}>
          {/* Error Banner if fetch failed */}
          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorBg || '#FEF2F2', borderColor: colors.error + '40' }]}>
              <Ionicons name="alert-circle" size={18} color={colors.error} />
              <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity onPress={loadData} style={[styles.retryBtn, { backgroundColor: colors.error }]}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Quick Feature Shortcuts */}
          <View style={styles.quickActionsContainer}>
            {quickActions.map((qa) => (
              <TouchableOpacity
                key={qa.id}
                activeOpacity={0.82}
                style={styles.quickActionItem}
                onPress={qa.action}
              >
                <View style={[styles.quickActionIconCircle, { backgroundColor: qa.bg }]}>
                  <Ionicons name={qa.icon} size={22} color={qa.color} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Dashboard Metrics Matrix (2x2 Grid) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Dashboard Overview</Text>
              </View>
            </View>

            <View style={styles.gridContainer}>
              {quickStats.map((stat, index) => (
                <TouchableOpacity
                  key={stat.id}
                  activeOpacity={0.88}
                  style={styles.gridItemWrapper}
                  onPress={stat.action}
                >
                  <MotionView
                    delay={index * 50}
                    style={[
                      styles.gridItem,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.gridTopRow}>
                      <View style={[styles.gridIcon, { backgroundColor: stat.accentBg }]}>
                        <Ionicons name={stat.icon} size={18} color={stat.accentColor} />
                      </View>
                      <View
                        style={[
                          styles.gridArrow,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.06)'
                              : colors.backgroundSecondary,
                          },
                        ]}
                      >
                        <Ionicons name="chevron-forward" size={13} color={colors.textTertiary} />
                      </View>
                    </View>
                    <View style={styles.gridInfo}>
                      <Text style={[styles.gridValue, { color: colors.text }]} numberOfLines={1}>
                        {stat.value}
                      </Text>
                      <Text style={[styles.gridLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {stat.label}
                      </Text>
                      <Text style={[styles.gridSub, { color: stat.accentColor }]} numberOfLines={1}>
                        {stat.subValue}
                      </Text>
                    </View>
                  </MotionView>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upcoming Workout Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: colors.accent || '#06B6D4' }]} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Up Next</Text>
              </View>
              <TouchableOpacity
                style={[styles.seeAllPill, { backgroundColor: colors.primary + '12' }]}
                onPress={() => navigation.navigate('Schedules')}
              >
                <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {upcomingSchedules.length > 0 ? (
              upcomingSchedules.map((schedule, index) => (
                <TouchableOpacity
                  key={schedule._id || index}
                  activeOpacity={0.88}
                  style={[styles.scheduleItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() =>
                    navigation.navigate('Schedules', {
                      screen: 'ScheduleDetail',
                      params: { id: schedule._id, fromHome: true },
                    })
                  }
                >
                  <View style={styles.scheduleLeft}>
                    <View
                      style={[
                        styles.scheduleTimeBox,
                        {
                          backgroundColor: isDark ? colors.backgroundSecondary : colors.primaryLight,
                        },
                      ]}
                    >
                      <Text style={[styles.scheduleDay, { color: colors.primary }]}>
                        {schedule.startDate ? new Date(schedule.startDate).getDate() : '—'}
                      </Text>
                      <Text style={[styles.scheduleMonth, { color: colors.primary }]}>
                        {schedule.startDate
                          ? new Date(schedule.startDate).toLocaleString('default', { month: 'short' })
                          : 'NOW'}
                      </Text>
                    </View>
                    <View style={styles.scheduleTextWrap}>
                      <Text style={[styles.scheduleName, { color: colors.text }]} numberOfLines={1}>
                        {schedule.name}
                      </Text>
                      <View style={styles.scheduleMetaRow}>
                        <View
                          style={[
                            styles.metaPill,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255,255,255,0.06)'
                                : colors.backgroundSecondary,
                            },
                          ]}
                        >
                          <Ionicons name="barbell-outline" size={12} color={colors.textSecondary} />
                          <Text style={[styles.scheduleMetaText, { color: colors.textSecondary }]}>
                            {schedule.exercises?.length || 0} exercises
                          </Text>
                        </View>
                        {schedule.difficulty ? (
                          <View
                            style={[
                              styles.metaPill,
                              {
                                backgroundColor:
                                  getDifficultyColor(schedule.difficulty) + '18',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.scheduleMetaText,
                                {
                                  color: getDifficultyColor(schedule.difficulty),
                                  fontWeight: '700',
                                },
                              ]}
                            >
                              {schedule.difficulty}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                  <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="play" size={15} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.emptySchedule, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="calendar-outline" size={28} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Workouts Scheduled</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Plan your next sweat session to stay on track
                </Text>
                <Button
                  title="Create Schedule"
                  size="sm"
                  variant="primary"
                  icon="add-circle-outline"
                  style={{ marginTop: 14 }}
                  onPress={() => navigation.navigate('Schedules')}
                />
              </View>
            )}
          </View>

          {/* Recommended Workout Programs Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.sectionDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>For You</Text>
              </View>
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsScroll}
            >
              {['all', 'warmup', 'beginner', 'intermediate', 'advanced', 'warmdown'].map((category) => {
                const isSelected = workoutCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    activeOpacity={0.8}
                    onPress={() => setWorkoutCategory(category)}
                    style={[
                      styles.categoryPill,
                      isSelected
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {category === 'all' ? 'All Workouts' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Horizontal Workout Cards */}
            {(workoutCategory === 'all'
              ? Object.values(customWorkouts).some((plans) => plans?.length > 0)
              : customWorkouts[workoutCategory]?.length > 0) ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
              >
                {(workoutCategory === 'all' || workoutCategory === 'warmup') &&
                  (customWorkouts.warmup || []).map(renderPlanCard)}
                {(workoutCategory === 'all' || workoutCategory === 'beginner') &&
                  (customWorkouts.beginner || []).map(renderPlanCard)}
                {(workoutCategory === 'all' || workoutCategory === 'intermediate') &&
                  (customWorkouts.intermediate || []).map(renderPlanCard)}
                {(workoutCategory === 'all' || workoutCategory === 'advanced') &&
                  (customWorkouts.advanced || []).map(renderPlanCard)}
                {(workoutCategory === 'all' || workoutCategory === 'warmdown') &&
                  (customWorkouts.warmdown || []).map(renderPlanCard)}
              </ScrollView>
            ) : (
              <View style={[styles.emptySchedule, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.secondary + '15' }]}>
                  <Ionicons name="fitness-outline" size={28} color={colors.secondary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {workoutCategory === 'all'
                    ? 'No workout programs yet'
                    : `No ${workoutCategory} workouts`}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Check back soon or explore other workout categories
                </Text>
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
  },
  bgDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    zIndex: 0,
  },
  bgGradient: {
    flex: 1,
  },
  glowOrb1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(34, 211, 238, 0.22)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 140,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
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
    paddingTop: Platform.OS === 'ios' ? 58 : 50,
    paddingBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarWrap: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 24,
  },
  greetingWrap: {
    flex: 1,
  },
  subGreeting: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionGlassBtn: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  messageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  messageBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  passSection: {
    paddingHorizontal: 18,
    marginBottom: 6,
  },
  membershipCardWrapper: {
    borderRadius: 24,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  membershipPass: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  passOrb1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  passOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  passTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  passBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  passCenter: {
    marginBottom: 16,
  },
  passTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  passSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  passFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
  },
  passActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  passActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mainContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    marginTop: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  quickActionItem: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  quickActionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionLink: {
    fontWeight: '700',
    fontSize: 13,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItemWrapper: {
    width: '50%',
    padding: 6,
  },
  gridItem: {
    padding: 14,
    borderRadius: 18,
    minHeight: 132,
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gridTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridInfo: {
    marginTop: 10,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scheduleItem: {
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  scheduleTimeBox: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 54,
  },
  scheduleDay: {
    fontSize: 18,
    fontWeight: '800',
  },
  scheduleMonth: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleTextWrap: {
    flex: 1,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scheduleMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emptySchedule: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  categoryPillsScroll: {
    gap: 8,
    paddingVertical: 6,
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  hScroll: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  planCardContainer: {
    width: 240,
    marginRight: 14,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  planTopBar: {
    height: 4,
    width: '100%',
  },
  planCardInner: {
    padding: 16,
    minHeight: 195,
    justifyContent: 'space-between',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  planContent: {
    marginVertical: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  planDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  planWorkoutsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  planWorkouts: {
    fontSize: 12,
    fontWeight: '600',
  },
  planArrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planStartText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default HomeScreen;