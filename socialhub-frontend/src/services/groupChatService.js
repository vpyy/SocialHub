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
  }
}

export default groupChatService
