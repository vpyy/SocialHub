package com.socialhub.websocket.controller;

import com.socialhub.websocket.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * WebSocket handler for real-time notifications
 * Sends notifications to connected clients via STOMP
 * 
 * Uses convertAndSendToUser() to send to /user/queue/notifications
 * which auto-routes to the user's unique queue
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketNotificationHandler {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send notification to specific user via /user/queue/notifications
     * Client subscribes to /user/queue/notifications
     */
    public void sendNotificationToUser(String userId, NotificationMessage message) {
        log.info("Sending notification to user {} — {}", userId, message.getType());
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/notifications",
                message
        );
    }

    /**
     * Broadcast notification to all connected clients
     * (kept for backward compatibility, not recommended)
     */
    @Deprecated
    public void broadcastNotification(NotificationMessage message) {
        log.info("Broadcasting notification — {} (deprecated, use topic approach)", message.getType());
        messagingTemplate.convertAndSend("/topic/notifications/broadcast", message);
    }
}
