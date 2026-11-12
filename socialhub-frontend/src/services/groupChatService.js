import api from './api'

const groupChatService = {
  /**
   * Create group chat
   * POST /api/conversations/group
   */
  createGroupChat: async (groupName, memberIds, groupAvatarUrl) => {
    const res = await api.post('/conversations/group', {
      groupName,
      memberIds,
      groupAvatarUrl
    })
    return res.data
  },

  /**
   * Update group (name, avatar, add/remove members)
   * PUT /api/conversations/{conversationId}
   */
  updateGroupChat: async (conversationId, { groupName, groupAvatarUrl, addMemberIds, removeMemberIds }) => {
    const res = await api.put(`/conversations/${conversationId}`, {
      groupName,
      groupAvatarUrl,
      addMemberIds,
      removeMemberIds
    })
    return res.data
  },

  /**
   * Leave group
   * DELETE /api/conversations/{conversationId}/leave
   */
  leaveGroup: async (conversationId) => {
    const res = await api.delete(`/conversations/${conversationId}/leave`)
    return res.data
  }
}

export default groupChatService
