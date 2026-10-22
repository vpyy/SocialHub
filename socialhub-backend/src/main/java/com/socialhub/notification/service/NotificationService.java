package com.socialhub.notification.service;

import com.socialhub.notification.document.Notification;
import com.socialhub.notification.dto.NotificationDto;
import com.socialhub.notification.repository.NotificationRepository;
import com.socialhub.post.document.Post;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Comment;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import com.socialhub.websocket.controller.WebSocketNotificationHandler;
import com.socialhub.websocket.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final PostRepository         postRepository;
    private final WebSocketNotificationHandler websocketHandler;

    // ── Read ──────────────────────────────────────────────────────────────

    public Page<NotificationDto> getNotifications(String userId, int page, int size) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(n -> toDto(n));
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    // ── Mark read ─────────────────────────────────────────────────────────

    @Transactional
    public void markAllRead(String userId) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(
                        userId, PageRequest.of(0, 500))
                .getContent();

        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        log.info("Marked {} notifications as read for user {}", unread.size(), userId);
    }

    @Transactional
    public void markOneRead(String notificationId, String userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getRecipientId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    // ── Create (called internally by LikeService / CommentService) ────────

    public void createLikeNotification(String actorId, String recipientId, String postId) {
        if (actorId.equals(recipientId)) return;   // don't notify yourself
        Notification n = Notification.builder()
                .recipientId(recipientId)
                .actorId(actorId)
                .type("LIKE")
                .postId(postId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(n);
        log.debug("LIKE notification saved → recipient={}", recipientId);

        // Send WebSocket notification
        Optional<User> actor = userRepository.findById(actorId);
        if (actor.isPresent()) {
            NotificationMessage wsMsg = NotificationMessage.like(postId, actor.get().getDisplayName());
            wsMsg.setUserId(recipientId);
            wsMsg.setAvatarUrl(actor.get().getAvatarUrl());
            websocketHandler.sendNotificationToUser(recipientId, wsMsg);
        }
    }

    public void createCommentNotification(String actorId, String recipientId,
                                          String postId, String commentId) {
        if (actorId.equals(recipientId)) return;
        Notification n = Notification.builder()
                .recipientId(recipientId)
                .actorId(actorId)
                .type("COMMENT")
                .postId(postId)
                .commentId(commentId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(n);
        log.debug("COMMENT notification saved → recipient={}", recipientId);

        // Send WebSocket notification
        Optional<User> actor = userRepository.findById(actorId);
        if (actor.isPresent()) {
            NotificationMessage wsMsg = NotificationMessage.comment(postId, actor.get().getDisplayName());
            wsMsg.setUserId(recipientId);
            wsMsg.setAvatarUrl(actor.get().getAvatarUrl());
            websocketHandler.sendNotificationToUser(recipientId, wsMsg);
        }
    }

    public void createFollowNotification(String actorId, String recipientId) {
        if (actorId.equals(recipientId)) return;
        Notification n = Notification.builder()
                .recipientId(recipientId)
                .actorId(actorId)
                .type("FOLLOW")
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        notificationRepository.save(n);
        log.debug("FOLLOW notification saved → recipient={}", recipientId);

        // Send WebSocket notification
        Optional<User> actor = userRepository.findById(actorId);
        if (actor.isPresent()) {
            NotificationMessage wsMsg = NotificationMessage.follow(recipientId, actor.get().getDisplayName());
            wsMsg.setUserId(recipientId);
            wsMsg.setAvatarUrl(actor.get().getAvatarUrl());
            websocketHandler.sendNotificationToUser(recipientId, wsMsg);
        }
    }

    // ── Mapping ───────────────────────────────────────────────────────────

    private NotificationDto toDto(Notification n) {
        NotificationDto.NotificationDtoBuilder b = NotificationDto.builder()
                .id(n.getId())
                .recipientId(n.getRecipientId())
                .actorId(n.getActorId())
                .type(n.getType())
                .postId(n.getPostId())
                .commentId(n.getCommentId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt());

        // Enrich actor info
        userRepository.findById(n.getActorId()).ifPresent(u -> {
            b.actorUsername(u.getUsername());
            b.actorDisplayName(u.getDisplayName());
            b.actorAvatarUrl(u.getAvatarUrl());
        });

        // Enrich post preview
        if (n.getPostId() != null) {
            postRepository.findById(n.getPostId()).ifPresent(p -> {
                String content = p.getContent();
                if (content != null) {
                    b.postContentPreview(content.length() > 80
                            ? content.substring(0, 80) + "…" : content);
                }
            });
        }

        return b.build();
    }
}
