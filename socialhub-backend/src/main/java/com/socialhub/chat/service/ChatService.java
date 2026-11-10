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
import com.socialhub.common.exception.ApiException;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    // ── Get or create 1-1 conversation ───────────────────────────────────

    @Transactional
    public ConversationDto getOrCreateConversation(String currentUserId, String targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new ValidationException("Cannot start conversation with yourself");
        }
        
        // Check if either user has blocked the other
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
                    Conversation saved = conversationRepository.save(c);
                    log.info("New conversation created: {}", saved.getId());
                    return saved;
                });

        return toConversationDto(conv, currentUserId);
    }

    // ── List conversations ────────────────────────────────────────────────

    public Page<ConversationDto> getConversations(String userId, int page, int size) {
        // Get archived conversation IDs for this user
        List<String> archivedConvIds = userConversationSettingsRepository
                .findByUserIdAndIsArchived(userId, true)
                .stream()
                .map(UserConversationSettings::getConversationId)
                .toList();

        // Get all conversations for user with large page size, then filter
        Page<Conversation> allConversations = conversationRepository
                .findByParticipantIdsContainingOrderByLastMessageAtDesc(
                        userId, PageRequest.of(0, 1000));

        // Filter out archived and map to DTO
        List<ConversationDto> filteredConversations = allConversations.stream()
                .filter(c -> !archivedConvIds.contains(c.getId()))
                .map(c -> toConversationDto(c, userId))
                .toList();

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, filteredConversations.size());
        List<ConversationDto> paginatedList = filteredConversations.subList(start, end);

        return new org.springframework.data.domain.PageImpl<>(paginatedList, PageRequest.of(page, size), filteredConversations.size());
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
                .isGroup(c.isGroup())
                .groupName(c.getGroupName())
                .groupAvatarUrl(c.getGroupAvatarUrl())
                .adminIds(c.getAdminIds())
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
                .createdAt(m.getCreatedAt())
                .editedAt(m.getEditedAt())
                .reactions(m.getReactions())
                .voiceUrl(m.getVoiceUrl())
                .voiceDuration(m.getVoiceDuration());

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

    // ── Create group chat ────────────────────────────────────────────────

    /** Create group conversation */
    public ConversationDto createGroupConversation(String currentUserId, CreateGroupChatRequest req) {
        if (req.getGroupName() == null || req.getGroupName().trim().isEmpty()) {
            throw new ValidationException("Tên nhóm không được để trống");
        }
        List<String> memberIds = req.getMemberIds() != null ? req.getMemberIds() : new java.util.ArrayList<>();
        if (memberIds.size() < 1) {
            throw new ValidationException("Nhóm phải có ít nhất 1 thành viên");
        }
        if (memberIds.size() > 100) {
            throw new ValidationException("Nhóm không được quá 100 thành viên");
        }

        // Validate all members exist
        for (String memberId : memberIds) {
            userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
        }

        // Create conversation with all participants including current user
        List<String> participantIds = new java.util.ArrayList<>(memberIds);
        if (!participantIds.contains(currentUserId)) {
            participantIds.add(0, currentUserId);
        }

        Conversation conv = Conversation.builder()
                .participantIds(participantIds)
                .adminIds(List.of(currentUserId))  // Creator is admin
                .isGroup(true)
                .groupName(req.getGroupName().trim())
                .groupAvatarUrl(req.getGroupAvatarUrl())
                .createdAt(Instant.now())
                .build();

        Conversation saved = conversationRepository.save(conv);
        log.info("Group chat created: {} with {} members", saved.getId(), participantIds.size());
        return toConversationDto(saved, currentUserId);
    }

    @Transactional
    public ConversationDto createGroupChat(String currentUserId, CreateGroupChatRequest req) {
        if (req.getGroupName() == null || req.getGroupName().trim().isEmpty()) {
            throw new ValidationException("Tên nhóm không được để trống");
        }
        if (req.getMemberIds() == null || req.getMemberIds().isEmpty()) {
            throw new ValidationException("Nhóm phải có ít nhất 1 thành viên");
        }
        if (req.getMemberIds().size() > 100) {
            throw new ValidationException("Nhóm không được quá 100 thành viên");
        }

        // Validate all members exist
        for (String memberId : req.getMemberIds()) {
            userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
        }

        // Create conversation with all participants
        List<String> participantIds = new java.util.ArrayList<>(req.getMemberIds());
        if (!participantIds.contains(currentUserId)) {
            participantIds.add(0, currentUserId);
        }

        Conversation conv = Conversation.builder()
                .participantIds(participantIds)
                .adminIds(List.of(currentUserId))  // Creator is admin
                .isGroup(true)
                .groupName(req.getGroupName().trim())
                .groupAvatarUrl(req.getGroupAvatarUrl())
                .createdAt(Instant.now())
                .build();

        Conversation saved = conversationRepository.save(conv);
        log.info("Group chat created: {} with {} members", saved.getId(), participantIds.size());
        return toConversationDto(saved, currentUserId);
    }

    // ── Edit message ──────────────────────────────────────────────────────

    @Transactional
    public MessageDto editMessage(String messageId, String userId, EditMessageRequest req) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!msg.getSenderId().equals(userId)) {
            throw new ValidationException("Chỉ có thể sửa tin nhắn của chính mình");
        }

        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            throw new ValidationException("Nội dung tin nhắn không được để trống");
        }

        msg.setContent(req.getContent().trim());
        msg.setEditedAt(Instant.now());
        messageRepository.save(msg);

        log.info("Message {} edited", messageId);
        return toMessageDto(msg);
    }

    // ── Delete message ────────────────────────────────────────────────────

    @Transactional
    public void deleteMessage(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!msg.getSenderId().equals(userId)) {
            throw new ValidationException("Chỉ có thể xóa tin nhắn của chính mình");
        }

        messageRepository.deleteById(messageId);
        log.info("Message {} deleted", messageId);
    }

    // ── Search messages ───────────────────────────────────────────────────

    public Page<MessageDto> searchMessages(String conversationId, String userId, String query, int page, int size) {
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

    // ── Add reaction ──────────────────────────────────────────────────────

    @Transactional
    public MessageDto addReaction(String messageId, String userId, AddReactionRequest req) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (msg.getReactions() == null) {
            msg.setReactions(new HashMap<>());
        }

        msg.getReactions().put(userId, req.getReaction());
        messageRepository.save(msg);

        log.info("Reaction added to message {} by {}", messageId, userId);
        return toMessageDto(msg);
    }

    // ── Remove reaction ───────────────────────────────────────────────────

    @Transactional
    public void removeReaction(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (msg.getReactions() != null) {
            msg.getReactions().remove(userId);
            messageRepository.save(msg);
        }

        log.info("Reaction removed from message {} by {}", messageId, userId);
    }

    // ── Update group chat ─────────────────────────────────────────────────

    @Transactional
    public ConversationDto updateGroupChat(String conversationId, String userId, UpdateGroupRequest req) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.isGroup()) {
            throw new ValidationException("Chỉ có thể cập nhật nhóm chat");
        }

        if (!conv.getAdminIds().contains(userId)) {
            throw new ValidationException("Chỉ admin mới có thể cập nhật nhóm");
        }

        // Update group name
        if (req.getGroupName() != null && !req.getGroupName().trim().isEmpty()) {
            conv.setGroupName(req.getGroupName().trim());
        }

        // Update group avatar
        if (req.getGroupAvatarUrl() != null) {
            conv.setGroupAvatarUrl(req.getGroupAvatarUrl());
        }

        // Add members
        if (req.getAddMemberIds() != null && !req.getAddMemberIds().isEmpty()) {
            for (String memberId : req.getAddMemberIds()) {
                userRepository.findById(memberId)
                        .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));

                if (!conv.getParticipantIds().contains(memberId)) {
                    conv.getParticipantIds().add(memberId);
                }
            }
        }

        // Remove members
        if (req.getRemoveMemberIds() != null && !req.getRemoveMemberIds().isEmpty()) {
            for (String memberId : req.getRemoveMemberIds()) {
                conv.getParticipantIds().remove(memberId);
                if (conv.getRemovedMemberIds() == null) {
                    conv.setRemovedMemberIds(new java.util.ArrayList<>());
                }
                conv.getRemovedMemberIds().add(memberId);
            }
        }

        conversationRepository.save(conv);
        log.info("Group chat {} updated", conversationId);
        return toConversationDto(conv, userId);
    }

    // ── Leave group ───────────────────────────────────────────────────────

    @Transactional
    public void leaveGroup(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.isGroup()) {
            throw new ValidationException("Chỉ có thể thoát nhóm chat");
        }

        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Bạn không phải thành viên của nhóm");
        }

        conv.getParticipantIds().remove(userId);
        if (conv.getAdminIds() != null) {
            conv.getAdminIds().remove(userId);
        }

        conversationRepository.save(conv);
        log.info("User {} left group {}", userId, conversationId);
    }

    /** Delete conversation (for 1-1 or group) */
    @Transactional
    public void deleteConversation(String conversationId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        // For 1-1 conversations, anyone can delete
        if (!conv.isGroup()) {
            conversationRepository.delete(conv);
            messageRepository.deleteAll(messageRepository.findByConversationId(conversationId));
            // Also delete user conversation settings for this 1-1 chat
            userConversationSettingsRepository.deleteByConversationId(conversationId);
            log.info("User {} deleted 1-1 conversation {}", userId, conversationId);
            return;
        }

        // For groups, only admin can delete
        if (conv.getAdminIds() == null || !conv.getAdminIds().contains(userId)) {
            throw new ValidationException("Chỉ admin mới có thể xóa nhóm");
        }

        // Delete all messages in group first
        messageRepository.deleteAll(messageRepository.findByConversationId(conversationId));
        // Delete all user settings for this group
        userConversationSettingsRepository.deleteByConversationId(conversationId);
        conversationRepository.delete(conv);
        log.info("Admin {} deleted group {}", userId, conversationId);
    }

    // ── Call management ───────────────────────────────────────────────────

    @Transactional
    public CallDto initiateCall(String conversationId, String callerId, String calleeId, String callType) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getParticipantIds().contains(callerId)) {
            throw new ValidationException("Access denied");
        }

        User callee = userRepository.findById(calleeId)
                .orElseThrow(() -> new ResourceNotFoundException("Callee not found"));

        User caller = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("Caller not found"));

        Call call = Call.builder()
                .conversationId(conversationId)
                .callerId(callerId)
                .calleeId(calleeId)
                .status("INITIATED")
                .callType(callType != null ? callType : "VOICE")
                .startedAt(Instant.now())
                .createdAt(Instant.now())
                .build();

        Call savedCall = callRepository.save(call);
        log.info("Call {} initiated from {} to {}", savedCall.getId(), callerId, calleeId);

        // Send WebSocket notification to callee
        try {
            notificationService.notifyIncomingCall(
                calleeId,
                savedCall.getId(),
                savedCall.getCallType(),
                callerId,
                caller.getDisplayName(),
                caller.getAvatarUrl()
            );
        } catch (Exception e) {
            log.error("Failed to send incoming call notification: {}", e.getMessage(), e);
        }

        return toCallDto(savedCall);
    }

    @Transactional
    public CallDto updateCallStatus(String callId, String status, String userId) {
        Call call = callRepository.findById(callId)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found"));

        if (!call.getCallerId().equals(userId) && !call.getCalleeId().equals(userId)) {
            throw new ValidationException("Access denied");
        }

        call.setStatus(status);

        if ("ACCEPTED".equals(status)) {
            call.setAnsweredAt(Instant.now());
            // Notify caller that call was accepted
            try {
                notificationService.notifyCallAccepted(call.getCallerId(), callId);
            } catch (Exception e) {
                log.error("Failed to send call accepted notification: {}", e.getMessage(), e);
            }
        } else if ("ENDED".equals(status) || "DECLINED".equals(status) || "MISSED".equals(status)) {
            call.setEndedAt(Instant.now());
            if (call.getAnsweredAt() != null) {
                call.setDuration(call.getEndedAt().toEpochMilli() - call.getAnsweredAt().toEpochMilli());
            }
            // Notify other party
            try {
                String otherUserId = call.getCallerId().equals(userId) ? call.getCalleeId() : call.getCallerId();
                if ("DECLINED".equals(status)) {
                    notificationService.notifyCallRejected(otherUserId, callId);
                } else {
                    notificationService.notifyCallEnded(otherUserId, callId);
                }
            } catch (Exception e) {
                log.error("Failed to send call status notification: {}", e.getMessage(), e);
            }
        }

        callRepository.save(call);
        log.info("Call {} status updated to {}", callId, status);
        return toCallDto(call);
    }

    public Page<CallDto> getCallHistory(String conversationId, String userId, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }

        return callRepository
                .findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size))
                .map(this::toCallDto);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private CallDto toCallDto(Call call) {
        CallDto.CallDtoBuilder b = CallDto.builder()
                .id(call.getId())
                .conversationId(call.getConversationId())
                .callerId(call.getCallerId())
                .calleeId(call.getCalleeId())
                .status(call.getStatus())
                .startedAt(call.getStartedAt())
                .answeredAt(call.getAnsweredAt())
                .endedAt(call.getEndedAt())
                .duration(call.getDuration())
                .callType(call.getCallType())
                .createdAt(call.getCreatedAt());

        userRepository.findById(call.getCallerId()).ifPresent(u -> {
            b.callerUsername(u.getUsername())
                    .callerDisplayName(u.getDisplayName())
                    .callerAvatarUrl(u.getAvatarUrl());
        });

        userRepository.findById(call.getCalleeId()).ifPresent(u -> {
            b.calleeUsername(u.getUsername())
                    .calleeDisplayName(u.getDisplayName())
                    .calleeAvatarUrl(u.getAvatarUrl());
        });

        return b.build();
    }


    // ── New Features ─────────────────────────────────────────────────────

    @Transactional
    public MessageDto replyMessage(String conversationId, String userId, String replyToMessageId, ReplyMessageRequest req) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }

        Message originalMsg = messageRepository.findById(replyToMessageId)
                .orElseThrow(() -> new ResourceNotFoundException("Original message not found"));

        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(userId)
                .content(req.getContent())
                .messageType(req.getMessageType() != null ? req.getMessageType() : "TEXT")
                .mediaUrl(req.getMediaUrl())
                .fileUrl(req.getFileUrl())
                .fileName(req.getFileName())
                .fileSize(req.getFileSize())
                .replyToMessageId(replyToMessageId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        Message saved = messageRepository.save(message);
        conv.setLastMessage(req.getContent());
        conv.setLastMessageAt(Instant.now());
        conversationRepository.save(conv);

        return mapMessageToDto(saved, originalMsg);
    }

    @Transactional
    public MessageDto pinMessage(String conversationId, String messageId, String userId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }

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

        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv != null) {
            conv.getPinnedMessageIds().remove(messageId);
            conversationRepository.save(conv);
        }

        return mapMessageToDto(msg, null);
    }

    @Transactional
    public void unsendMessage(String messageId, String userId) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!msg.getSenderId().equals(userId)) {
            throw new ValidationException("Chỉ người gửi mới có thể thu hồi tin nhắn");
        }

        msg.setDeletedForEveryone(true);
        msg.setContent("Tin nhắn đã được thu hồi");
        msg.setMediaUrl(null);
        msg.setFileUrl(null);
        messageRepository.save(msg);
    }

    @Transactional
    public void forwardMessage(String messageId, String userId, List<String> targetConversationIds) {
        Message originalMsg = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        for (String targetConvId : targetConversationIds) {
            Conversation targetConv = conversationRepository.findById(targetConvId).orElse(null);
            if (targetConv == null || !targetConv.getParticipantIds().contains(userId)) continue;

            Message forwarded = Message.builder()
                    .conversationId(targetConvId)
                    .senderId(userId)
                    .content(originalMsg.getContent())
                    .messageType(originalMsg.getMessageType())
                    .mediaUrl(originalMsg.getMediaUrl())
                    .fileUrl(originalMsg.getFileUrl())
                    .fileName(originalMsg.getFileName())
                    .fileSize(originalMsg.getFileSize())
                    .isRead(false)
                    .createdAt(Instant.now())
                    .build();

            messageRepository.save(forwarded);
            targetConv.setLastMessage(originalMsg.getContent());
            targetConv.setLastMessageAt(Instant.now());
            conversationRepository.save(targetConv);
        }
    }

    @Transactional
    public void setTyping(String conversationId, String userId, boolean isTyping) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (isTyping) {
            if (!conv.getTypingUserIds().contains(userId)) {
                conv.getTypingUserIds().add(userId);
            }
        } else {
            conv.getTypingUserIds().remove(userId);
        }

        conversationRepository.save(conv);
    }

    @Transactional
    public ConversationDto promoteMember(String conversationId, String adminId, String memberId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.isGroup()) {
            throw new ValidationException("Chỉ áp dụng cho nhóm chat");
        }

        if (!conv.getAdminIds().contains(adminId)) {
            throw new ValidationException("Chỉ admin mới có thể thăng cấp thành viên");
        }

        if (!conv.getAdminIds().contains(memberId)) {
            conv.getAdminIds().add(memberId);
            conversationRepository.save(conv);
        }

        return toConversationDto(conv, adminId);
    }

    @Transactional
    public ConversationDto demoteMember(String conversationId, String adminId, String memberId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.isGroup()) {
            throw new ValidationException("Chỉ áp dụng cho nhóm chat");
        }

        if (!conv.getAdminIds().contains(adminId)) {
            throw new ValidationException("Chỉ admin mới có thể gỡ quyền thành viên");
        }

        conv.getAdminIds().remove(memberId);
        conversationRepository.save(conv);

        return toConversationDto(conv, adminId);
    }

    private MessageDto mapMessageToDto(Message msg, Message replyToMsg) {
        if (msg == null) return null;
        
        User sender = userRepository.findById(msg.getSenderId()).orElse(null);

        MessageDto.MessageDtoBuilder builder = MessageDto.builder()
                .id(msg.getId())
                .conversationId(msg.getConversationId())
                .senderId(msg.getSenderId())
                .senderUsername(sender != null ? sender.getUsername() : null)
                .senderDisplayName(sender != null ? sender.getDisplayName() : null)
                .senderAvatarUrl(sender != null ? sender.getAvatarUrl() : null)
                .content(msg.getContent())
                .messageType(msg.getMessageType())
                .mediaUrl(msg.getMediaUrl())
                .isRead(msg.isRead())
                .createdAt(msg.getCreatedAt())
                .editedAt(msg.getEditedAt())
                .reactions(msg.getReactions())
                .voiceUrl(msg.getVoiceUrl())
                .voiceDuration(msg.getVoiceDuration())
                .replyToMessageId(msg.getReplyToMessageId())
                .isPinned(msg.isPinned())
                .isDeletedForEveryone(msg.isDeletedForEveryone())
                .fileUrl(msg.getFileUrl())
                .fileName(msg.getFileName())
                .fileSize(msg.getFileSize())
                .linkPreviewUrl(msg.getLinkPreviewUrl())
                .linkPreviewTitle(msg.getLinkPreviewTitle())
                .linkPreviewDescription(msg.getLinkPreviewDescription())
                .linkPreviewImage(msg.getLinkPreviewImage());

        if (replyToMsg != null) {
            User replyToSender = userRepository.findById(replyToMsg.getSenderId()).orElse(null);
            MessageDto replyDto = MessageDto.builder()
                    .id(replyToMsg.getId())
                    .content(replyToMsg.getContent())
                    .messageType(replyToMsg.getMessageType())
                    .senderId(replyToMsg.getSenderId())
                    .senderDisplayName(replyToSender != null ? replyToSender.getDisplayName() : null)
                    .build();
            builder.replyToMessage(replyDto);
        }

        return builder.build();
    }
}
