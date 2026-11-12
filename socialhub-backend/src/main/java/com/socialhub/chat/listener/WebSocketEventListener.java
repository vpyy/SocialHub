package com.socialhub.chat.listener;

import com.socialhub.chat.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

/**
 * Listener for WebSocket session events
 * Manages user presence based on connection/disconnection
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final PresenceService presenceService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String userId = extractUserId(accessor);

        if (userId != null && sessionId != null) {
            presenceService.userConnected(userId, sessionId);
            log.info("[WS] Connected: userId={}, sessionId={}", userId, sessionId);
        } else {
            log.warn("[WS] Connected without userId: sessionId={}", sessionId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String userId = extractUserId(accessor);

        if (userId != null && sessionId != null) {
            presenceService.userDisconnected(userId, sessionId);
            log.info("[WS] Disconnected: userId={}, sessionId={}", userId, sessionId);
        } else {
            log.warn("[WS] Disconnected without userId: sessionId={}", sessionId);
        }
    }

    /**
     * Extract userId from Principal (set by interceptor) or fallback to sessionAttributes.
     */
    private String extractUserId(StompHeaderAccessor accessor) {
        // Primary: read from STOMP Principal set by StompAuthorizationInterceptor
        Principal principal = accessor.getUser();
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            Object p = auth.getPrincipal();
            if (p instanceof String s && !s.isBlank()) return s;
        }
        if (principal != null && principal.getName() != null) {
            return principal.getName();
        }

        // Fallback: session attributes (also set by interceptor)
        if (accessor.getSessionAttributes() != null) {
            Object attr = accessor.getSessionAttributes().get("userId");
            if (attr instanceof String s && !s.isBlank()) return s;
        }

        return null;
    }
}
