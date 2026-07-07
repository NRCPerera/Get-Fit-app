import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { instructorAPI } from '../../api/instructor.api';
import { getFileUrl } from '../../utils/helpers';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { screenStyles, headerStyles } from '../../styles/shared';
import BackButton from '../../components/common/BackButton';

const InstructorDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const { id } = route.params || {};

  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Subscription state (paid personal training)
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  // Allocation state (free instructor assignment)
  const [isAllocated, setIsAllocated] = useState(false);
  const [checkingAllocation, setCheckingAllocation] = useState(true);
  const [allocating, setAllocating] = useState(false);
  // Track if member is allocated to a DIFFERENT instructor
  const [allocatedToOther, setAllocatedToOther] = useState(null); // null or { name, userId }

  const load = useCallback(async () => {
    try {
      setError('');
      const instRes = await instructorAPI.getInstructorById(id);

      const inst = instRes?.data?.instructor || instRes?.data || instRes;

      setInstructor(inst);

      // Check subscription and allocation status using instructor's userId
      const instructorUserId = inst?.userId || inst?.user?._id;
      if (instructorUserId) {
        // Check subscription status
        try {
          const subRes = await instructorAPI.checkSubscriptionStatus(instructorUserId);
          const subData = subRes?.data || subRes;
          setIsSubscribed(subData?.isSubscribed || false);
        } catch (e) {
          setIsSubscribed(false);
        }

        // Check member's current allocation (to any instructor)
        try {
          const currentAllocRes = await instructorAPI.getMyCurrentAllocation();
          const currentAllocData = currentAllocRes?.data || currentAllocRes;
          if (currentAllocData?.hasAllocation && currentAllocData?.allocation) {
            const allocInstructorId = currentAllocData.allocation.instructorId;
            if (allocInstructorId === instructorUserId) {
              // Allocated to THIS instructor
              setIsAllocated(true);
              setAllocatedToOther(null);
            } else {
              // Allocated to a DIFFERENT instructor
              setIsAllocated(false);
              setAllocatedToOther({
                name: currentAllocData?.instructor?.name || 'another instructor',
                userId: allocInstructorId
              });
            }
          } else {
            setIsAllocated(false);
            setAllocatedToOther(null);
          }
        } catch (e) {
          setIsAllocated(false);
          setAllocatedToOther(null);
        }
      } else {
        setIsSubscribed(false);
        setIsAllocated(false);
        setAllocatedToOther(null);
      }
      setCheckingSubscription(false);
      setCheckingAllocation(false);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load instructor');
      setCheckingSubscription(false);
      setCheckingAllocation(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Refresh when returning from payment screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.paymentSuccess) {
        load();
        navigation.setParams({ paymentSuccess: undefined });
      }
    });

    return unsubscribe;
  }, [navigation, route.params, load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  // Handle paid subscription (personal training)
  const handleSubscribe = () => {
    if (!instructor) return;

    const instructorUserId = instructor?.userId || instructor?.user?._id;
    if (!instructorUserId) {
      Alert.alert('Error', 'Instructor user ID not found');
      return;
    }

    const instructorName = instructor?.name || instructor?.user?.name || 'Instructor';

    navigation.navigate('SubscriptionPayment', {
      instructorId: id,
      instructorUserId: instructorUserId,
      instructorName: instructorName,
      instructorMonthlyRate: instructor?.monthlyRate || 0,
      instructorSpecialty: instructor?.specialty || instructor?.specializations?.[0] || 'Fitness'
    });
  };

  const handleUnsubscribe = async () => {
    const instructorUserId = instructor?.userId || instructor?.user?._id;
    if (!instructorUserId) {
      Alert.alert('Error', 'Instructor user ID not found');
      return;
    }

    Alert.alert(
      'Unsubscribe from Personal Training',
      'Are you sure you want to unsubscribe from this instructor\'s personal training?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubscribing(true);
              await instructorAPI.unsubscribeFromInstructor(instructorUserId);
              setIsSubscribed(false);
              Alert.alert('Success', 'Successfully unsubscribed from personal training');
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to unsubscribe');
            } finally {
              setSubscribing(false);
            }
          }
        }
      ]
    );
  };

  // Handle free allocation
  const handleAllocate = async () => {
    const instructorUserId = instructor?.userId || instructor?.user?._id;
    if (!instructorUserId) {
      Alert.alert('Error', 'Instructor user ID not found');
      return;
    }

    Alert.alert(
      'Choose Instructor',
      `Are you sure you want to choose ${instructor?.name || instructor?.user?.name || 'this instructor'} as your instructor?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setAllocating(true);
              await instructorAPI.allocateToInstructor(instructorUserId);
              setIsAllocated(true);
              setAllocatedToOther(null);
              Alert.alert('Success', 'You have been successfully allocated to this instructor!');
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to allocate to instructor');
            } finally {
              setAllocating(false);
            }
          }
        }
      ]
    );
  };

  const handleDeallocate = async () => {
    const instructorUserId = instructor?.userId || instructor?.user?._id;
    if (!instructorUserId) {
      Alert.alert('Error', 'Instructor user ID not found');
      return;
    }

    Alert.alert(
      'Remove Instructor',
      'Are you sure you want to remove this instructor as your assigned instructor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setAllocating(true);
              await instructorAPI.deallocateFromInstructor(instructorUserId);
              setIsAllocated(false);
              setAllocatedToOther(null);
              Alert.alert('Success', 'Successfully removed instructor allocation');
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to remove allocation');
            } finally {
              setAllocating(false);
            }
          }
        }
      ]
    );
  };

  const handleMessage = () => {
    if (!instructor) return;

    const instructorUserId = instructor?.userId || instructor?.user?._id;
    const instructorName = instructor?.name || instructor?.user?.name || 'Instructor';
    const profilePicture = instructor?.user?.profilePicture || instructor?.profilePicture;
    const profilePictureUrl = profilePicture ? getFileUrl(profilePicture) : null;

    navigation.navigate('Chat', {
      recipientId: instructorUserId,
      recipientName: instructorName,
      recipientPicture: profilePictureUrl,
      recipientRole: 'instructor',
    });
  };

  if (loading && !instructor) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading instructor...</Text>
      </View>
    );
  }

  const instructorName = instructor?.name || instructor?.user?.name || 'Instructor';
  const instructorEmail = instructor?.email || instructor?.user?.email;

  const profilePicture = instructor?.user?.profilePicture || instructor?.profilePicture;
  const profilePictureUrl = profilePicture ? getFileUrl(profilePicture) : null;

  const beforePhotoUrl = instructor?.beforePhoto ? getFileUrl(instructor.beforePhoto) : null;
  const afterPhotoUrl = instructor?.afterPhoto ? getFileUrl(instructor.afterPhoto) : null;

  const initials = instructorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isAvailable = instructor?.isAvailable !== false;
  const acceptingMembers = instructor?.acceptingMembers !== false;

  return (
    <SafeAreaView style={[screenStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={screenStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton style={styles.backButton} color={colors.text} />
        </View>

        {error && (
          <Card variant="outlined" style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </Card>
        )}

        {instructor && (
          <Card variant="elevated" style={styles.profileCard}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {profilePictureUrl ? (
                  <Image
                    source={{ uri: profilePictureUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
                  </View>
                )}
                {isAvailable && (
                  <View style={[styles.availableBadge, { backgroundColor: colors.background, borderColor: colors.background }]}>
                    <View style={[styles.availableDot, { backgroundColor: colors.success }]} />
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]}>{instructorName}</Text>
                </View>
                {instructorEmail && (
                  <Text style={[styles.email, { color: colors.textSecondary }]}>{instructorEmail}</Text>
                )}
                {instructor.specialty && (
                  <View style={styles.specialtyRow}>
                    <Ionicons name="fitness-outline" size={14} color={colors.primary} />
                    <Text style={[styles.specialty, { color: colors.primary }]}>{instructor.specialty}</Text>
                  </View>
                )}
              </View>
            </View>

            {instructor.bio && (
              <Text style={[styles.bio, { color: colors.textSecondary }]}>{instructor.bio}</Text>
            )}

            {/* Allocation Section (Free - Choose as your instructor) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructor Allocation</Text>
                <Text style={[styles.freeBadge, { backgroundColor: colors.success + '20', color: colors.success }]}>FREE</Text>
              </View>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Choose this instructor as your assigned gym instructor for guidance and support.
                {' '}You can only be allocated to one instructor at a time.
              </Text>

              {isAllocated ? (
                /* Currently allocated to THIS instructor */
                <Button
                  title={allocating ? 'Removing...' : 'My Instructor ✓'}
                  onPress={handleDeallocate}
                  disabled={allocating}
                  loading={allocating}
                  variant="danger"
                  fullWidth
                  icon="checkmark-circle"
                  size="lg"
                  style={styles.allocationButton}
                />
              ) : allocatedToOther ? (
                /* Already allocated to a DIFFERENT instructor */
                <View style={[styles.allocatedElsewhereBanner, { backgroundColor: colors.info + '12', borderColor: colors.info + '30' }]}>
                  <Ionicons name="information-circle" size={20} color={colors.info} />
                  <View style={styles.allocatedElsewhereContent}>
                    <Text style={[styles.allocatedElsewhereTitle, { color: colors.text }]}>
                      You are currently allocated to {allocatedToOther.name}
                    </Text>
                    <Text style={[styles.allocatedElsewhereDesc, { color: colors.textSecondary }]}>
                      Remove your current allocation first to choose this instructor
                    </Text>
                  </View>
                </View>
              ) : !acceptingMembers ? (
                /* Instructor not accepting new members */
                <View style={[styles.notAcceptingBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
                  <Ionicons name="information-circle" size={18} color={colors.warning} />
                  <Text style={[styles.notAcceptingText, { color: colors.warning }]}>
                    This instructor is not accepting new members right now
                  </Text>
                </View>
              ) : (
                /* Free to allocate */
                <Button
                  title={checkingAllocation ? 'Loading...' : allocating ? 'Allocating...' : 'Choose as My Instructor'}
                  onPress={handleAllocate}
                  disabled={allocating || checkingAllocation}
                  loading={allocating || checkingAllocation}
                  variant="primary"
                  fullWidth
                  icon="person-add-outline"
                  size="lg"
                  style={styles.allocationButton}
                />
              )}
            </View>

            {/* Subscription Section (Paid Personal Training) */}
            {instructor.monthlyRate > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="star-outline" size={18} color={colors.warning} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Training</Text>
                  <Text style={[styles.paidBadge, { backgroundColor: colors.warning + '20', color: colors.warning }]}>
                    LKR {instructor.monthlyRate}/mo
                  </Text>
                </View>
                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                  Subscribe for personalized training plans, direct messaging, and dedicated support.
                </Text>

                <View style={styles.subscriptionActions}>
                  <Button
                    title={
                      checkingSubscription
                        ? 'Loading...'
                        : subscribing
                          ? (isSubscribed ? 'Unsubscribing...' : 'Processing...')
                          : (isSubscribed ? 'Subscribed ✓' : 'Subscribe for Personal Training')
                    }
                    onPress={isSubscribed ? handleUnsubscribe : handleSubscribe}
                    disabled={subscribing || checkingSubscription}
                    loading={subscribing || checkingSubscription}
                    variant={isSubscribed ? 'danger' : 'secondary'}
                    fullWidth={!isSubscribed}
                    icon={isSubscribed ? 'checkmark-circle' : 'card-outline'}
                    size="lg"
                    style={isSubscribed ? styles.subscribeButtonSmall : styles.subscribeButton}
                  />

                  {/* Message Button - Only visible when subscribed */}
                  {isSubscribed && !checkingSubscription && (
                    <Button
                      title="Message"
                      onPress={handleMessage}
                      variant="secondary"
                      icon="chatbubble-outline"
                      size="lg"
                      style={styles.messageButton}
                    />
                  )}
                </View>
              </View>
            )}

            {/* Details Grid */}
            <View style={[styles.detailsGrid, { borderTopColor: colors.border }]}>
              {instructor.specialty && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="fitness-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Specialty</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{instructor.specialty}</Text>
                  </View>
                </View>
              )}
              {instructor.experience !== undefined && instructor.experience !== null && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="trophy-outline" size={20} color={colors.warning} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Experience</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{instructor.experience} years</Text>
                  </View>
                </View>
              )}
              {instructor.certifications && instructor.certifications.length > 0 && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.secondary + '15' }]}>
                    <Ionicons name="ribbon-outline" size={20} color={colors.secondary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Certifications</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{instructor.certifications.length}</Text>
                  </View>
                </View>
              )}
              {instructor.monthlyRate !== undefined && instructor.monthlyRate > 0 && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="cash-outline" size={20} color={colors.success} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Monthly Rate</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{`LKR ${instructor.monthlyRate}`}</Text>
                  </View>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Before/After Transformation Photos */}
        {(beforePhotoUrl || afterPhotoUrl) && (
          <Card variant="elevated" style={styles.transformationCard}>
            <View style={styles.transformationHeader}>
              <Ionicons name="images-outline" size={24} color={colors.primary} />
              <Text style={[styles.transformationTitle, { color: colors.text }]}>Client Transformations</Text>
            </View>
            <Text style={[styles.transformationSubtitle, { color: colors.textSecondary }]}>
              See the amazing results achieved by this instructor's clients
            </Text>

            <View style={styles.transformationPhotosContainer}>
              {beforePhotoUrl && (
                <View style={styles.transformationPhotoWrapper}>
                  <Text style={[styles.transformationPhotoLabel, { color: colors.text }]}>Before</Text>
                  <Image
                    source={{ uri: beforePhotoUrl }}
                    style={styles.transformationPhoto}
                    resizeMode="cover"
                  />
                </View>
              )}
              {afterPhotoUrl && (
                <View style={styles.transformationPhotoWrapper}>
                  <Text style={[styles.transformationPhotoLabel, { color: colors.text }]}>After</Text>
                  <Image
                    source={{ uri: afterPhotoUrl }}
                    style={styles.transformationPhoto}
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[4],
    padding: theme.spacing[3],
  },
  errorText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  profileCard: {
    marginBottom: theme.spacing[6],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[4],
    gap: theme.spacing[4],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  availableBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  availableDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
  },
  profileInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    flexWrap: 'wrap',
    marginBottom: theme.spacing[1],
  },
  name: {
    flex: 1,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  email: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing[1],
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  specialty: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  bio: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    marginBottom: theme.spacing[4],
  },
  // Section styles for allocation & subscription
  sectionContainer: {
    marginTop: theme.spacing[3],
    marginBottom: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    flex: 1,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    marginBottom: theme.spacing[3],
  },
  freeBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  paidBadge: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  notAcceptingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    borderRadius: 12,
    borderWidth: 1,
  },
  notAcceptingText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  allocatedElsewhereBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
    borderRadius: 12,
    borderWidth: 1,
  },
  allocatedElsewhereContent: {
    flex: 1,
  },
  allocatedElsewhereTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 4,
  },
  allocatedElsewhereDesc: {
    fontSize: theme.typography.fontSize.xs,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.xs,
  },
  allocationButton: {
    // full width handled by fullWidth prop
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
  },
  subscribeButton: {
    flex: 1,
  },
  subscribeButtonSmall: {
    flex: 1,
  },
  messageButton: {
    flex: 1,
  },
  detailsGrid: {
    marginTop: theme.spacing[4],
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    gap: theme.spacing[4],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  detailIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.xs,
    marginBottom: theme.spacing[1],
  },
  detailValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  transformationCard: {
    marginBottom: theme.spacing[6],
  },
  transformationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  transformationTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  transformationSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing[4],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  transformationPhotosContainer: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  transformationPhotoWrapper: {
    flex: 1,
  },
  transformationPhotoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  transformationPhoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
});

export default InstructorDetailScreen;

