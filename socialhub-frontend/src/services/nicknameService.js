import api from './api'

const nicknameService = {
  /**
   * Set nickname for a user
   * POST /api/users/{id}/nickname
   */
  setNickname: async (userId, nickname) => {
    const res = await api.post(`/users/${userId}/nickname`, {
      targetUserId: userId,
      nickname
    })
    return res.data
  },

  /**
   * Get nickname for a user
   * GET /api/users/{id}/nickname
   */
  getNickname: async (userId) => {
    const res = await api.get(`/users/${userId}/nickname`)
    return res.data
  }
}

export default nicknameService
