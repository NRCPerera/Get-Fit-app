import apiClient from './client';

/**
 * Get all conversations for the current user
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise} - Conversations list
 */
export const getConversations = async (params = {}) => {
    const response = await apiClient.get('/messages/conversations', { params });
    return response.data;
};

/**
 * Get or create a conversation with a specific user
 * @param {string} recipientId - The ID of the user to chat with
 * @returns {Promise} - Conversation data
 */
export const getOrCreateConversation = async (recipientId) => {
    const response = await apiClient.get(`/messages/conversations/with/${recipientId}`);
    return response.data;
};

/**
 * Get messages for a specific conversation
 * @param {string} conversationId - The conversation ID
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise} - Messages list
 */
export const getMessages = async (conversationId, params = {}) => {
    const response = await apiClient.get(`/messages/conversations/${conversationId}/messages`, { params });
    return response.data;
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {Object} messageData - Message data
 * @param {string} messageData.content - Message content
 * @param {string} messageData.messageType - Message type (text, image, file)
 * @param {string} messageData.attachmentUrl - Optional attachment URL
 * @returns {Promise} - Sent message data
 */
export const sendMessage = async (conversationId, messageData) => {
    const response = await apiClient.post(`/messages/conversations/${conversationId}/messages`, messageData);
    return response.data;
};

/**
 * Delete a message
 * @param {string} messageId - The message ID to delete
 * @returns {Promise} - Delete confirmation
 */
export const deleteMessage = async (messageId) => {
    const response = await apiClient.delete(`/messages/messages/${messageId}`);
    return response.data;
};

/**
 * Get total unread message count
 * @returns {Promise} - Unread count data
 */
export const getUnreadCount = async () => {
    const response = await apiClient.get('/messages/unread-count');
    return response.data;
};

/**
 * Mark a conversation as read
 * @param {string} conversationId - The conversation ID
 * @returns {Promise} - Confirmation
 */
export const markConversationAsRead = async (conversationId) => {
    const response = await apiClient.put(`/messages/conversations/${conversationId}/read`);
    return response.data;
};

export default {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
    deleteMessage,
    getUnreadCount,
    markConversationAsRead
};
