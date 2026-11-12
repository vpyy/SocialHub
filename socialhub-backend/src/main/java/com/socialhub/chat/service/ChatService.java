package com.socialhub.chat.service;

import com.socialhub.chat.document.Call;
import com.socialhub.chat.document.Conversation;
import com.socialhub.chat.document.Message;
import com.socialhub.chat.document.UserConversationSettings;
import com.socialhub.chat.dto.*;
import com.socialhub.chat.repository.CallRepository;
import com.socialhub.chat.repository.ConversationRepository;
import com.socialhub.chat.repository.MessageRepository;
import com.socialhub.chat.repository.UserConversationSettingsRepository;
import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.notification.service.NotificationService;
import com.socialhub.post.document.Post;
import com.socialhub.post.dto.PostDto;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import com.socialhub.user.service.BlockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository      messageRepository;
    private final CallRepository         callRepository;
    private final UserRepository         userRepository;
    private final PostRepository         postRepository;
    private final BlockService           blockService;
    private final ConversationSettingsService settingsService;
    private final UserConversationSettingsRepository userConversationSettingsRepository;
    private final NotificationService    notificationService;
    private final SimpMessagingTemplate  messagingTemplate;
    private final PresenceService        presenceService;

    /** Whitelist of accepted attachment MIME types */
    private static final Set<String> ALLOWED_ATTACHMENT_TYPES = Set.of(
            "IMAGE", "VIDEO",
            "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
            "video/mp4", "video/webm", "video/quicktime",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private static final int MAX_ATTACHMENTS = 10;

    // ── Conversations ─────────────────────────────────────────────────────

    @Transactional
    public ConversationDto getOrCreateConversation(String currentUserId, String targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new ValidationException("Cannot start conversation with yourself");
        }
        if (blockService.isBlockedBidirectional(currentUserId, targetUserId)) {
            throw new ValidationException("Cannot start conversation - user is blocked");
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
                    return conversationRepository.save(c);
                });
        return toConversationDto(conv, currentUserId);
    }

    public Page<ConversationDto> getConversations(String userId, int page, int size) {
        List<String> archivedConvIds = userConversationSettingsRepository
                .findByUserIdAndIsArchived(userId, true)
                .stream().map(UserConversationSettings::getConversationId).toList();

        List<ConversationDto> all = conversationRepository
                .findByParticipantIdsContainingOrderByLastMessageAtDesc(userId, PageRequest.of(0, 1000))
                .stream()
                .filter(c -> !archivedConvIds.contains(c.getId()))
                .map(c -> toConversationDto(c, userId))
                .toList();

        int start = page * size;
        int end   = Math.min(start + size, all.size());
        return new PageImpl<>(all.subList(start, end), PageRequest.of(page, size), all.size());
    }

    // ── Messages ──────────────────────────────────────────────────────────

    /**
     * Load message history with clearedBefore filter.
     * Messages before the user's clearedBefore timestamp are excluded.
     */
    public Page<MessageDto> getMessages(String conversationId, String userId, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }

        Optional<Instant> clearedBefore = userConversationSettingsRepository
                .findByUserIdAndConversationId(userId, conversationId)
                .map(UserConversationSettings::getClearedBefore);

        Page<Message> messages = clearedBefore.isPresent()
                ? messageRepository.findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(
                        conversationId, clearedBefore.get(), PageRequest.of(page, size))
                : messageRepository.findByConversationIdOrderByCreatedAtAsc(
                        conversationId, PageRequest.of(page, size));

        return messages.map(this::mapMessageToDto);
    }

    /**
     * Sync missed messages after WebSocket reconnect.
     * Returns all messages after lastMessageId, respecting clearedBefore.
     */
    public Page<MessageDto> getMessagesAfter(String conversationId, String userId,
                                              String lastMessageId, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }

        Optional<Instant> clearedBefore = userConversationSettingsRepository
                .findByUserIdAndConversationId(userId, conversationId)
                .map(UserConversationSettings::getClearedBefore);

        List<Message> messages = clearedBefore.isPresent()
                ? messageRepository.findByConversationIdAndIdAfterAndCreatedAtAfter(
                        conversationId, lastMessageId, clearedBefore.get())
                : messageRepository.findByConversationIdAndIdAfter(conversationId, lastMessageId);

        List<MessageDto> dtos = messages.stream()
                .limit(size)
                .map(this::mapMessageToDto)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos);
    }

    /**
     * Send a message with optional multi-file attachments (max 10, whitelist validated).
     * Broadcasts message:new event to all conversation participants via WebSocket.
     */
    @Transactional
    public MessageDto sendMessage(String conversationId, String senderId, SendMessageRequest req) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(senderId)) {
            throw new ValidationException("Access denied");
        }

        String type = req.getMessageType() != null ? req.getMessageType().toUpperCase() : "TEXT";

        if ("POST".equals(type) && (req.getSharedPostId() == null || req.getSharedPostId().isBlank())) {
            throw new ValidationException("sharedPostId is required for POST messages");
        }
        if (("IMAGE".equals(type) || "VIDEO".equals(type))
                && (req.getMediaUrl() == null || req.getMediaUrl().isBlank())) {
            throw new ValidationException("mediaUrl is required for IMAGE/VIDEO messages");
        }
        boolean hasAttachments = req.getAttachments() != null && !req.getAttachments().isEmpty();
        if ("TEXT".equals(type) && (req.getContent() == null || req.getContent().isBlank())
                && !hasAttachments) {
            throw new ValidationException("content is required for TEXT messages without attachments");
        }

        // Validate and map attachments
        List<Message.AttachmentItem> attachmentItems = new ArrayList<>();
        if (hasAttachments) {
            if (req.getAttachments().size() > MAX_ATTACHMENTS) {
                throw new ValidationException("Toi da " + MAX_ATTACHMENTS + " file dinh kem");
            }
            for (SendMessageRequest.AttachmentDto a : req.getAttachments()) {
                validateAttachmentType(a.getType());
                attachmentItems.add(Message.AttachmentItem.builder()
                        .id(a.getId()).type(a.getType()).url(a.getUrl())
                        .fileName(a.getFileName()).fileSize(a.getFileSize())
                        .thumbnailUrl(a.getThumbnailUrl()).build());
            }
        }

        Message msg = Message.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .content(req.getContent())
                .messageType(type)
                .mediaUrl(req.getMediaUrl())
                .sharedPostId(req.getSharedPostId())
                .attachments(attachmentItems)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        msg = messageRepository.save(msg);

        conv.setLastMessage(buildPreview(msg));
        conv.setLastMessageAt(msg.getCreatedAt());
        conversationRepository.save(conv);

        MessageDto dto = mapMessageToDto(msg);

        // Broadcast message:new to all other participants
        broadcastToConversation(conv, senderId,
                WebSocketMessageEvent.builder()
                        .type(WebSocketMessageEvent.EventType.MESSAGE_NEW.getValue())
                        .conversationId(conversationId)
                        .message(dto)
                        .timestamp(Instant.now())
                        .build());

        // Also notify each participant via personal notification topic
        for (String memberId : conv.getParticipantIds()) {
            notificationService.notifyNewMessage(memberId, conversationId, dto);
        }

        log.info("Message {} sent in conversation {}", msg.getId(), conversationId);
        return dto;
    }

    /**
     * Mark messages as read, store readBy{userId: timestamp}, broadcast message:read.
     */
    @Transactional
    public void markMessagesRead(String conversationId, String userId) {
        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        List<Message> unread = messageRepository.findUnreadMessagesInConversation(conversationId, userId);
        if (unread.isEmpty()) return;

        Instant now = Instant.now();
        for (Message m : unread) {
            m.setRead(true);
            if (m.getReadBy() == null) m.setReadBy(new HashMap<>());
            m.getReadBy().put(userId, now);
            messageRepository.save(m);
        }

        // Broadcast read receipt to other participants
        Conversation conv = conversationRepository.findById(conversationId).orElseThrow();
        broadcastToConversation(conv, userId,
                WebSocketMessageEvent.builder()
                        .type(WebSocketMessageEvent.EventType.MESSAGE_READ.getValue())
                        .conversationId(conversationId)
                        .data(Map.of("userId", userId,
                                     "readAt", now.toString(),
                                     "messageCount", unread.size()))
                        .timestamp(now)
                        .build());

        // Reset unread counter in settings
        userConversationSettingsRepository
                .findByUserIdAndConversationId(userId, conversationId)
                .ifPresent(s -> {
                    s.setUnreadCount(0);
                    s.setLastReadAt(now);
                    s.setUpdatedAt(now);
                    userConversationSettingsRepository.save(s);
                });

        log.info("Marked {} msgs read in conv {} by {}", unread.size(), conversationId, userId);
    }

    @Transactional
    public MessageDto editMessage(String messageId, String userId, EditMessageRequest req) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!msg.getSenderId().equals(userId)) {
            throw new ValidationException("Chi co the sua tin nhan cua chinh minh");
        }
        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new ValidationException("Noi dung tin nhan khong duoc de trong");
        }
        msg.setContent(req.getContent().trim());
        msg.setEditedAt(Instant.now());
        messageRepository.save(msg);
        log.info("Message {} edited", messageId);
        return toMessageDto(msg);
    }

    @Transactional
    public void deleteMessage(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!msg.getSenderId().equals(userId)) {
            throw new ValidationException("Chi co the xoa tin nhan cua chinh minh");
        }
        messageRepository.deleteById(messageId);
        log.info("Message {} deleted", messageId);
    }

    public Page<MessageDto> searchMessages(String conversationId, String userId,
                                            String query, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }
        return messageRepository
                .findByConversationIdAndContentContainingIgnoreCaseOrderByCreatedAtDesc(
                        conversationId, query, PageRequest.of(page, size))
                .map(this::toMessageDto);
    }

    // ── Reactions ─────────────────────────────────────────────────────────

    @Transactional
    public MessageDto addReaction(String messageId, String userId, AddReactionRequest req) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (msg.getReactions() == null) msg.setReactions(new HashMap<>());
        msg.getReactions().put(userId, req.getReaction());
        messageRepository.save(msg);

        MessageDto dto = mapMessageToDto(msg);
        broadcastReactionEvent(msg.getConversationId(), messageId, userId, dto);
        log.info("Reaction added to message {} by {}", messageId, userId);
        return dto;
    }

    /**
     * Remove current user's reaction from a message.
     * Broadcasts message:reaction event so all participants update their UI.
     */
    @Transactional
    public MessageDto removeReaction(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (msg.getReactions() != null && msg.getReactions().containsKey(userId)) {
            msg.getReactions().remove(userId);
            messageRepository.save(msg);
        }
        MessageDto dto = mapMessageToDto(msg);
        broadcastReactionEvent(msg.getConversationId(), messageId, userId, dto);
        log.info("Reaction removed from message {} by {}", messageId, userId);
        return dto;
    }

    // ── Group management ──────────────────────────────────────────────────

    public ConversationDto createGroupConversation(String currentUserId, CreateGroupChatRequest req) {
        validateGroupRequest(req);
        List<String> participantIds = buildParticipantList(currentUserId, req.getMemberIds());
        Conversation conv = Conversation.builder()
                .participantIds(participantIds)
                .adminIds(new ArrayList<>(List.of(currentUserId)))
                .isGroup(true)
                .groupName(req.getGroupName().trim())
                .groupAvatarUrl(req.getGroupAvatarUrl())
                .createdAt(Instant.now())
                .build();
        return toConversationDto(conversationRepository.save(conv), currentUserId);
    }

    @Transactional
    public ConversationDto createGroupChat(String currentUserId, CreateGroupChatRequest req) {
        return createGroupConversation(currentUserId, req);
    }

    @Transactional
    public ConversationDto updateGroupChat(String conversationId, String userId, UpdateGroupRequest req) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.isGroup()) throw new ValidationException("Chi co the cap nhat nhom chat");
        if (!conv.getAdminIds().contains(userId))
            throw new ValidationException("Chi admin moi co the cap nhat nhom");

        if (req.getGroupName() != null && !req.getGroupName().trim().isEmpty())
            conv.setGroupName(req.getGroupName().trim());
        if (req.getGroupAvatarUrl() != null)
            conv.setGroupAvatarUrl(req.getGroupAvatarUrl());

        if (req.getAddMemberIds() != null) {
            for (String memberId : req.getAddMemberIds()) {
                userRepository.findById(memberId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
                if (!conv.getParticipantIds().contains(memberId))
                    conv.getParticipantIds().add(memberId);
            }
        }
        if (req.getRemoveMemberIds() != null) {
            for (String memberId : req.getRemoveMemberIds()) {
                conv.getParticipantIds().remove(memberId);
                if (conv.getRemovedMemberIds() == null) conv.setRemovedMemberIds(new ArrayList<>());
                conv.getRemovedMemberIds().add(memberId);
            }
        }
        conversationRepository.save(conv);
        return toConversationDto(conv, userId);
    }

    @Transactional
    public void leaveGroup(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.isGroup()) throw new ValidationException("Chi co the thoat nhom chat");
        if (!conv.getParticipantIds().contains(userId))
            throw new ValidationException("Ban khong phai thanh vien nhom");
        conv.getParticipantIds().remove(userId);
        if (conv.getAdminIds() != null) conv.getAdminIds().remove(userId);
        conversationRepository.save(conv);
    }

    /**
     * Per-user soft delete: records clearedBefore timestamp.
     * Does NOT delete any physical data — the other participant still sees full history.
     */
    @Transactional
    public void deleteConversation(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }

        Instant now = Instant.now();
        UserConversationSettings settings = userConversationSettingsRepository
                .findByUserIdAndConversationId(userId, conversationId)
                .orElse(UserConversationSettings.builder()
                        .userId(userId).conversationId(conversationId).createdAt(now).build());

        settings.setClearedBefore(now);
        settings.setUpdatedAt(now);
        userConversationSettingsRepository.save(settings);

        log.info("User {} cleared conversation {} (clearedBefore={})", userId, conversationId, now);
    }

    @Transactional
    public MessageDto replyMessage(String conversationId, String userId,
                                    String replyToMessageId, ReplyMessageRequest req) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) throw new ValidationException("Access denied");

        Message originalMsg = messageRepository.findById(replyToMessageId)
                .orElseThrow(() -> new ResourceNotFoundException("Original message not found"));

        Message saved = messageRepository.save(Message.builder()
                .conversationId(conversationId).senderId(userId)
                .content(req.getContent())
                .messageType(req.getMessageType() != null ? req.getMessageType() : "TEXT")
                .mediaUrl(req.getMediaUrl())
                .fileUrl(req.getFileUrl()).fileName(req.getFileName()).fileSize(req.getFileSize())
                .replyToMessageId(replyToMessageId)
                .isRead(false).createdAt(Instant.now()).build());

        conv.setLastMessage(req.getContent());
        conv.setLastMessageAt(Instant.now());
        conversationRepository.save(conv);
        return mapMessageToDto(saved, originalMsg);
    }

    @Transactional
    public MessageDto pinMessage(String conversationId, String messageId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) throw new ValidationException("Access denied");

        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        msg.setPinned(true);
        messageRepository.save(msg);
        if (!conv.getPinnedMessageIds().contains(messageId)) {
            conv.getPinnedMessageIds().add(messageId);
            conversationRepository.save(conv);
        }
        return mapMessageToDto(msg, null);
    }

    @Transactional
    public MessageDto unpinMessage(String conversationId, String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        msg.setPinned(false);
        messageRepository.save(msg);
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.getPinnedMessageIds().remove(messageId);
            conversationRepository.save(conv);
        });
        return mapMessageToDto(msg, null);
    }

    @Transactional
    public void unsendMessage(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!msg.getSenderId().equals(userId))
            throw new ValidationException("Chi nguoi gui moi co the thu hoi tin nhan");
        msg.setDeletedForEveryone(true);
        msg.setContent("Tin nhan da duoc thu hoi");
        msg.setMediaUrl(null);
        msg.setFileUrl(null);
        messageRepository.save(msg);
    }

    @Transactional
    public void forwardMessage(String messageId, String userId, List<String> targetConversationIds) {
        Message orig = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        for (String targetId : targetConversationIds) {
            Conversation target = conversationRepository.findById(targetId).orElse(null);
            if (target == null || !target.getParticipantIds().contains(userId)) continue;
            messageRepository.save(Message.builder()
                    .conversationId(targetId).senderId(userId)
                    .content(orig.getContent()).messageType(orig.getMessageType())
                    .mediaUrl(orig.getMediaUrl())
                    .fileUrl(orig.getFileUrl()).fileName(orig.getFileName()).fileSize(orig.getFileSize())
                    .isRead(false).createdAt(Instant.now()).build());
            target.setLastMessage(orig.getContent());
            target.setLastMessageAt(Instant.now());
            conversationRepository.save(target);
        }
    }

    @Transactional
    public void setTyping(String conversationId, String userId, boolean isTyping) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (isTyping) {
            if (!conv.getTypingUserIds().contains(userId)) conv.getTypingUserIds().add(userId);
        } else {
            conv.getTypingUserIds().remove(userId);
        }
        conversationRepository.save(conv);
    }

    @Transactional
    public ConversationDto promoteMember(String conversationId, String adminId, String memberId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.isGroup()) throw new ValidationException("Chi ap dung cho nhom chat");
        if (!conv.getAdminIds().contains(adminId))
            throw new ValidationException("Chi admin moi co the thang cap thanh vien");
        if (!conv.getAdminIds().contains(memberId)) conv.getAdminIds().add(memberId);
        conversationRepository.save(conv);
        return toConversationDto(conv, adminId);
    }

    @Transactional
    public ConversationDto demoteMember(String conversationId, String adminId, String memberId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.isGroup()) throw new ValidationException("Chi ap dung cho nhom chat");
        if (!conv.getAdminIds().contains(adminId))
            throw new ValidationException("Chi admin moi co the go quyen thanh vien");
        conv.getAdminIds().remove(memberId);
        conversationRepository.save(conv);
        return toConversationDto(conv, adminId);
    }

    // ── Call management ───────────────────────────────────────────────────

    @Transactional
    public CallDto initiateCall(String conversationId, String callerId, String calleeId, String callType) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(callerId)) throw new ValidationException("Access denied");

        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("Caller not found"));
        userRepository.findById(calleeId)
                .orElseThrow(() -> new ResourceNotFoundException("Callee not found"));

        Call call = callRepository.save(Call.builder()
                .conversationId(conversationId).callerId(callerId).calleeId(calleeId)
                .status("INITIATED").callType(callType != null ? callType : "VOICE")
                .startedAt(Instant.now()).createdAt(Instant.now()).build());

        try {
            notificationService.notifyIncomingCall(calleeId, call.getId(), call.getCallType(),
                    callerId, caller.getDisplayName(), caller.getAvatarUrl());
        } catch (Exception e) {
            log.error("Failed to notify incoming call: {}", e.getMessage());
        }
        return toCallDto(call);
    }

    @Transactional
    public CallDto updateCallStatus(String callId, String status, String userId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found"));
        if (!call.getCallerId().equals(userId) && !call.getCalleeId().equals(userId))
            throw new ValidationException("Access denied");

        call.setStatus(status);
        if ("ACCEPTED".equals(status)) {
            call.setAnsweredAt(Instant.now());
            try { notificationService.notifyCallAccepted(call.getCallerId(), callId); }
            catch (Exception e) { log.warn("notifyCallAccepted failed: {}", e.getMessage()); }
        } else if (List.of("ENDED", "DECLINED", "MISSED").contains(status)) {
            call.setEndedAt(Instant.now());
            if (call.getAnsweredAt() != null)
                call.setDuration(call.getEndedAt().toEpochMilli() - call.getAnsweredAt().toEpochMilli());
            String other = call.getCallerId().equals(userId) ? call.getCalleeId() : call.getCallerId();
            try {
                if ("DECLINED".equals(status)) notificationService.notifyCallRejected(other, callId);
                else notificationService.notifyCallEnded(other, callId);
            } catch (Exception e) { log.warn("notifyCall* failed: {}", e.getMessage()); }
        }
        callRepository.save(call);
        return toCallDto(call);
    }

    public Page<CallDto> getCallHistory(String conversationId, String userId, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (!conv.getParticipantIds().contains(userId)) throw new ValidationException("Access denied");
        return callRepository
                .findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size))
                .map(this::toCallDto);
    }

    // ── Presence ──────────────────────────────────────────────────────────

    public List<PresenceEvent> getPresenceStatus(List<String> userIds) {
        return presenceService.getPresenceStatus(userIds);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /** Validate attachment type against whitelist */
    private void validateAttachmentType(String type) {
        if (type == null || type.isBlank())
            throw new ValidationException("Attachment type khong duoc de trong");
        String lower = type.trim().toLowerCase();
        boolean ok = ALLOWED_ATTACHMENT_TYPES.stream().anyMatch(t -> t.equalsIgnoreCase(type))
                || lower.startsWith("image/")
                || lower.startsWith("video/");
        if (!ok) throw new ValidationException("Loai file khong duoc ho tro: " + type);
    }

    /**
     * Broadcast a WebSocket event to all conversation participants except skipSenderId.
     * Channel: /user/{participantId}/queue/messages
     */
    private void broadcastToConversation(Conversation conv, String skipSenderId,
                                          WebSocketMessageEvent event) {
        for (String pid : conv.getParticipantIds()) {
            if (pid.equals(skipSenderId)) continue;
            try {
                messagingTemplate.convertAndSendToUser(pid, "/queue/messages", event);
            } catch (Exception e) {
                log.warn("WS broadcast failed for user {}: {}", pid, e.getMessage());
            }
        }
    }

    private void broadcastReactionEvent(String conversationId, String messageId,
                                         String skipUserId, MessageDto dto) {
        conversationRepository.findById(conversationId).ifPresent(conv ->
                broadcastToConversation(conv, skipUserId,
                        WebSocketMessageEvent.builder()
                                .type(WebSocketMessageEvent.EventType.MESSAGE_REACTION.getValue())
                                .conversationId(conversationId)
                                .messageId(messageId)
                                .message(dto)
                                .timestamp(Instant.now())
                                .build()));
    }

    private void validateGroupRequest(CreateGroupChatRequest req) {
        if (req.getGroupName() == null || req.getGroupName().trim().isEmpty())
            throw new ValidationException("Ten nhom khong duoc de trong");
        int memberCount = req.getMemberIds() != null ? req.getMemberIds().size() : 0;
        if (memberCount < 1) throw new ValidationException("Nhom phai co it nhat 1 thanh vien");
        if (memberCount > 100) throw new ValidationException("Nhom khong duoc qua 100 thanh vien");
        for (String memberId : req.getMemberIds()) {
            userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
        }
    }

    private List<String> buildParticipantList(String creatorId, List<String> memberIds) {
        List<String> ids = new ArrayList<>(memberIds != null ? memberIds : Collections.emptyList());
        if (!ids.contains(creatorId)) ids.add(0, creatorId);
        return ids;
    }

    private ConversationDto toConversationDto(Conversation c, String currentUserId) {
        List<ConversationDto.ParticipantDto> participants = c.getParticipantIds().stream()
                .map(uid -> userRepository.findById(uid)
                        .map(u -> ConversationDto.ParticipantDto.builder()
                                .userId(u.getId()).username(u.getUsername())
                                .displayName(u.getDisplayName()).avatarUrl(u.getAvatarUrl())
                                .build())
                        .orElse(ConversationDto.ParticipantDto.builder().userId(uid).build()))
                .toList();

        long unread = messageRepository
                .countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), currentUserId);

        return ConversationDto.builder()
                .id(c.getId()).participants(participants)
                .lastMessage(c.getLastMessage()).lastMessageAt(c.getLastMessageAt())
                .createdAt(c.getCreatedAt()).unreadCount(unread)
                .isGroup(c.isGroup()).groupName(c.getGroupName())
                .groupAvatarUrl(c.getGroupAvatarUrl()).adminIds(c.getAdminIds())
                .build();
    }

    /** Simple mapper — used for basic message responses (no reply context) */
    private MessageDto toMessageDto(Message m) {
        MessageDto.MessageDtoBuilder b = MessageDto.builder()
                .id(m.getId()).conversationId(m.getConversationId())
                .senderId(m.getSenderId()).content(m.getContent())
                .messageType(m.getMessageType()).mediaUrl(m.getMediaUrl())
                .sharedPostId(m.getSharedPostId()).isRead(m.isRead())
                .createdAt(m.getCreatedAt()).editedAt(m.getEditedAt())
                .reactions(m.getReactions()).readBy(m.getReadBy())
                .voiceUrl(m.getVoiceUrl()).voiceDuration(m.getVoiceDuration())
                .attachments(mapAttachments(m));

        userRepository.findById(m.getSenderId()).ifPresent(u -> {
            b.senderUsername(u.getUsername());
            b.senderDisplayName(u.getDisplayName());
            b.senderAvatarUrl(u.getAvatarUrl());
        });

        if ("POST".equals(m.getMessageType()) && m.getSharedPostId() != null) {
            postRepository.findById(m.getSharedPostId()).ifPresent(post ->
                b.sharedPost(buildPostDto(post, userRepository.findById(post.getAuthorId()).orElse(null))));
        }
        return b.build();
    }

    /** Full mapper — used for reply messages and all new code */
    private MessageDto mapMessageToDto(Message msg, Message replyToMsg) {
        if (msg == null) return null;
        User sender = userRepository.findById(msg.getSenderId()).orElse(null);

        MessageDto.MessageDtoBuilder builder = MessageDto.builder()
                .id(msg.getId()).conversationId(msg.getConversationId())
                .senderId(msg.getSenderId())
                .senderUsername(sender != null ? sender.getUsername() : null)
                .senderDisplayName(sender != null ? sender.getDisplayName() : null)
                .senderAvatarUrl(sender != null ? sender.getAvatarUrl() : null)
                .content(msg.getContent()).messageType(msg.getMessageType())
                .mediaUrl(msg.getMediaUrl()).isRead(msg.isRead())
                .createdAt(msg.getCreatedAt()).editedAt(msg.getEditedAt())
                .reactions(msg.getReactions()).readBy(msg.getReadBy())
                .voiceUrl(msg.getVoiceUrl()).voiceDuration(msg.getVoiceDuration())
                .replyToMessageId(msg.getReplyToMessageId())
                .isPinned(msg.isPinned()).isDeletedForEveryone(msg.isDeletedForEveryone())
                .fileUrl(msg.getFileUrl()).fileName(msg.getFileName()).fileSize(msg.getFileSize())
                .attachments(mapAttachments(msg))
                .linkPreviewUrl(msg.getLinkPreviewUrl()).linkPreviewTitle(msg.getLinkPreviewTitle())
                .linkPreviewDescription(msg.getLinkPreviewDescription())
                .linkPreviewImage(msg.getLinkPreviewImage());

        if (replyToMsg != null) {
            User rSender = userRepository.findById(replyToMsg.getSenderId()).orElse(null);
            builder.replyToMessage(MessageDto.builder()
                    .id(replyToMsg.getId()).content(replyToMsg.getContent())
                    .messageType(replyToMsg.getMessageType()).senderId(replyToMsg.getSenderId())
                    .senderDisplayName(rSender != null ? rSender.getDisplayName() : null)
                    .build());
        }
        return builder.build();
    }

    /** Convenience overload — no reply context */
    private MessageDto mapMessageToDto(Message msg) {
        return mapMessageToDto(msg, null);
    }

    /** Map Message.AttachmentItem list to MessageDto.AttachmentItem list */
    private List<MessageDto.AttachmentItem> mapAttachments(Message m) {
        if (m.getAttachments() == null || m.getAttachments().isEmpty()) return null;
        return m.getAttachments().stream()
                .map(a -> MessageDto.AttachmentItem.builder()
                        .id(a.getId()).type(a.getType()).url(a.getUrl())
                        .fileName(a.getFileName()).fileSize(a.getFileSize())
                        .thumbnailUrl(a.getThumbnailUrl()).build())
                .collect(Collectors.toList());
    }

    private PostDto buildPostDto(Post post, User author) {
        PostDto.PostDtoBuilder pb = PostDto.builder()
                .id(post.getId()).authorId(post.getAuthorId())
                .content(post.getContent()).likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount()).createdAt(post.getCreatedAt());
        if (author != null) {
            pb.authorUsername(author.getUsername())
              .authorDisplayName(author.getDisplayName())
              .authorAvatarUrl(author.getAvatarUrl());
        }
        return pb.build();
    }

    private String buildPreview(Message m) {
        if (m.getAttachments() != null && !m.getAttachments().isEmpty()) {
            return "📎 " + m.getAttachments().size() + " file dinh kem";
        }
        return switch (m.getMessageType()) {
            case "IMAGE" -> "📷 Hinh anh";
            case "VIDEO" -> "🎬 Video";
            case "POST"  -> "📄 Da chia se bai viet";
            default -> m.getContent() != null && m.getContent().length() > 60
                    ? m.getContent().substring(0, 60) + "…"
                    : m.getContent();
        };
    }

    private CallDto toCallDto(Call call) {
        CallDto.CallDtoBuilder b = CallDto.builder()
                .id(call.getId()).conversationId(call.getConversationId())
                .callerId(call.getCallerId()).calleeId(call.getCalleeId())
                .status(call.getStatus()).callType(call.getCallType())
                .startedAt(call.getStartedAt()).answeredAt(call.getAnsweredAt())
                .endedAt(call.getEndedAt()).duration(call.getDuration())
                .createdAt(call.getCreatedAt());
        userRepository.findById(call.getCallerId()).ifPresent(u ->
                b.callerUsername(u.getUsername()).callerDisplayName(u.getDisplayName())
                 .callerAvatarUrl(u.getAvatarUrl()));
        userRepository.findById(call.getCalleeId()).ifPresent(u ->
                b.calleeUsername(u.getUsername()).calleeDisplayName(u.getDisplayName())
                 .calleeAvatarUrl(u.getAvatarUrl()));
        return b.build();
    }
}
