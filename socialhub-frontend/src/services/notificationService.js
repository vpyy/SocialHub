import apiClient from './api'

const notificationService = {
  getNotifications: (page = 0, size = 20) =>
    apiClient.get('/notifications', { params: { page, size } }),

  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),

  markAllRead: () =>
    apiClient.put('/notifications/read-all'),

  markOneRead: (id) =>
    apiClient.put(`/notifications/${id}/read`),
}

export default notificationService
