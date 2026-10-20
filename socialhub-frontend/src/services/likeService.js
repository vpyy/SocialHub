import apiClient from './api';

/**
 * Like API Service
 */
const likeService = {
  /**
   * Toggle like on a post
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Like status
   */
  toggleLike: async (postId) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get users who liked a post
   * @param {string} postId - Post ID
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<Object>} Paginated likes
   */
  getPostLikes: async (postId, page = 0, size = 20) => {
    try {
      const response = await apiClient.get(`/posts/${postId}/likes`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default likeService;
