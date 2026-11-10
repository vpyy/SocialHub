import apiClient from './api'

const userService = {
  /**
   * Get all users (paginated)
   */
  getAllUsers: async (page = 0, size = 100) => {
    const response = await apiClient.get('/users', { params: { page, size } })
    return response.data
  },

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
   * Get list of users that a user is following
   */
  getFollowing: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/following`)
    return response.data
  },

  /**
   * Get list of followers of a user
   */
  getFollowers: async (userId) => {
    const response = await apiClient.get(`/users/${userId}/followers`)
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
