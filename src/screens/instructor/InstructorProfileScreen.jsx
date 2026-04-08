import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { instructorAPI } from '../../api/instructor.api';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ThemeSelector from '../../components/common/ThemeSelector';
import { getFileUrl } from '../../utils/helpers';

const InstructorProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const { user: authUser, loading: authLoading } = useSelector((s) => s.auth);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setError('');
      const res = await instructorAPI.getMyProfile();

      // Handle different response structures
      let instructorData = null;
      if (res?.data?.instructor) {
        instructorData = res.data.instructor;
      } else if (res?.data) {
        instructorData = res.data;
      } else if (res?.instructor) {
        instructorData = res.instructor;
      } else {
        instructorData = res;
      }


      // If the data has a nested user object, extract the fields to top level
      if (instructorData && instructorData.user && !instructorData.name) {
        instructorData.name = instructorData.user.name;
        instructorData.email = instructorData.user.email;
        instructorData.phone = instructorData.user.phone;
        instructorData.profilePicture = instructorData.user.profilePicture;
      }

      setProfile(instructorData);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Reload profile when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

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
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading && !profile) {
    return <Loading />;
  }

  // Only show error if we have an error AND no profile data at all
  // If we have profile data (even if incomplete), show it
  if (error && !profile && !authUser) {
    return <EmptyState title="Unable to load profile" subtitle={error} />;
  }

  // If we have an error but also have auth user data, show a warning but still render
  if (error && profile) {
  }

  // Use profile data or fallback to auth user
  const profileData = profile || {};

  // Extract user data if nested
  const userData = profileData.user || {};
  const stats = profileData.stats || {};

  // Get name, email, phone - check both top level and nested user object
  const name = profileData.name || userData.name || authUser?.name || 'Instructor';
  const email = profileData.email || userData.email || authUser?.email || '';
  const phone = profileData.phone || userData.phone || authUser?.phone || '';
  const avatarUrl = profileData.profilePicture || profileData.avatarUrl || userData.profilePicture || null;

  const certifications = profileData.certifications || [];
  const specializations = profileData.specializations || [];
  const specialty = profileData.specialty || specializations[0] || 'Fitness';
  const experience = profileData.experience || 0;
  const rating = stats.avgRating || 0;

  const displayStats = [
    {
      label: 'Total Clients',
      value: stats.totalClients?.toString() || '0',
      icon: 'people',
      color: colors.primary
    },
    {
      label: 'Total Sessions',
      value: stats.totalSessions?.toString() || '0',
      icon: 'fitness',
      color: colors.success
    },
    {
      label: 'Rating',
      value: rating ? rating.toFixed(1) : '0.0',
      icon: 'star',
      color: colors.warning
    },
    {
      label: 'Experience',
      value: experience ? `${experience} ${experience === 1 ? 'yr' : 'yrs'}` : '0 yrs',
      icon: 'trophy',
      color: colors.secondary
    },
  ];

  const menuItems = [
    { icon: 'create-outline', label: 'Edit Profile', color: colors.primary },
    { icon: 'chatbubbles-outline', label: 'Messages', color: colors.info, screen: 'Messages' },
    { icon: 'settings-outline', label: 'Settings', color: colors.textSecondary },
    { icon: 'document-text-outline', label: 'Certifications', color: colors.secondary },
    { icon: 'notifications-outline', label: 'Notifications', color: colors.warning, screen: 'Notifications' },
    { icon: 'help-circle-outline', label: 'Help & Support', color: colors.textSecondary },
    { icon: 'information-circle-outline', label: 'About', color: colors.textSecondary },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: getFileUrl(avatarUrl) || avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[styles.avatarText, { color: colors.white }]}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {rating > 0 && (
              <View style={[styles.ratingContainer, { backgroundColor: colors.card }]}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={[styles.ratingText, { color: colors.text }]}>{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{name}</Text>
            <Text style={[styles.profileSpecialization, { color: colors.textSecondary }]}>{specialty}</Text>
            {experience > 0 && (
              <View style={[styles.experienceBadge, { backgroundColor: colors.secondary + '20' }]}>
                <Ionicons name="trophy-outline" size={14} color={colors.secondary} />
                <Text style={[styles.experienceText, { color: colors.secondary }]}>{experience} {experience === 1 ? 'year' : 'years'} experience</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {profileData.bio && (
        <View style={[styles.bioSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.bioText, { color: colors.textSecondary }]}>{profileData.bio}</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        {displayStats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          {email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{email}</Text>
            </View>
          )}
          {phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>{phone}</Text>
            </View>
          )}
          {!email && !phone && (
            <Text style={[styles.noInfoText, { color: colors.textSecondary }]}>No contact information available</Text>
          )}
        </View>
      </View>

      {specializations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Specializations</Text>
          <View style={styles.certificationsContainer}>
            {specializations.map((spec, index) => (
              <View key={index} style={[styles.certificationBadge, { backgroundColor: colors.card }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.certificationText, { color: colors.text }]}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {certifications.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Certifications</Text>
          <View style={styles.certificationsContainer}>
            {certifications.map((cert, index) => (
              <View key={index} style={[styles.certificationBadge, { backgroundColor: colors.card }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.certificationText, { color: colors.text }]}>
                  {typeof cert === 'string' ? cert : cert.name || 'Certification'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu</Text>
        <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('EditProfile', { profile: profileData })}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuLabel, { color: colors.text }]}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {menuItems.slice(1).map((item, index) => (
            <TouchableOpacity
              key={index + 1}
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Theme Settings */}
      <ThemeSelector />

      <TouchableOpacity
        accessibilityLabel="Logout"
        accessibilityRole="button"
        onPress={onLogout}
        style={[styles.logoutBtn, { backgroundColor: colors.error }]}
        disabled={authLoading}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.white} />
        <Text style={[styles.logoutText, { color: colors.white }]}>{authLoading ? 'Logging out...' : 'Logout'}</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: theme.spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    ...theme.shadows.medium,
  },
  avatarText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  ratingText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  profileSpecialization: {
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.sm,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  experienceText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  infoCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.fontSize.md,
    flex: 1,
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  certificationText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  menuContainer: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    ...theme.shadows.medium,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs,
  },
  bioSection: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  bioText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
  },
  noInfoText: {
    fontSize: theme.typography.fontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.spacing.md,
  },
});

export default InstructorProfileScreen;


