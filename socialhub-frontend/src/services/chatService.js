import apiClient from './api'

const chatService = {
  // Get or create 1-1 conversation
  startConversation: (targetUserId) =>
    apiClient.post('/conversations', { targetUserId }),

  // List all conversations
  getConversations: (page = 0, size = 20) =>
    apiClient.get('/conversations', { params: { page, size } }),

  // Load messages in a conversation (oldest first)
  getMessages: (conversationId, page = 0, size = 50) =>
    apiClient.get(`/conversations/${conversationId}/messages`, { params: { page, size } }),

  // Send a message
  sendMessage: (conversationId, payload) =>
    apiClient.post(`/conversations/${conversationId}/messages`, payload),

  // Mark all messages in a conversation as read
  markRead: (conversationId) =>
    apiClient.put(`/conversations/${conversationId}/messages/read`),
}

export default chatService
