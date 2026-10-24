package com.socialhub.websocket.controller;

import com.socialhub.websocket.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * WebSocket handler for real-time notifications
 * Sends notifications to connected clients via STOMP
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketNotificationHandler {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send notification to specific user
     * Broadcasts to /topic/notifications/{userId}
     */
    public void sendNotificationToUser(String userId, NotificationMessage message) {
        log.info("Sending notification to user {} — {}", userId, message.getType());
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + userId,
                message
        );
    }

    /**
     * Broadcast notification to all connected clients
     */
    public void broadcastNotification(NotificationMessage message) {
        log.info("Broadcasting notification — {}", message.getType());
        messagingTemplate.convertAndSend("/topic/notifications/broadcast", message);
    }
}
