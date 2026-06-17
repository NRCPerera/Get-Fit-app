import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TouchableOpacity, TextInput, StatusBar, Modal, Dimensions, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { exerciseAPI } from '../../api/exercise.api';
import Loading from '../../components/common/Loading';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import BackButton from '../../components/common/BackButton';
import { getFileUrl } from '../../utils/helpers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getDifficultyColor = (difficulty, colors) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return colors.success;
    case 'intermediate': return colors.warning;
    case 'advanced': return colors.error;
    default: return colors.textSecondary;
  }
};

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'strength': return 'barbell';
    case 'cardio': return 'heart';
    case 'flexibility': return 'body';
    case 'balance': return 'footsteps';
    default: return 'fitness';
  }
};

// ─── Video Player Modal ──────────────────────────────────────────────────────

const VideoPlayerModal = ({ visible, videoUrl, exerciseName, onClose }) => {
  const source = useMemo(() => ({ uri: getFileUrl(videoUrl) || videoUrl }), [videoUrl]);

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.play();
  });

  useEffect(() => {
    if (!visible && player) {
      player.pause();
    }
  }, [visible, player]);

  if (!visible || !videoUrl) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>{exerciseName}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.videoContainer}>
            <VideoView
              player={player}
              style={styles.videoPlayer}
              contentFit="contain"
              nativeControls={true}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const ExerciseLibraryScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoThumbnails, setVideoThumbnails] = useState({});

  // ── Thumbnail queue refs (never trigger re-renders themselves) ──────────────
  const thumbnailQueueRef = useRef([]);
  const isProcessingRef = useRef(false);
  // Tracks IDs already queued so refreshes don't re-generate existing thumbnails
  const generatedIdsRef = useRef(new Set());

  // ── Background thumbnail processor ─────────────────────────────────────────
  // Empty deps: only touches refs and uses a functional setState updater,
  // so it never goes stale and never needs to be recreated.
  const processThumbnailQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const CONCURRENCY = 2; // tune up/down based on device capability

    while (thumbnailQueueRef.current.length > 0) {
      const batch = thumbnailQueueRef.current.splice(0, CONCURRENCY);

      await Promise.all(
        batch.map(async ({ videoUrl, exerciseId }) => {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(
              getFileUrl(videoUrl) || videoUrl,
              { time: 1000 }
            );
            // Functional updater avoids closing over stale state
            setVideoThumbnails((prev) => ({ ...prev, [exerciseId]: uri }));
          } catch (error) {
            console.warn(`Thumbnail failed for ${exerciseId}:`, error);
            // Placeholder stays; no state update needed on failure
          }
        })
      );
    }

    isProcessingRef.current = false;
  }, []); // ← intentionally empty

  // ── Queue builder — called once after data loads, never inside renderItem ──
  const queueThumbnailGeneration = useCallback(
    (exercises) => {
      const pending = exercises.filter((item) => {
        const id = item._id || item.id;
        // Only queue items that have a video, no static image, and haven't been queued yet
        return item.videoUrl && !item.imageUrl && !generatedIdsRef.current.has(id);
      });

      pending.forEach((item) => {
        const id = item._id || item.id;
        generatedIdsRef.current.add(id); // mark immediately to prevent duplicate queuing
        thumbnailQueueRef.current.push({ videoUrl: item.videoUrl, exerciseId: id });
      });

      if (pending.length > 0) {
        processThumbnailQueue();
      }
    },
    [processThumbnailQueue]
  );

  // ── Data loading ────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await exerciseAPI.getAllExercises({ page: 1, limit: 100, status: 'active' });
      const payload = res?.data?.data || res?.data || res;
      const exercises = payload.items || payload?.data?.items || [];
      setItems(exercises);

      // Kick off thumbnail generation AFTER data is set — never during render
      queueThumbnailGeneration(exercises);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [queueThumbnailGeneration]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getMuscleGroupIcon = (group) => {
    switch (group) {
      case 'chest': return 'body';
      case 'back': return 'body';
      case 'legs': return 'walk';
      case 'arms': return 'hand-left';
      case 'shoulders': return 'arrow-up';
      case 'core': return 'ellipse';
      case 'glutes': return 'fitness';
      case 'full body': return 'accessibility';
      default: return 'fitness';
    }
  };

  const muscleGroups = useMemo(() => {
    const groups = new Set();
    items.forEach((item) => {
      if (Array.isArray(item.muscleGroups)) {
        item.muscleGroups.forEach((g) => groups.add(g.toLowerCase()));
      }
    });
    const sorted = [...groups].sort();
    return [
      { key: 'all', label: 'All', icon: 'grid' },
      ...sorted.map((g) => ({
        key: g,
        label: g.charAt(0).toUpperCase() + g.slice(1),
        icon: getMuscleGroupIcon(g),
      })),
    ];
  }, [items]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMuscle =
          selectedMuscleGroup === 'all' ||
          (Array.isArray(item.muscleGroups) &&
            item.muscleGroups.some(
              (g) => g.toLowerCase() === selectedMuscleGroup.toLowerCase()
            ));
        return matchesSearch && matchesMuscle;
      }),
    [items, searchQuery, selectedMuscleGroup]
  );

  const handlePlayVideo = useCallback((item) => {
    if (item.videoUrl) setSelectedVideo(item);
  }, []);

  const handleCloseVideo = useCallback(() => {
    setSelectedVideo(null);
  }, []);

  // ── Render helpers ──────────────────────────────────────────────────────────
  const cardGradientColors = isDark
    ? [colors.primaryDark + '40', colors.primary + '20', 'transparent']
    : [colors.primary + '25', colors.primaryLight + '15', 'transparent'];

  // ── renderItem — read-only; never triggers thumbnail generation ─────────────
  const renderItem = useCallback(
    ({ item }) => {
      const itemId = item._id || item.id;
      const thumbnailUri = videoThumbnails[itemId];

      return (
        <View style={styles.exerciseCard}>
          <LinearGradient
            colors={cardGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.cardGradientBorder,
              { borderColor: isDark ? colors.primary + '30' : colors.primary + '20' },
            ]}
          >
            <View style={[styles.cardInnerContent, { backgroundColor: colors.card }]}>
              {item.imageUrl ? (
                // ── Static image with optional video play button ───────────────
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{ uri: getFileUrl(item.imageUrl) || item.imageUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  {item.videoUrl && (
                    <TouchableOpacity
                      style={styles.playOverlay}
                      onPress={() => handlePlayVideo(item)}
                    >
                      <LinearGradient
                        colors={
                          isDark
                            ? [colors.primary, colors.primaryDark]
                            : [colors.primaryLight, colors.primary]
                        }
                        style={styles.playButtonGradient}
                      >
                        <Ionicons name="play" size={20} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              ) : item.videoUrl ? (
                // ── Video: show generated thumbnail or placeholder ────────────
                <TouchableOpacity
                  style={styles.thumbnailContainer}
                  onPress={() => handlePlayVideo(item)}
                  activeOpacity={0.8}
                >
                  {thumbnailUri ? (
                    <>
                      <Image
                        source={{ uri: thumbnailUri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                      <View style={styles.playOverlay}>
                        <LinearGradient
                          colors={
                            isDark
                              ? [colors.primary, colors.primaryDark]
                              : [colors.primaryLight, colors.primary]
                          }
                          style={styles.playButtonGradient}
                        >
                          <Ionicons name="play" size={20} color="#FFFFFF" />
                        </LinearGradient>
                      </View>
                    </>
                  ) : (
                    // Shown while thumbnail is still generating in the background
                    <LinearGradient
                      colors={
                        isDark
                          ? [colors.primaryDark, colors.primary, colors.primaryLight + '80']
                          : [colors.primary, colors.primaryDark, colors.primaryDark]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.videoGradient}
                    >
                      <View style={styles.playIconContainer}>
                        <Ionicons name="play" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.videoText}>Tap to Play</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              ) : (
                // ── No image, no video — category icon placeholder ────────────
                <LinearGradient
                  colors={
                    isDark
                      ? [colors.primary + '25', colors.primaryDark + '15']
                      : [colors.primary + '15', colors.primaryLight + '10']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.thumbnailPlaceholder}
                >
                  <Ionicons name={getCategoryIcon(item.category)} size={32} color={colors.primary} />
                </LinearGradient>
              )}

              <View style={[styles.cardInfo, { backgroundColor: colors.card }]}>
                <Text
                  style={[styles.exerciseName, { color: colors.text, letterSpacing: -0.3, textAlign: 'center' }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="pricetag" size={12} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {item.category || 'Exercise'}
                    </Text>
                  </View>
                  {item.duration && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={12} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {item.duration} min
                      </Text>
                    </View>
                  )}
                </View>
                {item.difficulty && (
                  <LinearGradient
                    colors={
                      isDark
                        ? [
                            getDifficultyColor(item.difficulty, colors),
                            getDifficultyColor(item.difficulty, colors) + 'AA',
                          ]
                        : [
                            getDifficultyColor(item.difficulty, colors),
                            getDifficultyColor(item.difficulty, colors) + 'CC',
                          ]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.difficultyBadge}
                  >
                    <Text style={styles.difficultyText}>
                      {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      );
    },
    // videoThumbnails is the only runtime dep — colors/isDark are stable references
    [videoThumbnails, colors, isDark, cardGradientColors, handlePlayVideo]
  );

  // ── Stable key extractor ────────────────────────────────────────────────────
  const keyExtractor = useCallback((item) => item._id || item.id, []);

  if (loading) return <Loading />;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {selectedVideo && (
        <VideoPlayerModal
          visible={!!selectedVideo}
          videoUrl={selectedVideo.videoUrl}
          exerciseName={selectedVideo.name}
          onClose={handleCloseVideo}
        />
      )}

      {/* Gradient Header */}
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerTop}>
          <BackButton style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Exercise Library</Text>
            <Text style={styles.headerSubtitle}>{items.length} exercises available</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              placeholder="Search exercises..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Muscle Group Filter */}
      <View
        style={[
          styles.muscleGroupContainer,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.muscleGroupHeader}>
          <Ionicons name="body-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.muscleGroupLabel, { color: colors.textSecondary }]}>
            Muscle Groups
          </Text>
        </View>
        <FlatList
          horizontal
          data={muscleGroups}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.muscleGroupList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.muscleGroupChip,
                { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' },
                selectedMuscleGroup === item.key && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => setSelectedMuscleGroup(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={14}
                color={selectedMuscleGroup === item.key ? '#FFFFFF' : colors.primary}
              />
              <Text
                style={[
                  styles.muscleGroupText,
                  { color: colors.primary },
                  selectedMuscleGroup === item.key && { color: '#FFFFFF' },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Exercise Grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="fitness-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery ? 'No exercises found' : 'No exercises available'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back later for new exercises'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        // Perf: avoid anonymous functions as props
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={6}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
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
  muscleGroupContainer: {
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  muscleGroupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  muscleGroupList: {
    paddingHorizontal: theme.spacing[4],
  },
  muscleGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    marginRight: theme.spacing[2],
    borderWidth: 1,
  },
  muscleGroupText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listContent: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  row: {
    justifyContent: 'space-between',
  },
  exerciseCard: {
    width: '48%',
    borderRadius: 20,
    marginBottom: theme.spacing[4],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGradientBorder: {
    flex: 1,
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
  },
  cardInnerContent: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 130,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyBadge: {
    alignSelf: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  playIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  videoText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#FFFFFF',
  },
  cardInfo: {
    padding: theme.spacing[4],
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: theme.spacing[2],
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: theme.typography.fontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[16],
    paddingHorizontal: theme.spacing[8],
    marginTop: theme.spacing[8],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
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
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 130,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: SCREEN_WIDTH,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
  },
  modalTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginRight: theme.spacing[3],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    backgroundColor: '#000',
  },
  videoPlayer: {
    flex: 1,
  },
});

export default ExerciseLibraryScreen;
