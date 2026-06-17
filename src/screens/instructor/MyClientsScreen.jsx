import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, StatusBar, Platform, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { instructorAPI } from '../../api/instructor.api';
import { getFileUrl } from '../../utils/helpers';
import BackButton from '../../components/common/BackButton';

const MyClientsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  // Tab: 'allocated' or 'subscribed'
  const [activeTab, setActiveTab] = useState('allocated');

  // Subscribed clients (paid personal training)
  const [clients, setClients] = useState([]);

  // Allocated members (free)
  const [allocatedMembers, setAllocatedMembers] = useState([]);
  const [acceptingMembers, setAcceptingMembers] = useState(true);
  const [togglingAccepting, setTogglingAccepting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');

      // Load both clients and allocated members in parallel
      const [clientsRes, allocRes] = await Promise.all([
        instructorAPI.getMyClients(),
        instructorAPI.getMyAllocatedMembers()
      ]);

      const clientData = clientsRes?.data?.clients || clientsRes?.clients || [];
      setClients(clientData);

      const allocData = allocRes?.data?.members || allocRes?.members || [];
      setAllocatedMembers(allocData);

      const accepting = allocRes?.data?.acceptingMembers !== undefined
        ? allocRes.data.acceptingMembers
        : true;
      setAcceptingMembers(accepting);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        load();
      }
    }, [load, loading])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const handleToggleAccepting = async (value) => {
    setTogglingAccepting(true);
    try {
      await instructorAPI.toggleAcceptingMembers(value);
      setAcceptingMembers(value);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update status');
    } finally {
      setTogglingAccepting(false);
    }
  };

  const handleRemoveAllocatedMember = (member) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name || 'this member'} from your allocated members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await instructorAPI.removeAllocatedMember(member._id);
              setAllocatedMembers(prev => prev.filter(m => m._id !== member._id));
              Alert.alert('Success', 'Member removed successfully');
            } catch (e) {
              Alert.alert('Error', e?.response?.data?.message || 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const totalCount = activeTab === 'allocated' ? allocatedMembers.length : clients.length;

  if (loading && clients.length === 0 && allocatedMembers.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundSecondary }]}>
      <StatusBar barStyle="light-content" backgroundColor="#F59F00" />

      {/* Gradient Header */}
      <LinearGradient
        colors={['#F59F00', '#FCC419', '#FFE066']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTop}>
          <BackButton style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Members & Clients</Text>
            <Text style={styles.headerSubtitle}>Manage allocations & subscriptions</Text>
          </View>
        </View>

        {/* Stats Row in Header */}
        <View style={styles.statsRowHeader}>
          <View style={styles.statItemHeader}>
            <Ionicons name="people" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statValueHeader}>{allocatedMembers.length}</Text>
            <Text style={styles.statLabelHeader}>Allocated</Text>
          </View>
          <View style={styles.statDividerHeader} />
          <View style={styles.statItemHeader}>
            <Ionicons name="star" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statValueHeader}>{clients.length}</Text>
            <Text style={styles.statLabelHeader}>Subscribed</Text>
          </View>
          <View style={styles.statDividerHeader} />
          <View style={styles.statItemHeader}>
            <Ionicons name="stats-chart" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.statValueHeader}>{allocatedMembers.length + clients.length}</Text>
            <Text style={styles.statLabelHeader}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59F00" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'allocated' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveTab('allocated')}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'allocated' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'allocated' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Allocated ({allocatedMembers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'subscribed' && { backgroundColor: colors.warning }
            ]}
            onPress={() => setActiveTab('subscribed')}
          >
            <Ionicons
              name="star-outline"
              size={16}
              color={activeTab === 'subscribed' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'subscribed' ? '#FFFFFF' : colors.textSecondary }
            ]}>
              Subscribed ({clients.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accepting Members Toggle (only on allocated tab) */}
        {activeTab === 'allocated' && (
          <View style={[styles.acceptingToggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.acceptingToggleInfo}>
              <Ionicons
                name={acceptingMembers ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={acceptingMembers ? colors.success : colors.error}
              />
              <View style={styles.acceptingToggleText}>
                <Text style={[styles.acceptingTitle, { color: colors.text }]}>
                  {acceptingMembers ? 'Accepting New Members' : 'Not Accepting New Members'}
                </Text>
                <Text style={[styles.acceptingSubtitle, { color: colors.textSecondary }]}>
                  {acceptingMembers
                    ? 'Members can allocate themselves to you'
                    : 'Members cannot allocate to you right now'}
                </Text>
              </View>
            </View>
            <Switch
              value={acceptingMembers}
              onValueChange={handleToggleAccepting}
              disabled={togglingAccepting}
              trackColor={{ false: colors.border, true: colors.success + '60' }}
              thumbColor={acceptingMembers ? colors.success : colors.textSecondary}
            />
          </View>
        )}

        {/* Content based on active tab */}
        {activeTab === 'allocated' ? (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Allocated Members</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Members who have chosen you as their instructor (free allocation)
            </Text>

            {allocatedMembers.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No allocated members</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Members who choose you as their instructor will appear here
                </Text>
              </View>
            ) : (
              allocatedMembers.map((member) => (
                <View key={member._id || member.id} style={[styles.clientCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={styles.clientHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                      {member.profilePicture ? (
                        <Image source={{ uri: getFileUrl(member.profilePicture) || member.profilePicture }} style={styles.clientAvatar} />
                      ) : (
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {member.name?.charAt(0) || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={[styles.clientName, { color: colors.text }]}>{member.name || 'Member'}</Text>
                      <Text style={[styles.clientEmail, { color: colors.textSecondary }]}>{member.email || 'No email'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.statusText, { color: colors.primary }]}>Allocated</Text>
                    </View>
                  </View>

                  <View style={[styles.clientDetails, { borderTopColor: colors.border }]}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          Allocated {formatDate(member.allocatedAt)}
                        </Text>
                      </View>
                      {member.phone && (
                        <View style={styles.detailItem}>
                          <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{member.phone}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[styles.clientActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => navigation.navigate('Chat', {
                        recipientId: member._id || member.id,
                        recipientName: member.name || 'Member',
                        recipientPicture: member.profilePicture ? (getFileUrl(member.profilePicture) || member.profilePicture) : null,
                        recipientRole: 'member',
                      })}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.info} />
                      <Text style={[styles.actionText, { color: colors.info }]}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => navigation.navigate('ClientProgress', { clientId: member._id, clientName: member.name || member.email })}
                    >
                      <Ionicons name="document-text-outline" size={16} color={colors.warning} />
                      <Text style={[styles.actionText, { color: colors.warning }]}>Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.error + '10' }]}
                      onPress={() => handleRemoveAllocatedMember(member)}
                    >
                      <Ionicons name="person-remove-outline" size={16} color={colors.error} />
                      <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscribed Clients</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Members subscribed for personal training (paid)
            </Text>

            {clients.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                <Ionicons name="star-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No subscribed clients</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Members who subscribe to your personal training will appear here
                </Text>
              </View>
            ) : (
              clients.map((client) => (
                <View key={client._id || client.id} style={[styles.clientCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                  <View style={styles.clientHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.warning + '20' }]}>
                      {client.profilePicture ? (
                        <Image source={{ uri: getFileUrl(client.profilePicture) || client.profilePicture }} style={styles.clientAvatar} />
                      ) : (
                        <Text style={[styles.avatarText, { color: colors.warning }]}>
                          {client.name?.charAt(0) || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={[styles.clientName, { color: colors.text }]}>{client.name || 'Client'}</Text>
                      <Text style={[styles.clientEmail, { color: colors.textSecondary }]}>{client.email || 'No email'}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                      <Text style={[styles.statusText, { color: colors.success }]}>Subscribed</Text>
                    </View>
                  </View>

                  <View style={[styles.clientDetails, { borderTopColor: colors.border }]}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          Subscribed {formatDate(client.startDate || client.subscribedAt)}
                        </Text>
                      </View>
                      {(client.endDate || client.expiresAt) && (
                        <View style={styles.detailItem}>
                          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            Expires {formatDate(client.endDate || client.expiresAt)}
                          </Text>
                        </View>
                      )}
                    </View>
                    {client.phone && (
                      <View style={styles.detailRow}>
                        <View style={styles.detailItem}>
                          <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{client.phone}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={[styles.clientActions, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => navigation.navigate('Chat', {
                        recipientId: client._id || client.id,
                        recipientName: client.name || 'Client',
                        recipientPicture: client.profilePicture ? (getFileUrl(client.profilePicture) || client.profilePicture) : null,
                        recipientRole: 'member',
                      })}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colors.info} />
                      <Text style={[styles.actionText, { color: colors.info }]}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => navigation.navigate('CreateNutritionPlan', {
                        clientId: client._id || client.id,
                        clientName: client.name || client.email
                      })}
                    >
                      <Ionicons name="nutrition-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Nutrition</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => navigation.navigate('ClientProgress', { clientId: client._id, clientName: client.name || client.email })}
                    >
                      <Ionicons name="document-text-outline" size={16} color={colors.warning} />
                      <Text style={[styles.actionText, { color: colors.warning }]}>Progress</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: theme.spacing[5],
    borderBottomLeftRadius: theme.borderRadius['2xl'],
    borderBottomRightRadius: theme.borderRadius['2xl'],
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
    backgroundColor: 'rgba(255,255,255,0.3)',
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
  statsRowHeader: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
  },
  statItemHeader: {
    flex: 1,
    alignItems: 'center',
  },
  statDividerHeader: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: theme.spacing[2],
  },
  statValueHeader: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: theme.spacing[1],
  },
  statLabelHeader: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[3],
    margin: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing[2],
  },
  error: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  // Tab switcher
  tabContainer: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing[4],
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing[1],
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  // Accepting toggle
  acceptingToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing[4],
    borderWidth: 1,
  },
  acceptingToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing[3],
  },
  acceptingToggleText: {
    flex: 1,
  },
  acceptingTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  acceptingSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  // List
  listContainer: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[1],
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing[4],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing[8],
    paddingHorizontal: theme.spacing[6],
    borderRadius: theme.borderRadius.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[1],
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
  },
  clientCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: theme.typography.fontSize.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing[1],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  clientDetails: {
    marginBottom: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[1],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  detailText: {
    fontSize: theme.typography.fontSize.sm,
  },
  clientActions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing[1],
  },
  actionText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default MyClientsScreen;
