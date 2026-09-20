import { ScaleTouchable as TouchableOpacity, MotionView, FocusSurface } from '../../components/common/Motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Image, StatusBar, Platform, TextInput, KeyboardAvoidingView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { instructorAPI } from '../../api/instructor.api';
import { getFileUrl } from '../../utils/helpers';
import BackButton from '../../components/common/BackButton';

const PAGE_SIZE = 20;

const InstructorCard = ({ item, index, navigation, colors, dynamicTheme, isDark }) => {
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
    <MotionView delay={index * 60}>
      <TouchableOpacity
        onPress={() => navigation.navigate('InstructorDetail', { id: item._id })}
        activeOpacity={0.85}
        style={[styles.card, {
          backgroundColor: colors.card,
          borderColor: isDark ? colors.border + '60' : colors.border + '30',
          ...dynamicTheme.shadows.md,
        }]}
      >
        {/* Top section: Avatar + Name + Specialty */}
        <View style={styles.cardTopRow}>
          {/* Avatar with gradient ring */}
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={colors.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: colors.card }]}>
                {profilePictureUrl ? (
                  <Image
                    source={{ uri: profilePictureUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[colors.primary + '30', colors.secondary + '20']}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>
            {isAvailable && (
              <View style={[styles.statusBadge, { backgroundColor: colors.card, borderColor: colors.card }]}>
                <MotionView pulse style={[styles.statusDot, { backgroundColor: colors.success }]} />
              </View>
            )}
          </View>

          {/* Name & Specialty */}
          <View style={styles.cardInfo}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{name}</Text>
            <View style={styles.specialtyRow}>
              <Ionicons name="fitness-outline" size={13} color={colors.primary} />
              <Text style={[styles.specialty, { color: colors.textSecondary }]} numberOfLines={1}>{specialty}</Text>
            </View>
          </View>

          {/* Arrow */}
          <View style={[styles.arrowCircle, { backgroundColor: colors.primary + '12' }]}>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </View>
        </View>

        {/* Bio */}
        {item.bio && (
          <Text style={[styles.bio, { color: colors.textTertiary }]} numberOfLines={2}>{item.bio}</Text>
        )}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.border + '40' }]} />

        {/* Bottom chips row */}
        <View style={styles.chipsRow}>
          {experience && (
            <View style={[styles.chip, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.primary }]}>{experience}</Text>
            </View>
          )}
          {monthlyRate && (
            <View style={[styles.chip, { backgroundColor: colors.accent ? colors.accent + '12' : colors.secondary + '12' }]}>
              <Ionicons name="cash-outline" size={13} color={colors.accent || colors.secondary} />
              <Text style={[styles.chipText, { color: colors.accent || colors.secondary }]}>{monthlyRate}</Text>
            </View>
          )}
          <View style={[styles.chip, {
            backgroundColor: acceptingMembers ? colors.success + '12' : colors.warning + '12',
            marginLeft: 'auto',
          }]}>
            <Ionicons
              name={acceptingMembers ? 'person-add-outline' : 'close-circle-outline'}
              size={13}
              color={acceptingMembers ? colors.success : colors.warning}
            />
            <Text style={[styles.chipText, {
              color: acceptingMembers ? colors.success : colors.warning,
              fontWeight: '600',
            }]}>
              {acceptingMembers ? 'Open' : 'Full'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotionView>
  );
};

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

  const renderItem = ({ item, index }) => (
    <InstructorCard
      item={item}
      index={index}
      navigation={navigation}
      colors={colors}
      dynamicTheme={dynamicTheme}
      isDark={isDark}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Header ── */}
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        {/* Decorative circles */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerCircle3} />

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
          <FocusSurface style={[styles.searchBar, {
            backgroundColor: isDark ? colors.card + 'E6' : '#FFFFFFEE',
            borderColor: isDark ? colors.border + '40' : 'transparent',
          }]}>
            <View style={[styles.searchIconWrap, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="search" size={16} color={colors.primary} />
            </View>
            <TextInput
              placeholder="Search by name or specialty..."
              placeholderTextColor={colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
                <View style={[styles.clearBtnInner, { backgroundColor: colors.textTertiary + '25' }]}>
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
          </FocusSurface>
        </View>
      </LinearGradient>

      {/* ── Content ── */}
      {loading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingSpinner, { borderColor: colors.primary + '20' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Finding instructors...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: items.length > 0 ? 100 : 40 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="people-outline" size={48} color={colors.primary + '60'} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No instructors found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {query ? 'Try adjusting your search terms' : 'Check back later for new instructors'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Pagination ── */}
      {items.length > 0 && (
        <View style={[styles.paginationBar, {
          backgroundColor: isDark ? colors.card + 'F0' : colors.background + 'F8',
          borderTopColor: colors.border + '30',
          paddingBottom: Math.max(insets.bottom, 12),
          ...dynamicTheme.shadows.lg,
        }]}>
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            style={[styles.pageBtn, {
              backgroundColor: page <= 1 ? colors.backgroundSecondary : colors.primary + '12',
              opacity: page <= 1 ? 0.5 : 1,
            }]}
            disabled={page <= 1}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={page <= 1 ? colors.textTertiary : colors.primary}
            />
            <Text style={[styles.pageBtnText, { color: page <= 1 ? colors.textTertiary : colors.primary }]}>Prev</Text>
          </TouchableOpacity>

          <View style={[styles.pageIndicator, { backgroundColor: colors.primary + '10' }]}>
            <Text style={[styles.pageInfo, { color: colors.primary }]}>{page}</Text>
            <Text style={[styles.pageInfoSep, { color: colors.textTertiary }]}>/</Text>
            <Text style={[styles.pageInfo, { color: colors.textSecondary }]}>{pages}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setPage((p) => Math.min(pages, p + 1))}
            style={[styles.pageBtn, {
              backgroundColor: page >= pages ? colors.backgroundSecondary : colors.primary + '12',
              opacity: page >= pages ? 0.5 : 1,
            }]}
            disabled={page >= pages}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnText, { color: page >= pages ? colors.textTertiary : colors.primary }]}>Next</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
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

  /* ── Header ── */
  headerGradient: {
    paddingBottom: theme.spacing[6],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: 10,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerCircle3: {
    position: 'absolute',
    top: 30,
    left: '40%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.extrabold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  instructorCountBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  instructorCountText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },

  /* ── Search ── */
  searchContainer: {
    paddingHorizontal: theme.spacing[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    gap: theme.spacing[2],
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    padding: 0,
    letterSpacing: 0.1,
  },
  clearBtn: {
    padding: 2,
  },
  clearBtnInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Loading ── */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
  },
  loadingSpinner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    letterSpacing: 0.2,
  },

  /* ── List ── */
  listContent: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
  },

  /* ── Card ── */
  card: {
    borderRadius: 20,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderWidth: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },

  /* Avatar */
  avatarWrapper: {
    position: 'relative',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 30,
    padding: 1.5,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  /* Card info */
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specialty: {
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Bio */
  bio: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: theme.spacing[2],
    paddingLeft: theme.spacing[1],
  },

  /* Divider */
  divider: {
    height: 1,
    marginTop: theme.spacing[3],
    marginBottom: theme.spacing[3],
  },

  /* Chips */
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  /* ── Empty state ── */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[16],
    paddingHorizontal: theme.spacing[6],
    marginTop: theme.spacing[4],
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
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

  /* ── Pagination ── */
  paginationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pageBtnText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  pageInfo: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  pageInfoSep: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.regular,
  },
});

export default InstructorListScreen;
