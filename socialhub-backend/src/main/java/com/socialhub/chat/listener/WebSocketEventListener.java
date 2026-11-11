package com.socialhub.chat.listener;

import com.socialhub.chat.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Listener for WebSocket session events
 * Manages user presence based on connection/disconnection
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    
    private final PresenceService presenceService;
    
    private static final String USER_ID_HEADER = "userId";
    
    /**
     * Handle WebSocket connection event
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Extract userId from session attributes
        String userId = (String) headerAccessor.getSessionAttributes().get(USER_ID_HEADER);
        
        if (userId != null && sessionId != null) {
            presenceService.userConnected(userId, sessionId);
            log.info("WebSocket connected: userId={}, sessionId={}", userId, sessionId);
        } else {
            log.warn("WebSocket connected without userId: sessionId={}", sessionId);
        }
    }
    
    /**
     * Handle WebSocket disconnection event
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Extract userId from session attributes
        String userId = (String) headerAccessor.getSessionAttributes().get(USER_ID_HEADER);
        
        if (userId != null && sessionId != null) {
            presenceService.userDisconnected(userId, sessionId);
            log.info("WebSocket disconnected: userId={}, sessionId={}", userId, sessionId);
        } else {
            log.warn("WebSocket disconnected without userId: sessionId={}", sessionId);
        }
    }
}
