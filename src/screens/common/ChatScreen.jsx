import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import * as Notifications from 'expo-notifications';

import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { getFileUrl } from '../../utils/helpers';
import BackButton from '../../components/common/BackButton';
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from '../../api/message.api';

const ChatScreen = ({ navigation, route }) => {
  const {
    conversationId: initialConversationId,
    recipientId,
    recipientName,
    recipientPicture,
    recipientRole,
  } = route.params;

  const insets = useSafeAreaInsets();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [recipient, setRecipient] = useState({
    _id: recipientId,
    name: recipientName,
    profilePicture: recipientPicture,
    role: recipientRole,
  });

  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const lastMessageId = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  // Initialize conversation
  const initializeConversation = async () => {
    try {
      setLoading(true);

      // If we don't have a conversationId, create/get one
      if (!conversationId && recipientId) {
        const response = await getOrCreateConversation(recipientId);
        if (response.success) {
          setConversationId(response.data.conversation._id);
          setRecipient(response.data.otherParticipant);
        }
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async (pageNum = 1, isRefresh = false, silent = false) => {
    if (!conversationId) return;

    try {
      if (isRefresh && !silent) {
        setRefreshing(true);
      }

      const response = await getMessages(conversationId, { page: pageNum, limit: 50 });

      if (response.success) {
        const newMessages = response.data;

        if (pageNum === 1) {
          // Check if there are new messages
          const latestMessageId = newMessages.length > 0 ? newMessages[newMessages.length - 1]._id : null;

          if (latestMessageId !== lastMessageId.current) {
            setMessages(newMessages);
            lastMessageId.current = latestMessageId;

            // Scroll to bottom if new messages arrived
            if (lastMessageId.current && !silent) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          }
        } else {
          // Prepend older messages
          setMessages((prev) => [...newMessages, ...prev]);
        }

        setHasMore(newMessages.length === 50);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
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

      // If the notification is for this conversation, refresh immediately
      if (data?.type === 'message' && data?.conversationId === conversationId) {
        fetchMessages(1, false, true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [conversationId]);

  // Handle app state changes (refresh when app comes to foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        conversationId
      ) {
        // App came to foreground, refresh messages
        fetchMessages(1, false, true);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [conversationId]);

  // Poll for new messages (reduced interval for better real-time experience)
  useEffect(() => {
    let pollInterval;

    if (conversationId) {
      // Initial fetch
      fetchMessages(1, false);

      // Poll every 3 seconds for new messages
      pollInterval = setInterval(() => {
        fetchMessages(1, false, true); // silent fetch
      }, 3000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    }
  }, [conversationId]);

  // Initialize on mount
  useEffect(() => {
    initializeConversation();
  }, []);

  // Mark as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (conversationId) {
        markConversationAsRead(conversationId).catch(console.error);
      }
    }, [conversationId])
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !conversationId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await sendMessage(conversationId, {
        content: messageContent,
        messageType: 'text',
      });

      if (response.success) {
        setMessages((prev) => [...prev, response.data]);

        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      fetchMessages(page + 1);
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const shouldShowDateHeader = (message, index) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentDate = new Date(message.createdAt).toDateString();
    const prevDate = new Date(prevMessage.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.isOwnMessage || item.sender?._id === user?.id;
    const showDateHeader = shouldShowDateHeader(item, index);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <View style={[styles.dateHeaderLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dateHeaderText, { color: colors.textTertiary, backgroundColor: colors.backgroundSecondary }]}>
              {formatDateHeader(item.createdAt)}
            </Text>
            <View style={[styles.dateHeaderLine, { backgroundColor: colors.border }]} />
          </View>
        )}

        <View
          style={[
            styles.messageBubbleContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          {!isOwnMessage && (
            <View style={styles.senderAvatar}>
              {item.sender?.profilePicture ? (
                <Image
                  source={{ uri: getFileUrl(item.sender.profilePicture) || item.sender.profilePicture }}
                  style={styles.avatarSmall}
                />
              ) : (
                <LinearGradient
                  colors={theme.colors.gradients.secondary}
                  style={styles.avatarPlaceholderSmall}
                >
                  <Text style={styles.avatarTextSmall}>
                    {item.sender?.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              )}
            </View>
          )}

          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? [styles.ownBubble, { backgroundColor: colors.primary }] : [styles.otherBubble, { backgroundColor: colors.backgroundSecondary }],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : [styles.otherMessageText, { color: colors.text }],
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage ? styles.ownMessageTime : [styles.otherMessageTime, { color: colors.textTertiary }],
                ]}
              >
                {formatMessageTime(item.createdAt)}
              </Text>
              {isOwnMessage && (
                <Ionicons
                  name={item.isRead ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={item.isRead ? '#A5B4FC' : 'rgba(255,255,255,0.6)'}
                  style={styles.readIcon}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={theme.colors.gradients.primary}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={40} color="#FFF" />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Start the Conversation</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Say hi to {recipient.name}! Your messages will appear here.
      </Text>
    </View>
  );

  const renderHeader = () => (
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

        <TouchableOpacity style={styles.headerInfo} activeOpacity={0.8}>
          {recipient.profilePicture ? (
            <Image
              source={{ uri: getFileUrl(recipient.profilePicture) || recipient.profilePicture }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarText}>
                {recipient.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {recipient.name || 'Unknown User'}
            </Text>
            <View style={styles.headerRoleContainer}>
              {recipient.role === 'instructor' && (
                <Ionicons
                  name="star"
                  size={12}
                  color={theme.colors.warning}
                  style={styles.roleIcon}
                />
              )}
              <Text style={styles.headerRole}>
                {recipient.role === 'instructor' ? 'Instructor' : 'Member'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {renderHeader()}
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {renderHeader()}

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyList,
          ]}
          inverted={false}
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          ListEmptyComponent={renderEmptyMessages}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {/* Message Input - Removed SafeAreaView to fix keyboard jump gap */}
        <View style={[styles.inputContainer, { 
          backgroundColor: colors.background, 
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12) 
        }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textTertiary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary },
                (!newMessage.trim() || sending) && [styles.sendButtonDisabled, { backgroundColor: colors.disabled }],
              ]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: theme.spacing[4],
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
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing[3],
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFF',
  },
  headerTextContainer: {
    marginLeft: theme.spacing[3],
    flex: 1,
  },
  headerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFF',
  },
  headerRoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roleIcon: {
    marginRight: 4,
  },
  headerRole: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  messagesList: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  emptyList: {
    flex: 1,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing[4],
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
  },
  dateHeaderText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    paddingHorizontal: theme.spacing[3],
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing[2],
    maxWidth: '85%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderAvatar: {
    marginRight: theme.spacing[2],
    alignSelf: 'flex-end',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholderSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFF',
  },
  messageBubble: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    maxWidth: '100%',
  },
  ownBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
    ...theme.shadows.sm,
  },
  messageText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#FFF',
  },
  otherMessageText: {
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: theme.typography.fontSize.xs,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
  },
  readIcon: {
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[8],
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
  },
  inputSafeArea: {
  },
  inputContainer: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    minHeight: 40,
    maxHeight: 100,
    lineHeight: 22,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing[2],
    marginBottom: 0,
  },
  sendButtonDisabled: {
  },
});

export default ChatScreen;
