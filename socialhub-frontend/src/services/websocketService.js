import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.userId = null
    this.listeners = []
  }

  /**
   * Connect to WebSocket server
   */
  connect(userId, onNotification) {
    if (this.connected) {
      console.warn('WebSocket already connected')
      return
    }

    this.userId = userId
    if (onNotification) {
      this.listeners.push(onNotification)
    }

    // Get JWT token from localStorage
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('[WebSocket] No JWT token found')
      return
    }

    // Pass token as query parameter for SockJS
    const wsUrl = `http://localhost:8080/ws?token=${token}`
    const socket = new SockJS(wsUrl)
    
    this.client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        login: userId,
        passcode: 'guest',
        Authorization: `Bearer ${token}`
      },
      onConnect: this.onConnected.bind(this),
      onStompError: this.onStompError.bind(this),
      onDisconnect: this.onDisconnected.bind(this),
      debug: (msg) => {
        console.log('[WS Debug]', msg)
      },
    })

    console.log('[WebSocket] Attempting to connect with token...')
    this.client.activate()
  }

  onConnected() {
    console.log('[WebSocket] Connected successfully')
    this.connected = true

    // Subscribe to user's personal notifications
    this.client.subscribe(`/topic/notifications/${this.userId}`, (message) => {
      try {
        const notification = JSON.parse(message.body)
        console.log('[WebSocket] Received notification:', notification)
        this.notifyListeners(notification)
      } catch (err) {
        console.error('[WebSocket] Failed to parse notification:', err)
      }
    })

    // Subscribe to broadcast notifications
    this.client.subscribe('/topic/notifications/broadcast', (message) => {
      try {
        const notification = JSON.parse(message.body)
        console.log('[WebSocket] Received broadcast:', notification)
        this.notifyListeners(notification)
      } catch (err) {
        console.error('[WebSocket] Failed to parse broadcast:', err)
      }
    })

    // Subscribe to call signaling messages
    this.client.subscribe(`/user/queue/call`, (message) => {
      try {
        const callMessage = JSON.parse(message.body)
        console.log('[WebSocket] Received call message:', callMessage)
        this.notifyListeners(callMessage)
      } catch (err) {
        console.error('[WebSocket] Failed to parse call message:', err)
      }
    })
  }

  onStompError(frame) {
    console.error('[WebSocket] STOMP error:', frame.headers['message'], frame.body)
    this.connected = false
  }

  onDisconnected() {
    console.log('[WebSocket] Disconnected')
    this.connected = false
  }

  notifyListeners(notification) {
    this.listeners.forEach((callback) => {
      try {
        callback(notification)
      } catch (err) {
        console.error('[WebSocket] Error in notification listener:', err)
      }
    })
  }

  /**
   * Subscribe to notifications (add listener)
   */
  subscribe(onNotification) {
    if (!this.listeners.includes(onNotification)) {
      this.listeners.push(onNotification)
    }
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(onNotification) {
    this.listeners = this.listeners.filter((cb) => cb !== onNotification)
  }

  /**
   * Send a message to the server via STOMP
   * @param {string} destination - Destination path (e.g., /app/call/{callId}/offer)
   * @param {object} body - Message body
   */
  sendMessage(destination, body) {
    if (!this.connected || !this.client) {
      console.error('[WebSocket] Cannot send message: not connected')
      return false
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body)
      })
      console.log(`[WebSocket] Sent message to ${destination}`)
      return true
    } catch (error) {
      console.error('[WebSocket] Failed to send message:', error)
      return false
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate()
      this.connected = false
      this.listeners = []
      console.log('[WebSocket] Disconnected')
    }
  }

  isConnected() {
    return this.connected
  }
}

export default new WebSocketService()
