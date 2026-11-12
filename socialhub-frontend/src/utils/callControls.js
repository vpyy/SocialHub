/**
 * Call Controls
 * Manages audio/video controls, permissions, network recovery
 */

export class CallControls {
  constructor(options = {}) {
    this.localStream = null
    this.audioTrack = null
    this.videoTrack = null
    this.peerConnection = null
    
    this.isMuted = false
    this.isVideoEnabled = true
    this.cameraSource = 'front' // 'front' or 'back'
    this.isSpeakerOn = true
    this.isPictureInPictureEnabled = false
    this.pendingCandidates = []
    
    this.listeners = new Map()
    this.onTrackReceived = options.onTrackReceived
    this.onConnectionStateChange = options.onConnectionStateChange
  }

  /**
   * Initialize local media stream
   */
  async initializeStream(options = {}) {
    const { audio = true, video = false } = options
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
        video: video ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.cameraSource 
        } : false
      })

      this.audioTrack = this.localStream.getAudioTracks()[0]
      this.videoTrack = this.localStream.getVideoTracks()[0]

      this.emit('stream:initialized', { stream: this.localStream })
      return this.localStream
    } catch (error) {
      console.error('Failed to initialize stream:', error)
      this.emit('error', { type: 'stream_initialization', error })
      throw error
    }
  }

  /**
   * Initialize WebRTC Peer Connection
   */
  async initializePeerConnection(config = {}) {
    try {
      const rtcConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        ...config
      }

      this.peerConnection = new RTCPeerConnection(rtcConfig)

      // Add local tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream)
        })
      }

      // Handle remote tracks
      this.peerConnection.ontrack = (event) => {
        console.log('Remote track received:', event.track.kind)
        if (this.onTrackReceived) {
          this.onTrackReceived(event)
        }
        this.emit('track:received', event)
      }

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection.connectionState)
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(this.peerConnection.connectionState)
        }
        this.emit('connection:state_changed', { state: this.peerConnection.connectionState })
      }

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit('ice:candidate', event.candidate)
        }
      }

      this.emit('peer_connection:initialized', { peerConnection: this.peerConnection })
      return this.peerConnection
    } catch (error) {
      console.error('Failed to initialize peer connection:', error)
      this.emit('error', { type: 'peer_connection_initialization', error })
      throw error
    }
  }

  /**
   * Toggle mute
   */
  async toggleMute() {
    if (!this.audioTrack) {
      console.warn('No audio track available')
      return false
    }

    try {
      this.isMuted = !this.isMuted
      this.audioTrack.enabled = !this.isMuted
      this.emit('audio:toggled', { isMuted: this.isMuted })
      return this.isMuted
    } catch (error) {
      console.error('Failed to toggle mute:', error)
      this.emit('error', { type: 'mute_toggle', error })
      throw error
    }
  }

  /**
   * Toggle video
   */
  async toggleVideo() {
    if (!this.videoTrack) {
      console.warn('No video track available')
      return false
    }

    try {
      this.isVideoEnabled = !this.isVideoEnabled
      this.videoTrack.enabled = this.isVideoEnabled
      this.emit('video:toggled', { isVideoEnabled: this.isVideoEnabled })
      return this.isVideoEnabled
    } catch (error) {
      console.error('Failed to toggle video:', error)
      this.emit('error', { type: 'video_toggle', error })
      throw error
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera() {
    if (!this.videoTrack) {
      console.warn('No video track available')
      return
    }

    try {
      this.cameraSource = this.cameraSource === 'front' ? 'back' : 'front'
      
      // Stop current video track
      this.videoTrack.stop()

      // Get new video stream with different facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: this.cameraSource
        }
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      
      // Replace video track in peer connection
      if (this.peerConnection) {
        const sender = this.peerConnection
          .getSenders()
          .find(s => s.track?.kind === 'video')
        
        if (sender) {
          await sender.replaceTrack(newVideoTrack)
        }
      }

      this.videoTrack = newVideoTrack
      this.localStream.removeTrack(this.videoTrack)
      this.localStream.addTrack(newVideoTrack)

      this.emit('camera:switched', { cameraSource: this.cameraSource })
      return this.cameraSource
    } catch (error) {
      console.error('Failed to switch camera:', error)
      this.emit('error', { type: 'camera_switch', error })
      throw error
    }
  }

  /**
   * Toggle speaker
   */
  async toggleSpeaker() {
    try {
      this.isSpeakerOn = !this.isSpeakerOn

      // Set audio output (if supported)
      if (HTMLMediaElement.prototype.setSinkId) {
        const audioElement = document.querySelector('audio[data-remote-audio]')
        if (audioElement) {
          const deviceId = this.isSpeakerOn ? '' : 'default'
          await audioElement.setSinkId(deviceId)
        }
      }

      this.emit('speaker:toggled', { isSpeakerOn: this.isSpeakerOn })
      return this.isSpeakerOn
    } catch (error) {
      console.error('Failed to toggle speaker:', error)
      this.emit('error', { type: 'speaker_toggle', error })
      throw error
    }
  }

  /**
   * Enable Picture in Picture
   */
  async enablePictureInPicture(videoElement) {
    if (!videoElement) {
      console.warn('No video element provided')
      return false
    }

    try {
      if (document.pictureInPictureEnabled) {
        await videoElement.requestPictureInPicture()
        this.isPictureInPictureEnabled = true
        this.emit('pip:enabled', { isPictureInPictureEnabled: true })
        return true
      } else {
        console.warn('Picture in Picture not supported')
        return false
      }
    } catch (error) {
      console.error('Failed to enable PiP:', error)
      this.emit('error', { type: 'pip_enable', error })
      throw error
    }
  }

  /**
   * Disable Picture in Picture
   */
  async disablePictureInPicture() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        this.isPictureInPictureEnabled = false
        this.emit('pip:disabled', { isPictureInPictureEnabled: false })
        return false
      }
    } catch (error) {
      console.error('Failed to disable PiP:', error)
      this.emit('error', { type: 'pip_disable', error })
      throw error
    }
  }

  /**
   * Add ICE candidate (with queuing if remote description is not set yet)
   */
  async addIceCandidate(candidate) {
    if (!candidate) return

    if (!this.pendingCandidates) {
      this.pendingCandidates = []
    }

    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      this.pendingCandidates.push(candidate)
      return
    }

    try {
      const rtcCandidate = candidate.candidate ? new RTCIceCandidate(candidate) : candidate
      await this.peerConnection.addIceCandidate(rtcCandidate)
    } catch (error) {
      console.error('Failed to add ICE candidate:', error)
    }
  }

  /**
   * Create offer
   */
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.isVideoEnabled
      })
      await this.peerConnection.setLocalDescription(offer)
      this.emit('offer:created', offer)
      return offer
    } catch (error) {
      console.error('Failed to create offer:', error)
      this.emit('error', { type: 'offer_creation', error })
      throw error
    }
  }

  /**
   * Create answer
   */
  async createAnswer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)
      this.emit('answer:created', answer)
      return answer
    } catch (error) {
      console.error('Failed to create answer:', error)
      this.emit('error', { type: 'answer_creation', error })
      throw error
    }
  }

  /**
   * Set remote description and flush queued ICE candidates
   */
  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      )

      // Drain any queued ICE candidates
      if (this.pendingCandidates && this.pendingCandidates.length > 0) {
        for (const c of this.pendingCandidates) {
          try {
            const rtcCandidate = c.candidate ? new RTCIceCandidate(c) : c
            await this.peerConnection.addIceCandidate(rtcCandidate)
          } catch (e) {
            console.error('Failed to add queued candidate:', e)
          }
        }
        this.pendingCandidates = []
      }
    } catch (error) {
      console.error('Failed to set remote description:', error)
      this.emit('error', { type: 'remote_description', error })
      throw error
    }
  }

  /**
   * Close all connections
   */
  close() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
      })
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
    }

    this.localStream = null
    this.audioTrack = null
    this.videoTrack = null
    this.peerConnection = null
    this.pendingCandidates = []

    this.emit('closed', {})
  }

  /**
   * Get connection stats
   */
  async getStats() {
    if (!this.peerConnection) {
      return null
    }

    try {
      const stats = await this.peerConnection.getStats()
      const result = {
        audio: {},
        video: {},
        connection: {}
      }

      stats.forEach(report => {
        if (report.type === 'inbound-rtp') {
          if (report.kind === 'audio') {
            result.audio.inbound = report
          } else if (report.kind === 'video') {
            result.video.inbound = report
          }
        } else if (report.type === 'outbound-rtp') {
          if (report.kind === 'audio') {
            result.audio.outbound = report
          } else if (report.kind === 'video') {
            result.video.outbound = report
          }
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.connection = report
        }
      })

      return result
    } catch (error) {
      console.error('Failed to get stats:', error)
      return null
    }
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)

    return () => {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (e) {
          console.error(`Error in ${event} listener:`, e)
        }
      })
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.clear()
  }
}

/**
 * Permissions Handler
 */
export class PermissionsHandler {
  static async requestPermissions(options = {}) {
    const { audio = true, video = false } = options

    try {
      const permissions = []

      if (audio) {
        permissions.push('microphone')
      }
      if (video) {
        permissions.push('camera')
      }

      const results = await Promise.all(
        permissions.map(permission =>
          navigator.permissions.query({ name: permission }).then(result => ({
            permission,
            state: result.state
          }))
        )
      )

      return results
    } catch (error) {
      console.error('Failed to query permissions:', error)
      return []
    }
  }

  static async hasPermission(permission) {
    try {
      const result = await navigator.permissions.query({ name: permission })
      return result.state === 'granted'
    } catch (error) {
      console.error('Failed to check permission:', error)
      return false
    }
  }
}

/**
 * Network Recovery
 */
export class NetworkRecovery {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    this.isOnline = navigator.onLine
    this.listeners = new Map()

    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  handleOnline() {
    this.isOnline = true
    this.emit('online', {})
  }

  handleOffline() {
    this.isOnline = false
    this.emit('offline', {})
  }

  async retry(fn, context = this) {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await fn.call(context)
      } catch (error) {
        console.warn(`Retry ${i + 1}/${this.maxRetries} failed:`, error)
        if (i < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)))
        } else {
          throw error
        }
      }
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)

    return () => {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (e) {
          console.error(`Error in ${event} listener:`, e)
        }
      })
    }
  }
}

/**
 * Audio Focus Manager
 */
export class AudioFocusManager {
  constructor() {
    this.isFocused = true
    this.listeners = new Map()

    document.addEventListener('visibilitychange', () => this.handleVisibilityChange())
  }

  handleVisibilityChange() {
    this.isFocused = !document.hidden
    this.emit('focus:changed', { isFocused: this.isFocused })
  }

  hasFocus() {
    return this.isFocused
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)

    return () => {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (e) {
          console.error(`Error in ${event} listener:`, e)
        }
      })
    }
  }
}

export default {
  CallControls,
  PermissionsHandler,
  NetworkRecovery,
  AudioFocusManager
}
