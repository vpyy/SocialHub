import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
const RECONNECT_DELAY_MS = 5000
const MAX_RECONNECT_ATTEMPTS = 10

/**
 * WebSocketService — singleton
 *
 * Channels subscribed when connected:
 *   /user/queue/messages  — chat events (message:new, edited, deleted, unsent, reaction, pinned, read)
 *   /user/queue/presence  — presence updates (online/offline + lastSeenAt)
 *   /user/queue/call      — call signaling
 *   /topic/notifications/{userId}        — general notifications
 *   /topic/notifications/broadcast       — broadcast notifications
 *   /topic/conversation/{id}/typing      — typing indicators (subscribed per-conversation)
 */
class WebSocketService {
  constructor() {
    this.client = null
    this.connected = false
    this.userId = null

    // Listener maps keyed by channel type
    this._listeners = {
      message: [],   // /user/queue/messages
      presence: [],  // /user/queue/presence
      typing: [],    // /topic/conversation/{id}/typing
      call: [],      // /user/queue/call
      notification: [],
    }

    this._typingSubscriptions = new Map()  // conversationId → STOMP subscription
    this._reconnectAttempts = 0
    this._manuallyDisconnected = false
    this._onReconnectCallbacks = []  // called after successful reconnect
  }

  // ── Connection ────────────────────────────────────────────────────────

  connect(userId, onNotification = null) {
    // If already connected for same user, skip
    if (this.connected && this.userId === userId && this.client) return

    // If client exists but not connected (stale), deactivate first
    if (this.client && !this.connected) {
      try { this.client.deactivate() } catch {}
      this.client = null
    }

    this.userId = userId
    this._manuallyDisconnected = false

    if (onNotification) {
      this.addListener('notification', onNotification)
      this.addListener('call', onNotification)
    }

    this._createClient()
    console.log('[WS] Connecting for user:', userId)
    this.client.activate()
  }

  _createClient() {
    const token = localStorage.getItem('token')
    if (!token) { console.error('[WS] No JWT token'); return }

    const socketFactory = () => new SockJS(`${WS_URL}?token=${token}`)

    this.client = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: {
        login: this.userId,
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: RECONNECT_DELAY_MS,
      onConnect: (frame) => this._onConnected(frame),
      onStompError: (frame) => this._onError(frame),
      onDisconnect: () => this._onDisconnected(),
      onWebSocketClose: () => {
        if (!this._manuallyDisconnected) {
          console.warn('[WS] WebSocket closed, will reconnect...')
        }
      },
    })
  }

  _onConnected(frame) {
    console.log('[WS] ✅ Connected successfully, userId:', this.userId)
    this.connected = true
    this._reconnectAttempts = 0

    // ── Core subscriptions ─────────────────────────────────────────────

    // Chat events: message:new, edited, deleted, unsent, reaction, pinned, read
    this.client.subscribe('/user/queue/messages', (msg) => {
      const data = this._parse(msg)
      console.log('[WS] 📨 chat event:', data?.type, data)
      this._dispatch('message', data)
    })

    // Presence events
    this.client.subscribe('/user/queue/presence', (msg) => {
      const data = this._parse(msg)
      console.log('[WS] 👤 presence event:', data)
      this._dispatch('presence', data)
    })

    // Call signaling
    this.client.subscribe('/user/queue/call', (msg) => {
      const data = this._parse(msg)
      console.log('[WS] 📞 call event:', data?.type)
      this._dispatch('call', data)
      this._dispatch('notification', data)
    })

    // General notifications (personal + broadcast)
    this.client.subscribe(`/topic/notifications/${this.userId}`, (msg) => {
      const data = this._parse(msg)
      console.log('[WS] 🔔 notification:', data?.type)
      this._dispatch('notification', data)
    })
    this.client.subscribe('/topic/notifications/broadcast', (msg) => {
      this._dispatch('notification', this._parse(msg))
    })

    // Re-subscribe typing for any active conversations
    this._typingSubscriptions.forEach((entry, convId) => {
      const cb = typeof entry === 'function' ? entry : entry?.callback
      if (cb) this._typingSubscriptions.set(convId, cb)
      this._subscribeTyping(convId)
    })

    // Notify reconnect callbacks (for missed message sync)
    this._onReconnectCallbacks.forEach(cb => { try { cb() } catch {} })
  }

  _onError(frame) {
    console.error('[WS] STOMP error:', frame.headers?.message)
    this.connected = false
  }

  _onDisconnected() {
    this.connected = false
    if (this._manuallyDisconnected) return
    this._reconnectAttempts++
    if (this._reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      console.log(`[WS] Reconnecting (attempt ${this._reconnectAttempts})...`)
    }
  }

  disconnect() {
    this._manuallyDisconnected = true
    this.connected = false
    this._typingSubscriptions.clear()
    if (this.client) {
      try { this.client.deactivate() } catch (e) { /* silent */ }
    }
  }

  isConnected() { return this.connected }

  // ── Typing indicator subscriptions (per-conversation) ─────────────────

  subscribeTyping(conversationId, callback) {
    // Store callback in the map so it survives reconnects
    if (!this._typingSubscriptions.has(conversationId)) {
      this._typingSubscriptions.set(conversationId, callback)
    }
    if (this.connected) {
      this._subscribeTyping(conversationId)
    }
  }

  _subscribeTyping(conversationId) {
    const cb = this._typingSubscriptions.get(conversationId)
    if (!cb || !this.client) return
    try {
      const sub = this.client.subscribe(
        `/topic/conversation/${conversationId}/typing`,
        (msg) => { try { cb(this._parse(msg)) } catch (e) { /* silent */ } }
      )
      // Replace the map entry with the actual subscription object for unsubscription
      this._typingSubscriptions.set(conversationId, { callback: cb, sub })
    } catch (e) {
      console.error('[WS] Failed to subscribe typing:', e)
    }
  }

  unsubscribeTyping(conversationId) {
    const entry = this._typingSubscriptions.get(conversationId)
    if (entry?.sub) {
      try { entry.sub.unsubscribe() } catch (e) { /* silent */ }
    }
    this._typingSubscriptions.delete(conversationId)
  }

  // ── Send helpers ──────────────────────────────────────────────────────

  sendTyping(conversationId, typing) {
    this.publish('/app/chat/typing', { conversationId, typing })
  }

  publish(destination, body) {
    if (!this.connected || !this.client) {
      console.warn('[WS] Cannot publish: not connected to', destination)
      return false
    }
    try {
      this.client.publish({ destination, body: JSON.stringify(body) })
      return true
    } catch (e) {
      console.error('[WS] Publish error:', e)
      return false
    }
  }

  /** Legacy alias used by call handling code */
  sendMessage(destination, body) { return this.publish(destination, body) }

  // ── Listener management ───────────────────────────────────────────────

  addListener(type, cb) {
    if (!this._listeners[type]) return
    if (!this._listeners[type].includes(cb)) this._listeners[type].push(cb)
  }

  removeListener(type, cb) {
    if (!this._listeners[type]) return
    this._listeners[type] = this._listeners[type].filter(fn => fn !== cb)
  }

  /** Called when WS reconnects successfully — use to sync missed messages */
  onReconnect(cb) {
    if (!this._onReconnectCallbacks.includes(cb)) {
      this._onReconnectCallbacks.push(cb)
    }
    return () => {
      this._onReconnectCallbacks = this._onReconnectCallbacks.filter(fn => fn !== cb)
    }
  }

  // Legacy API (used by call handlers in Messages.jsx)
  subscribe(cb) { this.addListener('notification', cb) }
  unsubscribe(cb) { this.removeListener('notification', cb) }

  // ── Internal helpers ──────────────────────────────────────────────────

  _parse(msg) {
    try { return JSON.parse(msg.body) } catch { return msg.body }
  }

  _dispatch(type, data) {
    if (!data) return
    const listeners = this._listeners[type] || []
    listeners.forEach(cb => { try { cb(data) } catch (e) { /* silent */ } })
  }
}

export default new WebSocketService()
