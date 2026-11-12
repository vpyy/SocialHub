import apiClient from './api'

const bookmarkService = {
  toggleBookmark: (postId) =>
    apiClient.post(`/posts/${postId}/bookmark`),

  getBookmarks: (page = 0, size = 20) =>
    apiClient.get('/bookmarks', { params: { page, size } }),
}

export default bookmarkService
