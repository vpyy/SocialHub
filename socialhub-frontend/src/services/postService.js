import apiClient from './api';

/**
 * Post API Service
 * Handles all post-related API calls
 */
const postService = {
  /**
   * Search posts by keyword
   */
  searchPosts: async (keyword, page = 0, size = 20) => {
    try {
      const response = await apiClient.get('/posts/search', {
        params: { q: keyword, page, size }
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Create a new post
   * @param {Object} postData - Post data (content, media, hashtags, visibility)
   * @returns {Promise<Object>} Created post
   */
  createPost: async (postData) => {
    try {
      const response = await apiClient.post('/posts', postData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get personalized feed for current user
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Number of posts per page
   * @returns {Promise<Object>} Paginated feed data
   */
  getFeed: async (page = 0, size = 20) => {
    try {
      const response = await apiClient.get('/posts/feed', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get public feed (explore)
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Number of posts per page
   * @returns {Promise<Object>} Paginated public feed data
   */
  getPublicFeed: async (page = 0, size = 20) => {
    try {
      const response = await apiClient.get('/posts/public', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get following feed (posts from followed users only)
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Number of posts per page
   * @returns {Promise<Object>} Paginated following feed data
   */
  getFollowingFeed: async (page = 0, size = 20) => {
    try {
      const response = await apiClient.get('/posts/following', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get post by ID
   * @param {string} postId - Post ID
   * @returns {Promise<Object>} Post data
   */
  getPostById: async (postId) => {
    try {
      const response = await apiClient.get(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a post
   * @param {string} postId - Post ID
   * @param {Object} updateData - Updated post data
   * @returns {Promise<Object>} Updated post
   */
  updatePost: async (postId, updateData) => {
    try {
      const response = await apiClient.put(`/posts/${postId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a post
   * @param {string} postId - Post ID
   * @returns {Promise<void>}
   */
  deletePost: async (postId) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get posts by user ID
   * @param {string} userId - User ID
   * @param {number} page - Page number (0-indexed)
   * @param {number} size - Number of posts per page
   * @returns {Promise<Object>} Paginated user posts
   */
  getUserPosts: async (userId, page = 0, size = 20) => {
    try {
      const response = await apiClient.get(`/posts/user/${userId}`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default postService;
