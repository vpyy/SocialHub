/**
 * WebRTC Service for Voice/Video Calling
 * 
 * Handles RTCPeerConnection setup, signaling via WebSocket,
 * ICE candidate exchange, and media stream management
 */

import api from './api'
import websocketService from './websocketService'

class WebRTCService {
  constructor() {
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
    this.iceServers = null
    this.pendingCandidates = [] // Queue candidates until remoteDescription is set
    this.callId = null
    this.isInitiator = false
    
    // Callbacks
    this.onRemoteStream = null
    this.onConnectionStateChange = null
    this.onIceConnectionStateChange = null
  }

  /**
   * Initialize WebRTC with ICE servers from backend
   */
  async initialize() {
    try {
      const response = await api.get('/calls/ice-servers')
      this.iceServers = response.data.iceServers
      console.log('[WebRTC] ICE servers loaded:', this.iceServers)
      return true
    } catch (error) {
      console.error('[WebRTC] Failed to load ICE servers:', error)
      // Fallback to Google STUN
      this.iceServers = [
        { urls: ['stun:stun.l.google.com:19302'] }
      ]
      return false
    }
  }

  /**
   * Start a call as caller (initiator)
   * @param {string} callId - Call ID from backend
   * @param {string} callType - 'VOICE' or 'VIDEO'
   * @param {MediaStream} localStream - Local media stream
   */
  async startCall(callId, callType, localStream) {
    console.log('[WebRTC] Starting call:', callId, callType)
    
    this.callId = callId
    this.isInitiator = true
    this.localStream = localStream
    this.pendingCandidates = []

    // Create peer connection
    await this.createPeerConnection()

    // Add local stream to peer connection
    localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, localStream)
      console.log('[WebRTC] Added local track:', track.kind)
    })

    // Create and send offer
    await this.createAndSendOffer()
  }

  /**
   * Answer incoming call as callee
   * @param {string} callId - Call ID
   * @param {string} callType - 'VOICE' or 'VIDEO'
   * @param {MediaStream} localStream - Local media stream
   */
  async answerCall(callId, callType, localStream) {
    console.log('[WebRTC] Answering call:', callId, callType)
    
    this.callId = callId
    this.isInitiator = false
    this.localStream = localStream
    this.pendingCandidates = []

    // Create peer connection
    await this.createPeerConnection()

    // Add local stream
    localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, localStream)
      console.log('[WebRTC] Added local track:', track.kind)
    })

    // Wait for offer from caller (handled by handleSignaling)
  }

  /**
   * Create RTCPeerConnection with ICE servers
   */
  async createPeerConnection() {
    if (this.peerConnection) {
      console.warn('[WebRTC] PeerConnection already exists, closing...')
      this.peerConnection.close()
    }

    // Ensure ICE servers are loaded
    if (!this.iceServers) {
      await this.initialize()
    }

    const config = {
      iceServers: this.iceServers
    }

    this.peerConnection = new RTCPeerConnection(config)
    console.log('[WebRTC] PeerConnection created with config:', config)

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate')
        this.sendIceCandidate(event.candidate)
      }
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind)
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream()
      }
      this.remoteStream.addTrack(event.track)
      
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream)
      }
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState
      console.log('[WebRTC] Connection state:', state)
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state)
      }
    }

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection.iceConnectionState
      console.log('[WebRTC] ICE connection state:', state)
      
      if (this.onIceConnectionStateChange) {
        this.onIceConnectionStateChange(state)
      }

      // Map ICE states to call states
      if (state === 'checking') {
        // CONNECTING
      } else if (state === 'connected' || state === 'completed') {
        // CONNECTED
        console.log('[WebRTC] ✅ ICE connection established')
      } else if (state === 'failed' || state === 'disconnected') {
        // FAILED
        console.error('[WebRTC] ❌ ICE connection failed')
      }
    }
  }

  /**
   * Create and send SDP offer (caller only)
   */
  async createAndSendOffer() {
    try {
      console.log('[WebRTC] Creating offer...')
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })

      await this.peerConnection.setLocalDescription(offer)
      console.log('[WebRTC] Local description set (offer)')

      // Send offer via WebSocket
      this.sendSignal('offer', {
        type: offer.type,
        sdp: offer.sdp
      })
    } catch (error) {
      console.error('[WebRTC] Failed to create offer:', error)
      throw error
    }
  }

  /**
   * Handle incoming signaling messages
   * @param {object} message - Signaling message from WebSocket
   */
  async handleSignaling(message) {
    const { type, sdp, candidate } = message

    console.log('[WebRTC] Received signaling message:', type)

    try {
      if (type === 'offer') {
        await this.handleOffer(sdp)
      } else if (type === 'answer') {
        await this.handleAnswer(sdp)
      } else if (type === 'ice-candidate') {
        await this.handleIceCandidate(candidate)
      }
    } catch (error) {
      console.error('[WebRTC] Failed to handle signaling:', error)
    }
  }

  /**
   * Handle incoming SDP offer (callee only)
   */
  async handleOffer(sdp) {
    console.log('[WebRTC] Handling offer...')
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
    console.log('[WebRTC] Remote description set (offer)')

    // Process pending ICE candidates
    await this.processPendingCandidates()

    // Create and send answer
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    console.log('[WebRTC] Local description set (answer)')

    this.sendSignal('answer', {
      type: answer.type,
      sdp: answer.sdp
    })
  }

  /**
   * Handle incoming SDP answer (caller only)
   */
  async handleAnswer(sdp) {
    console.log('[WebRTC] Handling answer...')
    
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
    console.log('[WebRTC] Remote description set (answer)')

    // Process pending ICE candidates
    await this.processPendingCandidates()
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(candidate) {
    if (!candidate || !candidate.candidate) {
      console.log('[WebRTC] Received end-of-candidates signal')
      return
    }

    const iceCandidate = new RTCIceCandidate({
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    })

    // If remoteDescription not set yet, queue candidate
    if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
      console.log('[WebRTC] Queuing ICE candidate (no remote description yet)')
      this.pendingCandidates.push(iceCandidate)
      return
    }

    // Add candidate immediately
    try {
      await this.peerConnection.addIceCandidate(iceCandidate)
      console.log('[WebRTC] ICE candidate added')
    } catch (error) {
      console.error('[WebRTC] Failed to add ICE candidate:', error)
    }
  }

  /**
   * Process queued ICE candidates after remote description is set
   */
  async processPendingCandidates() {
    if (this.pendingCandidates.length === 0) {
      return
    }

    console.log(`[WebRTC] Processing ${this.pendingCandidates.length} pending ICE candidates`)
    
    for (const candidate of this.pendingCandidates) {
      try {
        await this.peerConnection.addIceCandidate(candidate)
      } catch (error) {
        console.error('[WebRTC] Failed to add pending ICE candidate:', error)
      }
    }

    this.pendingCandidates = []
  }

  /**
   * Send signaling message via WebSocket
   */
  sendSignal(type, payload) {
    const destination = `/app/call/${this.callId}/${type}`
    
    websocketService.sendMessage(destination, payload)
    console.log(`[WebRTC] Sent ${type} signal to ${destination}`)
  }

  /**
   * Send ICE candidate via WebSocket
   */
  sendIceCandidate(candidate) {
    const payload = {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex
    }

    this.sendSignal('ice-candidate', payload)
  }

  /**
   * Toggle microphone mute
   */
  toggleMute() {
    if (!this.localStream) return false

    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      console.log('[WebRTC] Microphone', audioTrack.enabled ? 'unmuted' : 'muted')
      return !audioTrack.enabled // return muted state
    }
    return false
  }

  /**
   * Toggle video on/off
   */
  toggleVideo() {
    if (!this.localStream) return false

    const videoTrack = this.localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      console.log('[WebRTC] Video', videoTrack.enabled ? 'enabled' : 'disabled')
      return videoTrack.enabled
    }
    return false
  }

  /**
   * Switch camera (front/back on mobile)
   */
  async switchCamera() {
    if (!this.localStream) return

    const videoTrack = this.localStream.getVideoTracks()[0]
    if (!videoTrack) return

    try {
      // Get current facing mode
      const currentFacingMode = videoTrack.getSettings().facingMode
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'

      // Get new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      })

      const newVideoTrack = newStream.getVideoTracks()[0]

      // Replace track in peer connection
      const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video')
      if (sender) {
        await sender.replaceTrack(newVideoTrack)
        console.log('[WebRTC] Camera switched to:', newFacingMode)
      }

      // Stop old track and update local stream
      videoTrack.stop()
      this.localStream.removeTrack(videoTrack)
      this.localStream.addTrack(newVideoTrack)

    } catch (error) {
      console.error('[WebRTC] Failed to switch camera:', error)
    }
  }

  /**
   * End call and cleanup
   */
  async endCall() {
    console.log('[WebRTC] Ending call, cleaning up...')

    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log('[WebRTC] Stopped local track:', track.kind)
      })
      this.localStream = null
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop())
      this.remoteStream = null
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
      console.log('[WebRTC] PeerConnection closed')
    }

    // Reset state
    this.callId = null
    this.isInitiator = false
    this.pendingCandidates = []
  }

  /**
   * Get current media stream
   */
  async getMediaStream(callType = 'VOICE') {
    const constraints = {
      audio: true,
      video: callType === 'VIDEO'
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('[WebRTC] Got media stream:', callType)
      return stream
    } catch (error) {
      console.error('[WebRTC] Failed to get media stream:', error)
      throw error
    }
  }
}

// Export singleton instance
const webrtcService = new WebRTCService()
export default webrtcService
