package com.socialhub.chat.service;

import com.socialhub.chat.document.Conversation;
import com.socialhub.chat.document.Message;
import com.socialhub.chat.dto.MessageDto;
import com.socialhub.chat.repository.ConversationRepository;
import com.socialhub.chat.repository.MessageRepository;
import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${file.upload.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    /**
     * Upload file and create message
     */
    @Transactional
    public MessageDto uploadFile(String conversationId, String userId, MultipartFile file, String caption) {
        // Validate conversation
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.getParticipantIds().contains(userId)) {
            throw new ValidationException("Access denied");
        }

        // Validate file
        if (file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        String originalFilename = file.getOriginalFilename();
        long fileSize = file.getSize();

        // Max 50MB
        if (fileSize > 50 * 1024 * 1024) {
            throw new ValidationException("File size must be less than 50MB");
        }

        // Determine message type
        String messageType = determineMessageType(originalFilename);

        // Save file
        String savedFilename = saveFile(file);
        String fileUrl = baseUrl + "/" + savedFilename;

        // Create message
        Message message = Message.builder()
                .conversationId(conversationId)
                .senderId(userId)
                .content(caption != null ? caption : originalFilename)
                .messageType(messageType)
                .fileUrl(messageType.equals("FILE") ? fileUrl : null)
                .mediaUrl(messageType.equals("IMAGE") || messageType.equals("VIDEO") ? fileUrl : null)
                .fileName(originalFilename)
                .fileSize(fileSize)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        Message saved = messageRepository.save(message);
        log.info("File uploaded and message created: messageId={}, fileUrl={}", saved.getId(), fileUrl);

        // Update conversation
        conv.setLastMessage(originalFilename);
        conv.setLastMessageAt(Instant.now());
        conversationRepository.save(conv);

        return mapToDto(saved);
    }

    /**
     * Upload group avatar
     */
    @Transactional
    public String uploadGroupAvatar(String conversationId, String userId, MultipartFile avatar) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));

        if (!conv.isGroup()) {
            throw new ValidationException("Only group conversations can have avatars");
        }

        if (!conv.getAdminIds().contains(userId)) {
            throw new ValidationException("Only admins can change group avatar");
        }

        if (avatar.isEmpty()) {
            throw new ValidationException("Avatar file is empty");
        }

        // Max 5MB for avatar
        if (avatar.getSize() > 5 * 1024 * 1024) {
            throw new ValidationException("Avatar size must be less than 5MB");
        }

        // Save avatar
        String savedFilename = saveFile(avatar);
        String avatarUrl = baseUrl + "/" + savedFilename;

        // Update conversation
        conv.setGroupAvatarUrl(avatarUrl);
        conversationRepository.save(conv);

        log.info("Group avatar uploaded: convId={}, avatarUrl={}", conversationId, avatarUrl);
        return avatarUrl;
    }

    /**
     * Save file to disk
     */
    private String saveFile(MultipartFile file) {
        try {
            // Create upload directory if not exists
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String savedFilename = UUID.randomUUID().toString() + extension;

            // Save file
            Path filePath = uploadPath.resolve(savedFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("File saved: {}", savedFilename);
            return savedFilename;

        } catch (IOException e) {
            log.error("Failed to save file", e);
            throw new ValidationException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Determine message type based on file extension
     */
    private String determineMessageType(String filename) {
        if (filename == null) return "FILE";

        String lower = filename.toLowerCase();
        
        // Images
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || 
            lower.endsWith(".png") || lower.endsWith(".gif") || 
            lower.endsWith(".webp") || lower.endsWith(".svg")) {
            return "IMAGE";
        }
        
        // Videos
        if (lower.endsWith(".mp4") || lower.endsWith(".mov") || 
            lower.endsWith(".avi") || lower.endsWith(".webm") || 
            lower.endsWith(".mkv")) {
            return "VIDEO";
        }
        
        // Default to FILE
        return "FILE";
    }

    /**
     * Map Message to MessageDto
     */
    private MessageDto mapToDto(Message msg) {
        User sender = userRepository.findById(msg.getSenderId()).orElse(null);

        return MessageDto.builder()
                .id(msg.getId())
                .conversationId(msg.getConversationId())
                .senderId(msg.getSenderId())
                .senderUsername(sender != null ? sender.getUsername() : null)
                .senderDisplayName(sender != null ? sender.getDisplayName() : null)
                .senderAvatarUrl(sender != null ? sender.getAvatarUrl() : null)
                .content(msg.getContent())
                .messageType(msg.getMessageType())
                .mediaUrl(msg.getMediaUrl())
                .fileUrl(msg.getFileUrl())
                .fileName(msg.getFileName())
                .fileSize(msg.getFileSize())
                .isRead(msg.isRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
