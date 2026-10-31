import api from './api'

const blockService = {
  /**
   * Block a user
   * POST /api/users/{id}/block
   */
  blockUser: async (userId) => {
    const res = await api.post(`/users/${userId}/block`)
    return res.data
  },

  /**
   * Unblock a user
   * DELETE /api/users/{id}/block
   */
  unblockUser: async (userId) => {
    const res = await api.delete(`/users/${userId}/block`)
    return res.data
  },

  /**
   * Get all blocked users
   * GET /api/users/me/blocked
   */
  getBlockedUsers: async () => {
    const res = await api.get('/users/me/blocked')
    return res.data
  }
}

export default blockService
