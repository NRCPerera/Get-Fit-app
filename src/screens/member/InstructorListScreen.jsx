import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Image, StatusBar, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { instructorAPI } from '../../api/instructor.api';
import { getFileUrl } from '../../utils/helpers';
import Card from '../../components/common/Card';
import BackButton from '../../components/common/BackButton';

const PAGE_SIZE = 20;

const InstructorListScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const params = useMemo(() => ({ page, limit: PAGE_SIZE, q: query || undefined }), [page, query]);

  const load = useCallback(async (reset = false) => {
    try {
      if (!refreshing) setLoading(true);
      const res = await instructorAPI.getAllInstructors(params);
      const payload = res?.data || res;
      const newItems = payload?.items || payload?.data?.items || [];
      const newPage = payload?.page || payload?.data?.page || 1;
      const newPages = payload?.pages || payload?.data?.pages || 1;

      setItems(newItems);
      setPage(newPage);
      setPages(newPages);
    } catch (e) {
      // Error loading instructors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params, refreshing]);

  useEffect(() => {
    if (query !== '') {
      setPage(1);
    }
  }, [query]);

  useEffect(() => {
    load(true);
  }, [page, query]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    load(true);
  }, [load]);

  const renderItem = ({ item }) => {
    const profilePicture = item?.user?.profilePicture || item?.profilePicture;
    const profilePictureUrl = profilePicture ? getFileUrl(profilePicture) : null;

    const name = item.name || item?.user?.name || 'Instructor';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const specialty = item.specialty || item.specializations?.[0] || 'Fitness Trainer';
    const experience = item.experience ? `${item.experience} ${item.experience === 1 ? 'year' : 'years'}` : null;
    const monthlyRate = item.monthlyRate ? `LKR ${item.monthlyRate}/mo` : null;
    const isAvailable = item.isAvailable !== false;
    const acceptingMembers = item.acceptingMembers !== false;

    return (
      <Card
        variant="elevated"
        onPress={() => navigation.navigate('InstructorDetail', { id: item._id })}
        style={styles.instructorCard}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatarContainer}>
            {profilePictureUrl ? (
              <Image
                source={{ uri: profilePictureUrl }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
              </View>
            )}
            {isAvailable && (
              <View style={[styles.availableBadge, { backgroundColor: colors.background, borderColor: colors.background }]}>
                <View style={[styles.availableDot, { backgroundColor: colors.success }]} />
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            </View>

            <View style={styles.specialtyRow}>
              <Ionicons name="fitness-outline" size={14} color={colors.primary} />
              <Text style={[styles.specialty, { color: colors.textSecondary }]} numberOfLines={1}>{specialty}</Text>
            </View>

            {item.bio && (
              <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>{item.bio}</Text>
            )}

            <View style={styles.metaRow}>
              {experience && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{experience}</Text>
                </View>
              )}
              {monthlyRate && (
                <View style={styles.metaItem}>
                  <Ionicons name="cash-outline" size={12} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{monthlyRate}</Text>
                </View>
              )}
              <View style={[styles.acceptingBadge, {
                backgroundColor: acceptingMembers ? colors.success + '15' : colors.warning + '15'
              }]}>
                <Ionicons
                  name={acceptingMembers ? 'person-add-outline' : 'close-circle-outline'}
                  size={12}
                  color={acceptingMembers ? colors.success : colors.warning}
                />
                <Text style={[styles.acceptingBadgeText, {
                  color: acceptingMembers ? colors.success : colors.warning
                }]}>
                  {acceptingMembers ? 'Open' : 'Full'}
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
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
            <Text style={styles.headerTitle}>Instructors</Text>
            <Text style={styles.headerSubtitle}>Find the perfect trainer for you</Text>
          </View>
          <View style={styles.instructorCountBadge}>
            <Text style={styles.instructorCountText}>{items.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Search instructors..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>


      {loading && items.length === 0 ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading instructors...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
              <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No instructors found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {query ? 'Try adjusting your search terms' : 'Check back later for new instructors'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Pagination */}
      {items.length > 0 && (
        <View style={[styles.paginationBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            style={[styles.pageBtn, { backgroundColor: colors.backgroundSecondary }, page <= 1 && styles.pageBtnDisabled]}
            disabled={page <= 1}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={page <= 1 ? colors.textTertiary : colors.primary}
            />
            <Text style={[styles.pageBtnText, { color: colors.primary }, page <= 1 && { color: colors.textTertiary }]}>Prev</Text>
          </TouchableOpacity>
          <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>Page {page} / {pages}</Text>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.min(pages, p + 1))}
            style={[styles.pageBtn, { backgroundColor: colors.backgroundSecondary }, page >= pages && styles.pageBtnDisabled]}
            disabled={page >= pages}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnText, { color: colors.primary }, page >= pages && { color: colors.textTertiary }]}>Next</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={page >= pages ? colors.textTertiary : colors.primary}
            />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textAlign: 'center',
  },
  instructorCountBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorCountText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: theme.spacing[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    gap: theme.spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    padding: 0,
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
  listContent: {
    padding: theme.spacing[6],
    paddingTop: theme.spacing[2],
    paddingBottom: 100,
  },
  instructorCard: {
    marginBottom: theme.spacing[4],
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 75,
    height: 75,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  avatarPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  availableBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: theme.borderRadius.full,
  },
  detailsContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[1],
    gap: theme.spacing[2],
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rating: {
    fontSize: 13,
    fontWeight: '700',
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    marginBottom: theme.spacing[2],
  },
  specialty: {
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
  },
  bio: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing[2],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  metaText: {
    fontSize: theme.typography.fontSize.xs,
  },
  acceptingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  acceptingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[16],
    paddingHorizontal: theme.spacing[6],
    marginTop: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  paginationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[4],
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  pageBtnTextDisabled: {
  },
  pageInfo: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default InstructorListScreen;
