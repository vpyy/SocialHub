package com.socialhub.chat.service;

import com.socialhub.chat.document.Conversation;
import com.socialhub.chat.document.Message;
import com.socialhub.chat.dto.*;
import com.socialhub.chat.repository.ConversationRepository;
import com.socialhub.chat.repository.MessageRepository;
import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.post.document.Post;
import com.socialhub.post.dto.PostDto;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository      messageRepository;
    private final UserRepository         userRepository;
    private final PostRepository         postRepository;

    // ── Get or create 1-1 conversation ───────────────────────────────────

    @Transactional
    public ConversationDto getOrCreateConversation(String currentUserId, String targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new ValidationException("Cannot start conversation with yourself");
        }
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        Conversation conv = conversationRepository
                .findDirectConversation(currentUserId, targetUserId)
                .orElseGet(() -> {
                    Conversation c = Conversation.builder()
                            .participantIds(List.of(currentUserId, targetUserId))
                            .createdAt(Instant.now())
                            .build();
                    Conversation saved = conversationRepository.save(c);
                    log.info("New conversation created: {}", saved.getId());
                    return saved;
                });

        return toConversationDto(conv, currentUserId);
    }

    // ── List conversations ────────────────────────────────────────────────

    public Page<ConversationDto> getConversations(String userId, int page, int size) {
        return conversationRepository
                .findByParticipantIdsContainingOrderByLastMessageAtDesc(
                        userId, PageRequest.of(page, size))
                .map(c -> toConversationDto(c, userId));
    }

    // ── Messages ──────────────────────────────────────────────────────────

    public Page<MessageDto> getMessages(String conversationId, String userId, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }
        return messageRepository
                .findByConversationIdOrderByCreatedAtAsc(conversationId, PageRequest.of(page, size))
                .map(this::toMessageDto);
    }

    @Transactional
    public MessageDto sendMessage(String conversationId, String senderId, SendMessageRequest req) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(senderId)) {
            throw new ValidationException("Access denied");
        }

        String type = req.getMessageType() != null ? req.getMessageType().toUpperCase() : "TEXT";

        // Validation
        if ("POST".equals(type) && (req.getSharedPostId() == null || req.getSharedPostId().isBlank())) {
            throw new ValidationException("sharedPostId is required for POST messages");
        }
        if (("IMAGE".equals(type) || "VIDEO".equals(type)) && (req.getMediaUrl() == null || req.getMediaUrl().isBlank())) {
            throw new ValidationException("mediaUrl is required for IMAGE/VIDEO messages");
        }
        if ("TEXT".equals(type) && (req.getContent() == null || req.getContent().isBlank())) {
            throw new ValidationException("content is required for TEXT messages");
        }

        Message msg = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .content(req.getContent())
                .messageType(type)
                .mediaUrl(req.getMediaUrl())
                .sharedPostId(req.getSharedPostId())
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        msg = messageRepository.save(msg);

        // Update conversation last message preview
        String preview = buildPreview(msg);
        conv.setLastMessage(preview);
        conv.setLastMessageAt(msg.getCreatedAt());
        conversationRepository.save(conv);

        log.info("Message {} sent in conversation {}", msg.getId(), conversationId);
        return toMessageDto(msg);
    }

    /** Mark all unread messages in a conversation as read (except own messages) */
    @Transactional
    public void markMessagesRead(String conversationId, String userId) {
        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        // Load unread messages not sent by current user
        PageRequest all = PageRequest.of(0, 1000);
        messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, all)
                .filter(m -> !m.getSenderId().equals(userId) && !m.isRead())
                .forEach(m -> {
                    m.setRead(true);
                    messageRepository.save(m);
                });
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private ConversationDto toConversationDto(Conversation c, String currentUserId) {
        List<ConversationDto.ParticipantDto> participants = c.getParticipantIds().stream()
                .map(uid -> userRepository.findById(uid)
                        .map(u -> ConversationDto.ParticipantDto.builder()
                                .userId(u.getId())
                                .username(u.getUsername())
                                .displayName(u.getDisplayName())
                                .avatarUrl(u.getAvatarUrl())
                                .build())
                        .orElse(ConversationDto.ParticipantDto.builder().userId(uid).build()))
                .toList();

        long unread = messageRepository
                .countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), currentUserId);

        return ConversationDto.builder()
                .id(c.getId())
                .participants(participants)
                .lastMessage(c.getLastMessage())
                .lastMessageAt(c.getLastMessageAt())
                .createdAt(c.getCreatedAt())
                .unreadCount(unread)
                .build();
    }

    private MessageDto toMessageDto(Message m) {
        MessageDto.MessageDtoBuilder b = MessageDto.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .mediaUrl(m.getMediaUrl())
                .sharedPostId(m.getSharedPostId())
                .isRead(m.isRead())
                .createdAt(m.getCreatedAt());

        userRepository.findById(m.getSenderId()).ifPresent(u -> {
            b.senderUsername(u.getUsername());
            b.senderDisplayName(u.getDisplayName());
            b.senderAvatarUrl(u.getAvatarUrl());
        });

        if ("POST".equals(m.getMessageType()) && m.getSharedPostId() != null) {
            postRepository.findById(m.getSharedPostId()).ifPresent(post -> {
                User author = userRepository.findById(post.getAuthorId()).orElse(null);
                b.sharedPost(buildPostDto(post, author));
            });
        }

        return b.build();
    }

    private PostDto buildPostDto(Post post, User author) {
        PostDto.PostDtoBuilder pb = PostDto.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .content(post.getContent())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .createdAt(post.getCreatedAt());
        if (author != null) {
            pb.authorUsername(author.getUsername())
              .authorDisplayName(author.getDisplayName())
              .authorAvatarUrl(author.getAvatarUrl());
        }
        return pb.build();
    }

    private String buildPreview(Message m) {
        return switch (m.getMessageType()) {
            case "IMAGE" -> "📷 Hình ảnh";
            case "VIDEO" -> "🎬 Video";
            case "POST"  -> "📄 Đã chia sẻ bài viết";
            default -> m.getContent() != null && m.getContent().length() > 60
                    ? m.getContent().substring(0, 60) + "…"
                    : m.getContent();
        };
    }
}
