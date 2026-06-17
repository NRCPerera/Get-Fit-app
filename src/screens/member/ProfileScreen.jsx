import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme'; // Static theme for StyleSheet
import { useTheme } from '../../context/ThemeContext'; // Dynamic theme for component
import { scheduleAPI } from '../../api/schedule.api';
import { fetchUserProfile } from '../../store/slices/userSlice';
import { logoutUser } from '../../store/slices/authSlice';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import { getFileUrl } from '../../utils/helpers';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ThemeSelector from '../../components/common/ThemeSelector';
import { screenStyles, headerStyles, spacing } from '../../styles/shared';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { user: authUser, loading: authLoading } = useSelector((s) => s.auth);
  const { profile } = useSelector((s) => s.user);
  const { isDark, theme: dynamicTheme } = useTheme(); // Get dynamic theme for colors
  const colors = dynamicTheme.colors; // Use dynamic colors

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      // Fetch profile from Redux and schedules from API
      const schedulesRes = await scheduleAPI.getMySchedules().catch(err => {
        return { data: { items: [] } };
      });

      // Dispatch profile fetch to refresh from Redux
      await dispatch(fetchUserProfile());

      // Set schedules data
      const schedulesData = schedulesRes?.data?.items || schedulesRes?.items || [];
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const onLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser()).unwrap();
            } catch (e) {
              Alert.alert('Logged out', 'You have been logged out.');
            }
          }
        }
      ]
    );
  };

  const onDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for safety
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account, workout history, schedules, and all associated data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setLoading(true);
                      await userAPI.deleteAccount();
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been permanently deleted.',
                        [{ text: 'OK', onPress: () => dispatch(logoutUser()) }]
                      );
                    } catch (e) {
                      Alert.alert('Error', e?.response?.data?.message || 'Failed to delete account. Please try again.');
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  if (loading && !profile) return <Loading />;
  if (error && !profile) return <EmptyState title="Unable to load profile" subtitle={error} />;

  const u = profile || authUser || {};
  const displayName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Member';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Calculate stats from backend data
  const totalSchedules = schedules.length || 0;
  const activeSchedules = schedules.filter(s => s.isActive !== false).length || 0;

  // Calculate workout days (active schedules with exercises)
  const totalWorkouts = schedules.reduce((sum, schedule) => {
    const exercisesCount = schedule.exercises?.length || 0;
    return sum + exercisesCount;
  }, 0);

  // Calculate streak (consecutive days with schedules)
  // For now, we'll show a basic streak based on active schedules
  // A more accurate streak would require workout completion tracking
  const streakDays = Math.min(activeSchedules, 30); // Cap at 30 for display

  // Calculate progress (percentage of schedules completed or active)
  // This is a simplified progress metric - could be enhanced with actual completion tracking
  const progressPercentage = totalSchedules > 0
    ? Math.round((activeSchedules / totalSchedules) * 100)
    : 0;

  const stats = [
    {
      label: 'Workouts',
      value: totalWorkouts > 0 ? totalWorkouts.toString() : '0',
      icon: 'fitness',
      color: theme.colors.primary
    },
    {
      label: 'Streak',
      value: streakDays > 0 ? `${streakDays} day${streakDays !== 1 ? 's' : ''}` : '0 days',
      icon: 'flame',
      color: theme.colors.warning
    },
    {
      label: 'Schedules',
      value: totalSchedules.toString(),
      icon: 'calendar',
      color: theme.colors.secondary
    },
    {
      label: 'Progress',
      value: `${progressPercentage}%`,
      icon: 'trending-up',
      color: theme.colors.success
    },
  ];

  const menuItems = [
    { icon: 'create-outline', label: 'Edit Profile', color: theme.colors.primary, screen: 'EditProfile' },
    { icon: 'chatbubbles-outline', label: 'Messages', color: theme.colors.info, screen: 'Messages' },
    { icon: 'card-outline', label: 'Membership Plans', color: theme.colors.secondary, screen: 'MembershipPlans' },
    { icon: 'analytics-outline', label: 'Progress Tracking', color: theme.colors.primary, screen: 'ProgressTracking' },
    { icon: 'medical-outline', label: 'Medical Information', color: theme.colors.secondary, screen: 'MedicalForm' },
    { icon: 'restaurant-outline', label: 'Nutrition Plans', color: theme.colors.success, screen: 'Nutrition' },
    { icon: 'notifications-outline', label: 'Notifications', color: theme.colors.warning, screen: 'Notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', color: colors.primary, screen: 'HelpSupport' },
    { icon: 'information-circle-outline', label: 'About', color: colors.secondary, screen: 'About' },
  ];

  return (
    <ScrollView
      style={[screenStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={screenStyles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {u.profilePicture ? (
            <Image
              source={{ uri: getFileUrl(u.profilePicture) || u.profilePicture }}
              style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.editAvatarButton, { backgroundColor: colors.primary, borderColor: colors.background }]}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{u.email || '—'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: u.isActive === false ? colors.textSecondary : colors.success }
          ]} />
          <Text style={[styles.statusText, { color: colors.success }]}>
            {u.isActive === false ? 'Inactive' : 'Active Member'}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <Card key={index} variant="elevated" style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </Card>
        ))}
      </View>

      {/* Account Information */}
      <Card variant="elevated" style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Account Information</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoRowLeft}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Role</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {(u.role || 'member').toString().charAt(0).toUpperCase() + (u.role || 'member').toString().slice(1)}
            </Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <View style={styles.infoRowLeft}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Member Since</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>
            {u.createdAt
              ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.infoRow}>
          <View style={styles.infoRowLeft}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Email</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{u.email || '—'}</Text>
        </View>
        {u.phone && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.infoLabel, { color: colors.text }]}>Phone</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.textSecondary }]}>{u.phone}</Text>
            </View>
          </>
        )}
      </Card>

      {/* Menu Items */}
      <Card variant="elevated" style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Menu</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => item.screen && navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Theme Settings */}
      <ThemeSelector />

      {/* Logout Button */}
      <Button
        title="Logout"
        onPress={onLogout}
        variant="danger"
        fullWidth
        icon="log-out-outline"
        style={styles.logoutButton}
      />

      {/* Delete Account Button */}
      <TouchableOpacity
        style={styles.deleteAccountButton}
        onPress={onDeleteAccount}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
        <Text style={[styles.deleteAccountText, { color: colors.error }]}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
    paddingTop: theme.spacing[6],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing[4],
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 40,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 4,
    borderColor: 'rgba(220, 38, 38, 0.15)',
  },
  avatarPlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    // backgroundColor applied inline
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    // backgroundColor applied inline
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    // color applied inline
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[6],
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing[4],
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[2],
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    // color applied inline
    marginBottom: theme.spacing[1],
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    // color applied inline
  },
  infoCard: {
    marginBottom: theme.spacing[6],
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    // color applied inline
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    // color applied inline
    textAlign: 'right',
  },
  roleBadge: {
    // backgroundColor applied inline
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    // color applied inline
  },
  divider: {
    height: 1,
    // backgroundColor applied inline
    marginVertical: theme.spacing[1],
  },
  menuCard: {
    marginBottom: theme.spacing[6],
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    gap: theme.spacing[3],
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    // color applied inline
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingVertical: theme.spacing[3],
    marginBottom: theme.spacing[8],
  },
  deleteAccountText: {
    fontSize: theme.typography.fontSize.sm,
    // color applied inline
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default ProfileScreen;
