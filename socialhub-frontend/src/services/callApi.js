/**
 * Call API Service
 * 
 * Endpoints for WebRTC calling:
 * - GET /calls/ice-servers - Get ICE server config
 * - POST /conversations/{id}/calls - Initiate call
 * - PUT /conversations/calls/{callId} - Update call status (accept/reject/end/cancel)
 * - GET /conversations/{id}/calls - Get call history
 */

import api from './api'

/**
 * GET /calls/ice-servers
 * Get ICE servers configuration (STUN/TURN)
 */
export async function getIceServers() {
  const response = await api.get('/calls/ice-servers')
  return response
}

/**
 * POST /conversations/{conversationId}/calls
 * Initiate a call
 */
export async function initiateCall(conversationId, calleeId, callType = 'VOICE') {
  const response = await api.post(`/conversations/${conversationId}/calls`, {
    calleeId,
    callType
  })
  return response
}

/**
 * PUT /conversations/calls/{callId}
 * Update call status
 * 
 * Status values:
 * - ACCEPTED: Accept incoming call
 * - DECLINED: Reject incoming call
 * - ENDED: End active call
 * - MISSED: Mark as missed (typically server-side after timeout)
 */
export async function updateCallStatus(callId, status) {
  const response = await api.put(`/conversations/calls/${callId}`, {
    status
  })
  return response
}

/**
 * Accept incoming call
 */
export async function acceptCall(callId) {
  return updateCallStatus(callId, 'ACCEPTED')
}

/**
 * Decline/reject incoming call
 */
export async function declineCall(callId) {
  return updateCallStatus(callId, 'DECLINED')
}

/**
 * End active call
 */
export async function endCall(callId) {
  return updateCallStatus(callId, 'ENDED')
}

/**
 * GET /conversations/{conversationId}/calls
 * Get call history for a conversation
 */
export async function getCallHistory(conversationId, page = 0, size = 20) {
  const response = await api.get(`/conversations/${conversationId}/calls`, {
    params: { page, size }
  })
  return response
}

export default {
  getIceServers,
  initiateCall,
  updateCallStatus,
  acceptCall,
  declineCall,
  endCall,
  getCallHistory
}
