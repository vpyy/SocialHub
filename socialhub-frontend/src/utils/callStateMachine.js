/**
 * Call State Machine
 * Manages call states, transitions, and event listeners
 * States: IDLE, CALLING, RINGING, CONNECTING, CONNECTED, ENDED, REJECTED, BUSY, MISSED, FAILED
 */

export const CALL_STATES = {
  IDLE: 'IDLE',
  CALLING: 'CALLING',
  RINGING: 'RINGING',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ENDED: 'ENDED',
  REJECTED: 'REJECTED',
  BUSY: 'BUSY',
  MISSED: 'MISSED',
  FAILED: 'FAILED'
}

export const CALL_EVENTS = {
  INITIATED: 'call:initiated',
  RINGING: 'call:ringing',
  ACCEPTED: 'call:accepted',
  REJECTED: 'call:rejected',
  CONNECTED: 'call:connected',
  DISCONNECTED: 'call:disconnected',
  ENDED: 'call:ended',
  FAILED: 'call:failed',
  MISSED: 'call:missed',
  BUSY: 'call:busy'
}

export class CallStateManager {
  constructor() {
    this.state = CALL_STATES.IDLE
    this.listeners = new Map()
    this.callData = {
      id: null,
      type: null, // 'VOICE' or 'VIDEO'
      initiator: null,
      receiver: null,
      startTime: null,
      duration: 0,
      durationInterval: null
    }
    this.missedCallTimeout = null
    this.ringtone = null
  }

  /**
   * Get current state
   */
  getState() {
    return this.state
  }

  /**
   * Get call data
   */
  getCallData() {
    return { ...this.callData }
  }

  /**
   * Initiate a call
   */
  initiateCall(callId, callType, initiator, receiver) {
    if (this.state !== CALL_STATES.IDLE) {
      throw new Error(`Cannot initiate call in ${this.state} state`)
    }

    this.callData = {
      id: callId,
      type: callType,
      initiator,
      receiver,
      startTime: null,
      duration: 0,
      durationInterval: null
    }

    this.setState(CALL_STATES.CALLING)
    this.emit(CALL_EVENTS.INITIATED, this.callData)

    // Set timeout for missed calls (30 seconds)
    this.missedCallTimeout = setTimeout(() => {
      if (this.state === CALL_STATES.RINGING) {
        this.setMissedCall()
      }
    }, 30000)

    return this.callData
  }

  /**
   * Receive incoming call
   */
  receiveCall(callId, callType, initiator, receiver) {
    if (this.state !== CALL_STATES.IDLE) {
      throw new Error(`Cannot receive call in ${this.state} state`)
    }

    this.callData = {
      id: callId,
      type: callType,
      initiator,
      receiver,
      startTime: null,
      duration: 0,
      durationInterval: null
    }

    this.setState(CALL_STATES.RINGING)
    this.emit(CALL_EVENTS.RINGING, this.callData)
    this.playRingtone()

    // Set timeout for missed calls
    this.missedCallTimeout = setTimeout(() => {
      if (this.state === CALL_STATES.RINGING) {
        this.setMissedCall()
      }
    }, 30000)

    return this.callData
  }

  /**
   * Accept call
   */
  acceptCall() {
    if (this.state !== CALL_STATES.RINGING && this.state !== CALL_STATES.CALLING) {
      throw new Error(`Cannot accept call in ${this.state} state`)
    }

    this.clearMissedCallTimeout()
    this.stopRingtone()
    this.setState(CALL_STATES.CONNECTING)
    this.emit(CALL_EVENTS.ACCEPTED, this.callData)

    return this.callData
  }

  /**
   * Establish connection
   */
  setConnected() {
    if (this.state !== CALL_STATES.CONNECTING) {
      throw new Error(`Cannot connect in ${this.state} state`)
    }

    this.callData.startTime = Date.now()
    this.startDurationTimer()
    this.setState(CALL_STATES.CONNECTED)
    this.emit(CALL_EVENTS.CONNECTED, this.callData)

    return this.callData
  }

  /**
   * Reject call
   */
  rejectCall() {
    if (this.state !== CALL_STATES.RINGING) {
      throw new Error(`Cannot reject call in ${this.state} state`)
    }

    this.clearMissedCallTimeout()
    this.stopRingtone()
    this.setState(CALL_STATES.REJECTED)
    this.emit(CALL_EVENTS.REJECTED, this.callData)
    this.reset()

    return this.callData
  }

  /**
   * End call
   */
  endCall() {
    if (this.state === CALL_STATES.IDLE || this.state === CALL_STATES.ENDED) {
      return
    }

    this.clearMissedCallTimeout()
    this.stopRingtone()
    this.stopDurationTimer()
    this.setState(CALL_STATES.ENDED)
    this.emit(CALL_EVENTS.ENDED, this.callData)

    setTimeout(() => {
      this.reset()
    }, 1000)

    return this.callData
  }

  /**
   * Set call as missed
   */
  setMissedCall() {
    if (this.state !== CALL_STATES.RINGING) {
      return
    }

    this.stopRingtone()
    this.setState(CALL_STATES.MISSED)
    this.emit(CALL_EVENTS.MISSED, this.callData)
    
    setTimeout(() => {
      this.reset()
    }, 2000)
  }

  /**
   * Set busy (callee already in call)
   */
  setBusy() {
    if (this.state !== CALL_STATES.CALLING) {
      return
    }

    this.clearMissedCallTimeout()
    this.setState(CALL_STATES.BUSY)
    this.emit(CALL_EVENTS.BUSY, this.callData)

    setTimeout(() => {
      this.reset()
    }, 2000)
  }

  /**
   * Set call as failed
   */
  setFailed(reason) {
    this.clearMissedCallTimeout()
    this.stopRingtone()
    this.stopDurationTimer()
    this.setState(CALL_STATES.FAILED)
    this.emit(CALL_EVENTS.FAILED, { ...this.callData, failureReason: reason })

    setTimeout(() => {
      this.reset()
    }, 2000)
  }

  /**
   * Set state with validation
   */
  setState(newState) {
    const validTransitions = {
      [CALL_STATES.IDLE]: [CALL_STATES.CALLING, CALL_STATES.RINGING],
      [CALL_STATES.CALLING]: [CALL_STATES.CONNECTING, CALL_STATES.REJECTED, CALL_STATES.BUSY, CALL_STATES.MISSED, CALL_STATES.FAILED, CALL_STATES.ENDED],
      [CALL_STATES.RINGING]: [CALL_STATES.CONNECTING, CALL_STATES.REJECTED, CALL_STATES.MISSED, CALL_STATES.FAILED, CALL_STATES.ENDED],
      [CALL_STATES.CONNECTING]: [CALL_STATES.CONNECTED, CALL_STATES.FAILED, CALL_STATES.ENDED],
      [CALL_STATES.CONNECTED]: [CALL_STATES.ENDED],
      [CALL_STATES.ENDED]: [],
      [CALL_STATES.REJECTED]: [],
      [CALL_STATES.BUSY]: [],
      [CALL_STATES.MISSED]: [],
      [CALL_STATES.FAILED]: []
    }

    if (!validTransitions[this.state]?.includes(newState)) {
      console.warn(`Invalid transition from ${this.state} to ${newState}`)
      return
    }

    this.state = newState
  }

  /**
   * Start duration timer
   */
  startDurationTimer() {
    if (this.callData.durationInterval) {
      clearInterval(this.callData.durationInterval)
    }

    this.callData.durationInterval = setInterval(() => {
      if (this.callData.startTime) {
        this.callData.duration = Math.floor((Date.now() - this.callData.startTime) / 1000)
      }
    }, 1000)
  }

  /**
   * Stop duration timer
   */
  stopDurationTimer() {
    if (this.callData.durationInterval) {
      clearInterval(this.callData.durationInterval)
      this.callData.durationInterval = null
    }
  }

  /**
   * Format duration
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  /**
   * Play ringtone
   */
  playRingtone() {
    if (!this.ringtone) {
      this.ringtone = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==')
      this.ringtone.loop = true
      this.ringtone.volume = 0.5
    }
    try {
      this.ringtone.play().catch(e => console.warn('Failed to play ringtone:', e))
    } catch (e) {
      console.warn('Cannot play ringtone:', e)
    }
  }

  /**
   * Stop ringtone
   */
  stopRingtone() {
    if (this.ringtone) {
      try {
        this.ringtone.pause()
        this.ringtone.currentTime = 0
      } catch (e) {
        console.warn('Cannot stop ringtone:', e)
      }
    }
  }

  /**
   * Clear missed call timeout
   */
  clearMissedCallTimeout() {
    if (this.missedCallTimeout) {
      clearTimeout(this.missedCallTimeout)
      this.missedCallTimeout = null
    }
  }

  /**
   * Reset to IDLE
   */
  reset() {
    this.clearMissedCallTimeout()
    this.stopRingtone()
    this.stopDurationTimer()
    this.state = CALL_STATES.IDLE
    this.callData = {
      id: null,
      type: null,
      initiator: null,
      receiver: null,
      startTime: null,
      duration: 0,
      durationInterval: null
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

    // Return unsubscribe function
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

export default CallStateManager
