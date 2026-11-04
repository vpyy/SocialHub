package com.socialhub.chat.service;

import com.socialhub.chat.document.UserConversationSettings;
import com.socialhub.chat.repository.ConversationRepository;
import com.socialhub.chat.repository.UserConversationSettingsRepository;
import com.socialhub.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ConversationSettingsService {

    private final UserConversationSettingsRepository settingsRepository;
    private final ConversationRepository conversationRepository;

    /**
     * Get or create settings for a user-conversation pair
     */
    public UserConversationSettings getOrCreateSettings(String userId, String conversationId) {
        // Verify conversation exists
        if (!conversationRepository.existsById(conversationId)) {
            throw new ResourceNotFoundException("Conversation not found");
        }

        return settingsRepository.findByUserIdAndConversationId(userId, conversationId)
                .orElseGet(() -> {
                    var settings = UserConversationSettings.builder()
                            .userId(userId)
                            .conversationId(conversationId)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                    return settingsRepository.save(settings);
                });
    }

    /**
     * Pin conversation to top
     */
    public UserConversationSettings pinConversation(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setPinned(true);
        settings.setPinnedAt(Instant.now());
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Unpin conversation
     */
    public UserConversationSettings unpinConversation(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setPinned(false);
        settings.setPinnedAt(null);
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Mute conversation notifications
     * @param mutedUntil ISO-8601 timestamp or null for forever
     */
    public UserConversationSettings muteConversation(String userId, String conversationId, String mutedUntil) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setMuted(true);
        if (mutedUntil != null && !mutedUntil.isEmpty()) {
            settings.setMutedUntil(Instant.parse(mutedUntil));
        } else {
            settings.setMutedUntil(null); // Muted forever
        }
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Unmute conversation notifications
     */
    public UserConversationSettings unmuteConversation(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setMuted(false);
        settings.setMutedUntil(null);
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Archive/Delete conversation (soft delete for this user only)
     */
    public UserConversationSettings archiveConversation(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setArchived(true);
        settings.setArchivedAt(Instant.now());
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Unarchive conversation
     */
    public UserConversationSettings unarchiveConversation(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setArchived(false);
        settings.setArchivedAt(null);
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Mark conversation as unread
     */
    public UserConversationSettings markAsUnread(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setUnreadCount(Math.max(1, settings.getUnreadCount())); // At least 1
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Mark conversation as read
     */
    public UserConversationSettings markAsRead(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setUnreadCount(0);
        settings.setLastReadAt(Instant.now());
        settings.setUpdatedAt(Instant.now());
        return settingsRepository.save(settings);
    }

    /**
     * Increment unread count
     */
    public void incrementUnreadCount(String userId, String conversationId) {
        var settings = getOrCreateSettings(userId, conversationId);
        settings.setUnreadCount(settings.getUnreadCount() + 1);
        settings.setUpdatedAt(Instant.now());
        settingsRepository.save(settings);
    }
}
