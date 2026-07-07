import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';

import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { getFileUrl } from '../../utils/helpers';
import { getConversations } from '../../api/message.api';
import BackButton from '../../components/common/BackButton';

const MessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useSelector((state) => state.auth);
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const appState = useRef(AppState.currentState);
  const isFocused = useRef(true);
  const insets = useSafeAreaInsets();

  const fetchConversations = async (pageNum = 1, isRefresh = false, silent = false) => {
    try {
      if (isRefresh && !silent) {
        setRefreshing(true);
      } else if (pageNum === 1 && !silent) {
        setLoading(true);
      }

      const response = await getConversations({ page: pageNum, limit: 20 });

      if (response.success) {
        const newConversations = response.data;

        if (pageNum === 1) {
          setConversations(newConversations);
        } else {
          setConversations(prev => [...prev, ...newConversations]);
        }

        setHasMore(newConversations.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Listen for push notifications to trigger instant refresh
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;

      // If it's a message notification, refresh the conversation list
      if (data?.type === 'message' && isFocused.current) {
        fetchConversations(1, false, true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle app state changes (refresh when app comes to foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isFocused.current
      ) {
        // App came to foreground, refresh conversations
        fetchConversations(1, false, true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Poll for updates when screen is focused
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      fetchConversations(1, false);

      // Poll every 5 seconds for conversation updates
      const pollInterval = setInterval(() => {
        fetchConversations(1, false, true);
      }, 5000);

      return () => {
        isFocused.current = false;
        clearInterval(pollInterval);
      };
    }, [])
  );

  const handleRefresh = () => {
    fetchConversations(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchConversations(page + 1);
    }
  };

  const handleConversationPress = (conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation._id,
      recipientId: conversation.otherParticipant._id,
      recipientName: conversation.otherParticipant.name,
      recipientPicture: conversation.otherParticipant.profilePicture
        ? (getFileUrl(conversation.otherParticipant.profilePicture) || conversation.otherParticipant.profilePicture)
        : null,
      recipientRole: conversation.otherParticipant.role,
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = ({ item }) => {
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
          hasUnread && [styles.unreadItem, { backgroundColor: isDark ? colors.backgroundSecondary : '#F5F3FF', borderLeftColor: colors.primary }]
        ]}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {item.otherParticipant?.profilePicture ? (
            <Image
              source={{ uri: getFileUrl(item.otherParticipant.profilePicture) || item.otherParticipant.profilePicture }}
              style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}
            />
          ) : (
            <LinearGradient
              colors={theme.colors.gradients.primary}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarText}>
                {item.otherParticipant?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </LinearGradient>
          )}
          {item.otherParticipant?.role === 'instructor' && (
            <View style={[styles.instructorBadge, { backgroundColor: colors.warning }]}>
              <Ionicons name="star" size={10} color="#FFF" />
            </View>
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, { color: colors.text }, hasUnread && styles.unreadText]} numberOfLines={1}>
              {item.otherParticipant?.name || 'Unknown User'}
            </Text>
            <Text style={[styles.timeText, { color: colors.textTertiary }, hasUnread && [styles.unreadTimeText, { color: colors.primary }]]}>
              {formatTime(item.lastMessage?.createdAt || item.updatedAt)}
            </Text>
          </View>

          <View style={styles.messagePreview}>
            <Text
              style={[styles.lastMessage, { color: colors.textSecondary }, hasUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {item.otherParticipant?.role === 'instructor' && item.otherParticipant?.specializations && (
            <View style={styles.specializationsContainer}>
              {item.otherParticipant.specializations.slice(0, 2).map((spec, index) => (
                <View key={index} style={[styles.specializationTag, { backgroundColor: colors.primaryLight + '20' }]}>
                  <Text style={[styles.specializationText, { color: colors.primary }]}>{spec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={theme.colors.gradients.primary}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="chatbubbles-outline" size={48} color="#FFF" />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages Yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {user?.role === 'member'
          ? 'Subscribe to an instructor to start messaging them!'
          : 'Your clients will appear here once they subscribe to you.'}
      </Text>
      {user?.role === 'member' && (
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Instructors')}
        >
          <LinearGradient
            colors={theme.colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.browseButtonGradient}
          >
            <Text style={styles.browseButtonText}>Browse Instructors</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || conversations.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={theme.colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        
        <View style={styles.headerTop}>
          <BackButton style={styles.backButton} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Ionicons name="chatbubbles" size={24} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      {loading && conversations.length === 0 ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 && styles.emptyList
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    marginBottom: theme.spacing[2],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  headerActions: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    ...theme.shadows.sm,
  },
  unreadItem: {
    borderLeftWidth: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFF',
  },
  instructorBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  conversationContent: {
    flex: 1,
    marginLeft: theme.spacing[3],
    marginRight: theme.spacing[2],
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
    marginRight: theme.spacing[2],
  },
  unreadText: {
    fontWeight: theme.typography.fontWeight.bold,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
  },
  unreadTimeText: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
    marginRight: theme.spacing[2],
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFF',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing[2],
    gap: 4,
  },
  specializationTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  specializationText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  browseButton: {
    marginTop: theme.spacing[6],
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  browseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    gap: theme.spacing[2],
  },
  browseButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFF',
  },
  footerLoader: {
    paddingVertical: theme.spacing[4],
    alignItems: 'center',
  },
});

export default MessagesScreen;
