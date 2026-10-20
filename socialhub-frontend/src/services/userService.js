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
}

export default userService
