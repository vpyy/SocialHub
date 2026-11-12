import { useEffect, useRef, useCallback } from 'react'
import websocketService from '../services/websocketService'

/**
 * useWebSocket — connects & manages WebSocket lifecycle for a component.
 *
 * @param {string}   userId           Current user's ID
 * @param {object}   handlers         Event handlers keyed by type
 * @param {function} [handlers.onMessage]   Chat events (message:new / edited / deleted / …)
 * @param {function} [handlers.onPresence]  Presence update events
 * @param {function} [handlers.onCall]      Call signaling events
 * @param {function} [handlers.onReconnect] Called after successful reconnect (use to sync missed messages)
 * @param {string}   [activeConvId]   Current open conversation (subscribes typing indicator)
 * @param {function} [onTyping]       Typing event callback for the active conversation
 */
export default function useWebSocket(userId, handlers = {}, activeConvId = null, onTyping = null) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers  // always up-to-date without re-running effect

  const prevConvIdRef = useRef(null)

  // ── Connect & register listeners ─────────────────────────────────────

  useEffect(() => {
    if (!userId) return

    const onMessage  = (data) => handlersRef.current.onMessage?.(data)
    const onPresence = (data) => handlersRef.current.onPresence?.(data)
    const onCall     = (data) => handlersRef.current.onCall?.(data)

    websocketService.connect(userId)
    websocketService.addListener('message', onMessage)
    websocketService.addListener('presence', onPresence)
    websocketService.addListener('call', onCall)

    const removeReconnect = handlers.onReconnect
      ? websocketService.onReconnect(handlers.onReconnect)
      : null

    return () => {
      websocketService.removeListener('message', onMessage)
      websocketService.removeListener('presence', onPresence)
      websocketService.removeListener('call', onCall)
      removeReconnect?.()
    }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Typing subscription (changes per active conversation) ─────────────

  useEffect(() => {
    if (prevConvIdRef.current && prevConvIdRef.current !== activeConvId) {
      websocketService.unsubscribeTyping(prevConvIdRef.current)
    }
    if (activeConvId && onTyping) {
      websocketService.subscribeTyping(activeConvId, onTyping)
    }
    prevConvIdRef.current = activeConvId
    return () => {
      if (activeConvId) websocketService.unsubscribeTyping(activeConvId)
    }
  }, [activeConvId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers exposed to component ─────────────────────────────────────

  const sendTyping = useCallback((convId, typing) => {
    websocketService.sendTyping(convId, typing)
  }, [])

  const publish = useCallback((destination, body) => {
    websocketService.publish(destination, body)
  }, [])

  return { sendTyping, publish, isConnected: () => websocketService.isConnected() }
}
