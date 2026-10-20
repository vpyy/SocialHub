import apiClient from './api';

/**
 * Comment API Service
 */
const commentService = {
  /**
   * Create a comment or reply
   * @param {string} postId - Post ID
   * @param {Object} commentData - Comment data {content, parentCommentId}
   * @returns {Promise<Object>} Created comment
   */
  createComment: async (postId, commentData) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, commentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get comments for a post
   * @param {string} postId - Post ID
   * @param {number} page - Page number
   * @param {number} size - Page size
   * @returns {Promise<Object>} Paginated comments
   */
  getPostComments: async (postId, page = 0, size = 20) => {
    try {
      const response = await apiClient.get(`/posts/${postId}/comments`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param {string} commentId - Comment ID
   * @returns {Promise<void>}
   */
  deleteComment: async (commentId) => {
    try {
      await apiClient.delete(`/comments/${commentId}`);
    } catch (error) {
      throw error;
    }
  }
};

export default commentService;
