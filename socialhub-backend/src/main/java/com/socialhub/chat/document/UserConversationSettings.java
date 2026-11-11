package com.socialhub.chat.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * user_conversation_settings collection
 * 
 * Stores per-user settings for each conversation:
 * - isPinned: User has pinned this conversation
 * - isMuted: User has muted notifications
 * - isArchived: User has archived/deleted this conversation (soft delete)
 * - unreadCount: Number of unread messages for this user
 * - lastReadAt: Last time user read messages in this conversation
 * - mutedUntil: When mute expires (null = forever)
 * 
 * Composite index on userId + conversationId for fast lookups
 */
@Document(collection = "user_conversation_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndexes({
    @CompoundIndex(name = "user_conversation_idx", def = "{'userId': 1, 'conversationId': 1}", unique = true)
})
public class UserConversationSettings {

    @Id
    private String id;

    private String userId;
    private String conversationId;

    /** Pin conversation to top */
    @Builder.Default
    private boolean isPinned = false;
    private Instant pinnedAt;

    /** Mute notifications */
    @Builder.Default
    private boolean isMuted = false;
    private Instant mutedUntil; // null = muted forever

    /** Archive/soft delete conversation (only visible to this user) */
    @Builder.Default
    private boolean isArchived = false;
    private Instant archivedAt;

    /** Unread count for this user */
    @Builder.Default
    private int unreadCount = 0;

    /** Last read timestamp */
    private Instant lastReadAt;

    /** User cleared conversation history up to this point (soft delete per user) */
    private Instant clearedBefore;

    /** When settings were created/updated */
    private Instant createdAt;
    private Instant updatedAt;
}
