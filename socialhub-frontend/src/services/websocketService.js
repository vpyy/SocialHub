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

    const socket = new SockJS('http://localhost:8080/ws')
    this.client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        login: userId,
        passcode: 'guest',
      },
      onConnect: this.onConnected.bind(this),
      onStompError: this.onStompError.bind(this),
      onDisconnect: this.onDisconnected.bind(this),
      debug: (msg) => {
        console.log('[WS Debug]', msg)
      },
    })

    console.log('[WebSocket] Attempting to connect...')
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
