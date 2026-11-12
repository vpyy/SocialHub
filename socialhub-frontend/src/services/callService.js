import apiClient from './api'

const callService = {
  /**
   * Initiate a call
   * POST /api/conversations/{conversationId}/calls
   */
  initiateCall: async (conversationId, calleeId, callType = 'VOICE') => {
    const res = await apiClient.post(`/conversations/${conversationId}/calls`, {
      calleeId,
      callType
    })
    return res.data
  },

  /**
   * Update call status
   * PUT /api/conversations/calls/{callId}
   */
  updateCallStatus: async (callId, status) => {
    const res = await apiClient.put(`/conversations/calls/${callId}`, { status })
    return res.data
  },

  /**
   * Get call history
   * GET /api/conversations/{conversationId}/calls
   */
  getCallHistory: async (conversationId, page = 0, size = 20) => {
    const res = await apiClient.get(`/conversations/${conversationId}/calls`, {
      params: { page, size }
    })
    return res.data
  }
}

export default callService
