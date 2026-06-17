import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image, AppState, Switch } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { instructorAPI } from '../../api/instructor.api';
import { scheduleAPI } from '../../api/schedule.api';
import { getUnreadCount } from '../../api/message.api';
import Loading from '../../components/common/Loading';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { getFileUrl } from '../../utils/helpers';
import { screenStyles, headerStyles } from '../../styles/shared';

const InstructorDashboardScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalSessions: 0,
    avgRating: 0,
    totalEarnings: 0
  });
  const [clients, setClients] = useState([]);
  const [allocatedMembers, setAllocatedMembers] = useState([]);
  const [acceptingMembers, setAcceptingMembers] = useState(true);
  const [togglingAccepting, setTogglingAccepting] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
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
      const [profileRes, statsRes, clientsRes, allocRes, schedulesRes] = await Promise.all([
        instructorAPI.getMyProfile().catch(() => ({ data: { instructor: null } })),
        instructorAPI.getMyStats().catch(() => ({ data: { stats: null } })),
        instructorAPI.getMyClients().catch(() => ({ data: { clients: [] } })),
        instructorAPI.getMyAllocatedMembers().catch(() => ({ data: { members: [], acceptingMembers: true } })),
        scheduleAPI.getMySchedules().catch(() => ({ data: { items: [] } }))
      ]);

      const profileData = profileRes?.data?.instructor || profileRes?.data?.data?.instructor;
      const statsData = statsRes?.data?.stats || statsRes?.data?.data?.stats;
      const clientsData = clientsRes?.data?.clients || clientsRes?.data?.data?.clients || [];
      const allocData = allocRes?.data?.members || allocRes?.members || [];
      const accepting = allocRes?.data?.acceptingMembers !== undefined ? allocRes.data.acceptingMembers : true;
      const schedulesData = schedulesRes?.data?.items || schedulesRes?.data?.data?.items || [];

      setProfile(profileData);
      setStats(statsData || {
        totalClients: 0,
        totalSessions: 0,
        avgRating: 0,
        totalEarnings: 0
      });
      setClients(Array.isArray(clientsData) ? clientsData.slice(0, 5) : []);
      setAllocatedMembers(Array.isArray(allocData) ? allocData : []);
      setAcceptingMembers(accepting);
      setSchedules(Array.isArray(schedulesData) ? schedulesData.slice(0, 5) : []);

      // Also fetch unread messages
      await fetchUnreadMessages();
    } catch (error) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchUnreadMessages]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Poll for unread messages when screen is focused
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

  const StatCard = ({ icon, label, value, color, onPress }) => (
    <Card
      variant="elevated"
      onPress={onPress}
      style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: color }]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Card>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Loading />
      </View>
    );
  }

  return (
    <ScrollView
      style={[screenStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[screenStyles.scrollContent, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back!</Text>
          <Text style={[headerStyles.title, { color: colors.text }]}>{profile?.name || 'Instructor'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Messages')}
            style={[styles.notificationButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="chatbubbles-outline" size={22} color={colors.text} />
            {unreadMessages > 0 && (
              <View style={[styles.messageBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.messageBadgeText}>
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={[styles.notificationButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          {profile?.profilePicture && (
            <Image
              source={{ uri: getFileUrl(profile.profilePicture) || profile.profilePicture }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="people"
          label="Total Clients"
          value={stats.totalClients || clients.length || 0}
          color={colors.primary}
          onPress={() => navigation.navigate('Clients', { screen: 'MyClients' })}
        />
        <StatCard
          icon="calendar"
          label="Schedules"
          value={schedules.length}
          color={colors.secondary}
          onPress={() => navigation.navigate('Schedules', { screen: 'InstructorSchedules' })}
        />
        <StatCard
          icon="cash"
          label="Earnings"
          value={formatCurrency(stats.totalEarnings)}
          color={colors.success}
          onPress={() => navigation.navigate('Earnings')}
        />
      </View>

      {/* Accepting Members Toggle */}
      <Card variant="elevated" style={styles.acceptingCard}>
        <View style={styles.acceptingCardContent}>
          <View style={styles.acceptingInfo}>
            <View style={[styles.acceptingIcon, { backgroundColor: acceptingMembers ? colors.success + '15' : colors.error + '15' }]}>
              <Ionicons
                name={acceptingMembers ? 'person-add' : 'person-remove'}
                size={22}
                color={acceptingMembers ? colors.success : colors.error}
              />
            </View>
            <View style={styles.acceptingTextContainer}>
              <Text style={[styles.acceptingTitle, { color: colors.text }]}>
                {acceptingMembers ? 'Accepting New Members' : 'Not Accepting Members'}
              </Text>
              <Text style={[styles.acceptingSubtitle, { color: colors.textSecondary }]}>
                {allocatedMembers.length} member{allocatedMembers.length !== 1 ? 's' : ''} allocated to you
              </Text>
            </View>
          </View>
          <Switch
            value={acceptingMembers}
            onValueChange={async (value) => {
              setTogglingAccepting(true);
              try {
                await instructorAPI.toggleAcceptingMembers(value);
                setAcceptingMembers(value);
              } catch (e) {
                // Failed to toggle
              } finally {
                setTogglingAccepting(false);
              }
            }}
            disabled={togglingAccepting}
            trackColor={{ false: colors.border, true: colors.success + '60' }}
            thumbColor={acceptingMembers ? colors.success : colors.textSecondary}
          />
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Card
            variant="elevated"
            onPress={() => navigation.navigate('Schedules', { screen: 'CreateSchedule' })}
            style={styles.actionCard}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Create Schedule</Text>
          </Card>
          <Card
            variant="elevated"
            onPress={() => navigation.navigate('Clients', { screen: 'MyClients' })}
            style={styles.actionCard}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.secondary + '15' }]}>
              <Ionicons name="people" size={28} color={colors.secondary} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>View Clients</Text>
          </Card>
          <Card
            variant="elevated"
            onPress={() => navigation.navigate('Messages')}
            style={styles.actionCard}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="chatbubbles" size={28} color={colors.info} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.text }]}>Messages</Text>
          </Card>
        </View>
      </View>

      {/* Recent Clients */}
      <View style={styles.section}>
        <View style={headerStyles.sectionHeader}>
          <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Recent Clients</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Clients', { screen: 'MyClients' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        {clients.length > 0 ? (
          <Card variant="elevated" style={styles.listCard}>
            {clients.map((client, index) => (
              <TouchableOpacity
                key={client._id}
                style={[
                  styles.listItem,
                  index < clients.length - 1 && [styles.listItemBorder, { borderBottomColor: colors.border }]
                ]}
                onPress={() => navigation.navigate('Clients', {
                  screen: 'ClientProgress',
                  params: { clientId: client._id }
                })}
                activeOpacity={0.7}
              >
                {client.profilePicture ? (
                  <Image
                    source={{ uri: getFileUrl(client.profilePicture) || client.profilePicture }}
                    style={styles.listItemAvatar}
                  />
                ) : (
                  <View style={[styles.listItemAvatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                    <Ionicons name="person" size={20} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>{client.name || 'Client'}</Text>
                  <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>{client.email || 'No email'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        ) : (
          <EmptyState
            icon={<Ionicons name="people-outline" size={48} color={colors.textSecondary} />}
            title="No clients yet"
            message="Start by creating schedules for your clients"
          />
        )}
      </View>

      {/* Recent Schedules */}
      <View style={styles.section}>
        <View style={headerStyles.sectionHeader}>
          <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Recent Schedules</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Schedules', { screen: 'InstructorSchedules' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        {schedules.length > 0 ? (
          <Card variant="elevated" style={styles.listCard}>
            {schedules.map((schedule, index) => (
              <TouchableOpacity
                key={schedule._id}
                style={[
                  styles.listItem,
                  index < schedules.length - 1 && [styles.listItemBorder, { borderBottomColor: colors.border }]
                ]}
                onPress={() => navigation.navigate('Schedules', {
                  screen: 'ScheduleDetail',
                  params: { id: schedule._id }
                })}
                activeOpacity={0.7}
              >
                <View style={[styles.scheduleIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="calendar" size={20} color={colors.primary} />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={[styles.listItemTitle, { color: colors.text }]}>{schedule.name || 'Untitled Schedule'}</Text>
                  <View style={styles.scheduleMeta}>
                    {schedule.scheduleType && (
                      <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.badgeText, { color: colors.primary }]}>
                          {schedule.scheduleType === '1-day' ? '1 Day' : schedule.scheduleType === '2-day' ? '2 Days' : '3 Days'}
                        </Text>
                      </View>
                    )}
                    {schedule.exercises && (
                      <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]}>
                        {schedule.exercises.length} {schedule.exercises.length === 1 ? 'exercise' : 'exercises'}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        ) : (
          <EmptyState
            icon={<Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />}
            title="No schedules yet"
            message="Create your first training schedule"
            actionLabel="Create Schedule"
            onAction={() => navigation.navigate('Schedules', { screen: 'CreateSchedule' })}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 2,
  },
  messageBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  greeting: {
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing[1],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[8],
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: theme.spacing[4],
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
  },
  section: {
    marginBottom: theme.spacing[8],
  },
  seeAll: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  actionCard: {
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    padding: theme.spacing[3],
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  actionLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  listItemBorder: {
    borderBottomWidth: 1,
  },
  listItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing[4],
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[4],
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[1],
  },
  listItemSubtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  scheduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginTop: theme.spacing[1],
  },
  badge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.md,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  acceptingCard: {
    marginBottom: theme.spacing[8],
    padding: theme.spacing[4],
  },
  acceptingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  acceptingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing[3],
  },
  acceptingIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptingTextContainer: {
    flex: 1,
  },
  acceptingTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  acceptingSubtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
});

export default InstructorDashboardScreen;
