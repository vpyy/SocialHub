package com.socialhub.user.document;

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
 * nicknames collection
 *
 * Stores custom nicknames for users (e.g., in conversations)
 * userId → conversationId → targetUserId → nickname
 */
@Document(collection = "nicknames")
@CompoundIndexes({
    @CompoundIndex(name = "user_target_idx", def = "{'userId': 1, 'targetUserId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Nickname {

    @Id
    private String id;

    private String userId;              // → users._id (người đặt)
    private String targetUserId;        // → users._id (người bị đặt)
    private String nickname;            // Tên biệt danh
    private Instant createdAt;
    private Instant updatedAt;
}
