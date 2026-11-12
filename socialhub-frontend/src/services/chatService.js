import apiClient from './api'

const chatService = {
  // ─── Conversation ────────────────────────────────────────────────────

  // Get or create 1-1 conversation
  startConversation: (targetUserId) =>
    apiClient.post('/conversations', { targetUserId }),

  // List all conversations
  getConversations: (page = 0, size = 20) =>
    apiClient.get('/conversations', { params: { page, size } }),

  // ─── Messages ────────────────────────────────────────────────────────

  // Load messages after a specific messageId (for missed message sync after WS reconnect)
  getMessagesAfter: (conversationId, lastMessageId, size = 50) =>
    apiClient.get(`/conversations/${conversationId}/messages`, {
      params: { after: lastMessageId, size }
    }),

  // Get presence status for a list of user IDs
  getPresence: (userIds) =>
    apiClient.post('/conversations/users/presence', userIds),

  // Upload file attachment via /media/upload and return { id, url, type, fileName, fileSize }
  uploadAttachment: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Load messages in a conversation (oldest first)
  getMessages: (conversationId, page = 0, size = 50) =>
    apiClient.get(`/conversations/${conversationId}/messages`, { params: { page, size } }),

  // Send a message
  sendMessage: (conversationId, payload) =>
    apiClient.post(`/conversations/${conversationId}/messages`, payload),

  // Mark all messages in a conversation as read
  markRead: (conversationId) =>
    apiClient.put(`/conversations/${conversationId}/messages/read`),

  // Edit message
  editMessage: (conversationId, messageId, content) =>
    apiClient.put(`/conversations/${conversationId}/messages/${messageId}`, { content }),

  // Delete message
  deleteMessage: (conversationId, messageId) =>
    apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`),

  // Search messages
  searchMessages: (conversationId, query, page = 0, size = 50) =>
    apiClient.get(`/conversations/${conversationId}/messages/search`, {
      params: { query, page, size }
    }),

  // ─── Reactions ───────────────────────────────────────────────────────

  // Add reaction to message
  addReaction: (conversationId, messageId, reaction) =>
    apiClient.post(`/conversations/${conversationId}/messages/${messageId}/reactions`, { reaction }),

  // Remove reaction from message
  removeReaction: (conversationId, messageId) =>
    apiClient.delete(`/conversations/${conversationId}/messages/${messageId}/reactions`),

  // ─── Group chat ──────────────────────────────────────────────────────

  // Create group chat
  createGroup: (groupData) =>
    apiClient.post('/conversations/group', groupData),

  // Update group info (name, avatar, add/remove members)
  updateGroup: (conversationId, groupData) =>
    apiClient.put(`/conversations/${conversationId}`, groupData),

  // Update conversation (wrapper for updateGroup)
  updateConversation: (conversationId, data) =>
    apiClient.put(`/conversations/${conversationId}`, data),

  // Delete conversation/group
  deleteConversation: (conversationId) =>
    apiClient.delete(`/conversations/${conversationId}`),

  // Leave group
  leaveGroup: (conversationId) =>
    apiClient.delete(`/conversations/${conversationId}/leave`),

  // Leave conversation (wrapper for leaveGroup)
  leaveConversation: (conversationId) =>
    apiClient.delete(`/conversations/${conversationId}/leave`),

  // ─── Call management ─────────────────────────────────────────────────

  // Initiate a call
  initiateCall: (conversationId, calleeId, callType = 'VOICE') =>
    apiClient.post(`/conversations/${conversationId}/calls`, { calleeId, callType }),

  // Update call status (ACCEPTED, DECLINED, ENDED, MISSED)
  updateCallStatus: (callId, status) =>
    apiClient.put(`/conversations/calls/${callId}`, { status }),

  // Get call history
  getCallHistory: (conversationId, page = 0, size = 20) =>
    apiClient.get(`/conversations/${conversationId}/calls`, { params: { page, size } }),

  // ─── NEW FEATURES ────────────────────────────────────────────────────

  // Reply to message
  replyMessage: (conversationId, messageId, content) =>
    apiClient.post(`/conversations/${conversationId}/messages/${messageId}/reply`, { content }),

  // Unsend message (delete for everyone)
  unsendMessage: (conversationId, messageId) =>
    apiClient.delete(`/conversations/${conversationId}/messages/${messageId}/unsend`),

  // Pin message
  pinMessage: (conversationId, messageId) =>
    apiClient.post(`/conversations/${conversationId}/messages/${messageId}/pin`),

  // Unpin message
  unpinMessage: (conversationId, messageId) =>
    apiClient.delete(`/conversations/${conversationId}/messages/${messageId}/pin`),

  // Forward message
  forwardMessage: (conversationId, messageId, targetConversationIds) =>
    apiClient.post(`/conversations/${conversationId}/messages/${messageId}/forward`, { targetConversationIds }),

  // Start typing indicator
  startTyping: (conversationId) =>
    apiClient.post(`/conversations/${conversationId}/typing`),

  // Stop typing indicator
  stopTyping: (conversationId) =>
    apiClient.delete(`/conversations/${conversationId}/typing`),

  // Promote member to admin
  promoteMember: (conversationId, memberId) =>
    apiClient.post(`/conversations/${conversationId}/members/${memberId}/promote`),

  // Demote admin to member
  demoteMember: (conversationId, memberId) =>
    apiClient.delete(`/conversations/${conversationId}/members/${memberId}/promote`),

  // Upload file message
  uploadFile: (conversationId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/conversations/${conversationId}/messages/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Upload group avatar
  uploadGroupAvatar: (conversationId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/conversations/${conversationId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // ─── Conversation Settings ───────────────────────────────

  // Pin conversation
  pinConversation: (conversationId) =>
    apiClient.post(`/conversations/${conversationId}/settings/pin`),

  // Unpin conversation
  unpinConversation: (conversationId) =>
    apiClient.delete(`/conversations/${conversationId}/settings/pin`),

  // Mute conversation
  muteConversation: (conversationId, mutedUntil = null) =>
    apiClient.post(`/conversations/${conversationId}/settings/mute`, { mutedUntil }),

  // Unmute conversation
  unmuteConversation: (conversationId) =>
    apiClient.delete(`/conversations/${conversationId}/settings/mute`),

  // Archive conversation (soft delete)
  archiveConversation: (conversationId) =>
    apiClient.post(`/conversations/${conversationId}/settings/archive`),

  // Unarchive conversation
  unarchiveConversation: (conversationId) =>
    apiClient.delete(`/conversations/${conversationId}/settings/archive`),

  // Mark conversation as unread
  markAsUnread: (conversationId) =>
    apiClient.post(`/conversations/${conversationId}/settings/unread`),

  // Get conversation settings
  getConversationSettings: (conversationId) =>
    apiClient.get(`/conversations/${conversationId}/settings`),

  // ─── Block User ──────────────────────────────────────────

  // Block a user
  blockUser: (userId) =>
    apiClient.post(`/users/${userId}/block`),

  // Unblock a user
  unblockUser: (userId) =>
    apiClient.delete(`/users/${userId}/block`),

  // Check if user is blocked
  checkBlockStatus: (userId) =>
    apiClient.get(`/users/${userId}/block/status`),

  // Get list of blocked users
  getBlockedUsers: () =>
    apiClient.get(`/users/blocked`),
}

export default chatService
