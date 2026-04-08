import apiClient from './client';

export const notificationAPI = {
  // Get my notifications
  getMyNotifications: async (params) => {
    const res = await apiClient.get('/notifications/me', { params });
    return res.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const res = await apiClient.get('/notifications/me/unread-count');
    return res.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const res = await apiClient.post(`/notifications/${notificationId}/read`);
    return res.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/me/read-all');
    return res.data;
  },

  // Register push notification token
  registerPushToken: async (token) => {
    const res = await apiClient.post('/notifications/push-token', { token });
    return res.data;
  },

  // Remove push notification token (for logout)
  removePushToken: async () => {
    const res = await apiClient.delete('/notifications/push-token');
    return res.data;
  },
};
