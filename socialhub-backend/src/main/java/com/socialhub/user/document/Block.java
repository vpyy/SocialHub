package com.socialhub.user.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * blocks collection
 * 
 * Stores user blocking relationships.
 * When user A blocks user B:
 * - A cannot see B's posts/stories/messages
 * - B cannot send messages to A
 * - Both cannot start new conversations
 * 
 * Composite index on blockerId + blockedId for fast lookups
 */
@Document(collection = "blocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@CompoundIndexes({
    @CompoundIndex(name = "blocker_blocked_idx", def = "{'blockerId': 1, 'blockedId': 1}", unique = true)
})
public class Block {

    @Id
    private String id;

    /** User who initiated the block */
    @Indexed
    private String blockerId;

    /** User who is being blocked */
    @Indexed
    private String blockedId;

    /** When the block was created */
    private Instant createdAt;
}
