package com.socialhub.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * WebSocket message for real-time notifications
 * Sent through STOMP to browsers
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationMessage {

    private String id;
    private String userId;
    private String type; // LIKE, COMMENT, FOLLOW, MENTION, MESSAGE
    private String title;
    private String body;
    private String actionUrl; // URL to navigate to when clicked
    private String avatarUrl;
    private Instant timestamp;
    private boolean read;

    public static NotificationMessage like(String postId, String actorName) {
        return NotificationMessage.builder()
                .type("LIKE")
                .title("❤️ " + actorName)
                .body("liked your post")
                .actionUrl("/posts/" + postId)
                .timestamp(Instant.now())
                .read(false)
                .build();
    }

    public static NotificationMessage comment(String postId, String actorName) {
        return NotificationMessage.builder()
                .type("COMMENT")
                .title("💬 " + actorName)
                .body("commented on your post")
                .actionUrl("/posts/" + postId)
                .timestamp(Instant.now())
                .read(false)
                .build();
    }

    public static NotificationMessage follow(String userId, String actorName) {
        return NotificationMessage.builder()
                .type("FOLLOW")
                .title("👤 " + actorName)
                .body("started following you")
                .actionUrl("/profile/" + userId)
                .timestamp(Instant.now())
                .read(false)
                .build();
    }

    public static NotificationMessage message(String conversationId, String senderName) {
        return NotificationMessage.builder()
                .type("MESSAGE")
                .title("💌 " + senderName)
                .body("sent you a message")
                .actionUrl("/messages/" + conversationId)
                .timestamp(Instant.now())
                .read(false)
                .build();
    }
}
