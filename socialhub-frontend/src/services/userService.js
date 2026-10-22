import apiClient from './api'

const userService = {
  /**
   * Search users by keyword (displayName or username)
   */
  searchUsers: async (keyword) => {
    const response = await apiClient.get('/users/search', { params: { q: keyword } })
    return response.data
  },

  /**
   * Get user by ID
   */
  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  /**
   * Get user by username
   */
  getUserByUsername: async (username) => {
    const response = await apiClient.get(`/users/username/${username}`)
    return response.data
  },

  /**
   * Update profile (displayName, bio)
   */
  updateProfile: async (displayName, bio) => {
    const response = await apiClient.put('/users/me', { displayName, bio })
    return response.data
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.put('/users/me/password', { currentPassword, newPassword })
    return response.data
  },

  /**
   * Update avatar URL
   */
  updateAvatar: async (avatarUrl) => {
    const response = await apiClient.put('/users/me/avatar', { avatarUrl })
    return response.data
  },

  /**
   * Update cover URL
   */
  updateCover: async (coverUrl) => {
    const response = await apiClient.put('/users/me/cover', { coverUrl })
    return response.data
  },
}

export default userService
