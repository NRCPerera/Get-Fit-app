import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { notificationAPI } from '../../api/notification.api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { screenStyles, headerStyles } from '../../styles/shared';
import { formatDate } from '../../utils/helpers';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [notificationsRes, unreadRes] = await Promise.all([
        notificationAPI.getMyNotifications({ page: 1, limit: 50 }),
        notificationAPI.getUnreadCount()
      ]);
      setNotifications(notificationsRes?.data?.items || []);
      setUnreadCount(unreadRes?.data?.unreadCount || 0);
    } catch (err) {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingAsRead(notificationId);
      await notificationAPI.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => prev.map(notif =>
        notif._id === notificationId
          ? { ...notif, isRead: true, readAt: new Date() }
          : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      Alert.alert('Error', 'Failed to mark notification as read');
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            try {
              await notificationAPI.markAllAsRead();
              setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
              setUnreadCount(0);
            } catch (err) {
              Alert.alert('Error', 'Failed to mark all notifications as read');
            }
          }
        }
      ]
    );
  };

  const handleLinkPress = async (link) => {
    if (!link) return;

    try {
      const canOpen = await Linking.canOpenURL(link);
      if (canOpen) {
        await Linking.openURL(link);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[screenStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={screenStyles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={headerStyles.title}>Notifications</Text>
          <Text style={headerStyles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primary + '15' }]}
            onPress={handleMarkAllAsRead}
          >
            <Ionicons name="checkmark-done" size={20} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card variant="elevated" style={styles.emptyCard}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            You're all caught up! New notifications will appear here.
          </Text>
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card
            key={notification._id}
            variant="elevated"
            style={[
              styles.notificationCard,
              !notification.isRead && styles.unreadCard
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                if (!notification.isRead) {
                  handleMarkAsRead(notification._id);
                }
                if (notification.link) {
                  handleLinkPress(notification.link);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationIconContainer}>
                  <Ionicons
                    name={notification.priority === 'high' ? 'alert-circle' : 'notifications'}
                    size={24}
                    color={getPriorityColor(notification.priority)}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    {!notification.isRead && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <Text style={styles.notificationMessage}>{notification.message}</Text>
                  <View style={styles.notificationFooter}>
                    <Text style={styles.notificationDate}>
                      {formatDate(notification.sentAt, 'MMM dd, yyyy • hh:mm a')}
                    </Text>
                    {notification.link && (
                      <View style={styles.linkContainer}>
                        <Ionicons name="link" size={14} color={colors.primary} />
                        <Text style={[styles.linkText, { color: colors.primary }]}>
                          {notification.linkText || 'Open Link'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor applied inline
    gap: theme.spacing[4],
  },
  loadingText: {
    // color applied inline
    fontSize: theme.typography.fontSize.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[6],
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    // backgroundColor applied inline
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    // color applied inline
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing[16],
    marginTop: theme.spacing[6],
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    // color applied inline
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    // color applied inline
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
    lineHeight: 22,
    opacity: 0.8,
  },
  notificationCard: {
    marginBottom: theme.spacing[3],
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  unreadCard: {
    borderLeftWidth: 4,
    // borderLeftColor, backgroundColor applied inline
  },
  notificationHeader: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  notificationIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    // backgroundColor applied inline
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: theme.spacing[1],
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    // color applied inline
    flex: 1,
    letterSpacing: -0.3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    // backgroundColor applied inline
  },
  notificationMessage: {
    fontSize: theme.typography.fontSize.sm,
    // color applied inline
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[2],
  },
  notificationDate: {
    fontSize: theme.typography.fontSize.xs,
    // color applied inline
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  linkText: {
    fontSize: theme.typography.fontSize.xs,
    // color applied inline
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default NotificationsScreen;
