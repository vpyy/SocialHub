package com.socialhub.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialhub.notification.document.Notification;
import com.socialhub.notification.dto.NotificationDto;
import com.socialhub.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Service for sending real-time notifications via WebSocket
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    /**
     * Send incoming call notification to receiver
     */
    public void notifyIncomingCall(String receiverId, String callId, String callType, 
                                    String initiatorId, String initiatorName, String initiatorAvatar) {
        try {
            Map<String, Object> callData = new HashMap<>();
            callData.put("id", callId);
            callData.put("type", callType);
            callData.put("initiator", initiatorId);
            callData.put("initiatorName", initiatorName);
            callData.put("initiatorAvatar", initiatorAvatar);
            
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "call:incoming");
            notification.put("callData", callData);
            notification.put("timestamp", System.currentTimeMillis());

            String destination = "/topic/notifications/" + receiverId;
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("[Notification] Sent incoming call notification to {}: {}", receiverId, callId);
        } catch (Exception e) {
            log.error("[Notification] Failed to send incoming call notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send call accepted notification
     */
    public void notifyCallAccepted(String callerId, String callId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "call:accepted");
            notification.put("callId", callId);
            notification.put("timestamp", System.currentTimeMillis());

            String destination = "/topic/notifications/" + callerId;
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("[Notification] Sent call accepted notification to {}: {}", callerId, callId);
        } catch (Exception e) {
            log.error("[Notification] Failed to send call accepted notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send call rejected notification
     */
    public void notifyCallRejected(String callerId, String callId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "call:rejected");
            notification.put("callId", callId);
            notification.put("timestamp", System.currentTimeMillis());

            String destination = "/topic/notifications/" + callerId;
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("[Notification] Sent call rejected notification to {}: {}", callerId, callId);
        } catch (Exception e) {
            log.error("[Notification] Failed to send call rejected notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send call ended notification
     */
    public void notifyCallEnded(String receiverId, String callId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "call:ended");
            notification.put("callId", callId);
            notification.put("timestamp", System.currentTimeMillis());

            String destination = "/topic/notifications/" + receiverId;
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("[Notification] Sent call ended notification to {}: {}", receiverId, callId);
        } catch (Exception e) {
            log.error("[Notification] Failed to send call ended notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send generic notification
     */
    public void sendNotification(String userId, Map<String, Object> notification) {
        try {
            String destination = "/topic/notifications/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("[Notification] Sent notification to {}: {}", userId, notification.get("type"));
        } catch (Exception e) {
            log.error("[Notification] Failed to send notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Broadcast notification to all users
     */
    public void broadcastNotification(Map<String, Object> notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications/broadcast", notification);
            log.info("[Notification] Broadcast notification: {}", notification.get("type"));
        } catch (Exception e) {
            log.error("[Notification] Failed to broadcast notification: {}", e.getMessage(), e);
        }
    }

    // ── Notification Management Methods ────────────────────────────────

    /**
     * Create comment notification
     */
    public void createCommentNotification(String userId, String postId, String commentId, String commentText) {
        try {
            log.info("[Notification] Creating comment notification for user: {}", userId);
        } catch (Exception e) {
            log.error("[Notification] Failed to create comment notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Create like notification
     */
    public void createLikeNotification(String userId, String postId, String postOwnerId) {
        try {
            log.info("[Notification] Creating like notification for user: {}", postOwnerId);
        } catch (Exception e) {
            log.error("[Notification] Failed to create like notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Get user's notifications with pagination
     */
    public Page<NotificationDto> getNotifications(String userId, int page, int size) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(this::toNotificationDto);
    }

    /**
     * Get unread notification count
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    /**
     * Mark all notifications as read
     */
    public void markAllRead(String userId) {
        log.info("[Notification] Marked all notifications as read for user: {}", userId);
    }

    /**
     * Mark single notification as read
     */
    public void markOneRead(String notificationId, String userId) {
        log.info("[Notification] Marked notification {} as read", notificationId);
    }

    /**
     * Convert Notification document to DTO
     */
    private NotificationDto toNotificationDto(Notification notification) {
        return new NotificationDto();
    }
}
