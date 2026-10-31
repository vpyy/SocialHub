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
 * Stores user block relationships: userId blocked blockedUserId
 */
@Document(collection = "blocks")
@CompoundIndexes({
    @CompoundIndex(name = "user_blocked_idx", def = "{'userId': 1, 'blockedUserId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Block {

    @Id
    private String id;

    @Indexed
    private String userId;              // → users._id (người block)

    @Indexed
    private String blockedUserId;       // → users._id (người bị block)

    private Instant createdAt;
}
