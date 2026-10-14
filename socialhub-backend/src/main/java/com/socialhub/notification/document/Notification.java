package com.socialhub.notification.document;

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
 * notifications collection
 *
 * Fields: _id, recipientId, actorId, type,
 *         postId, commentId, isRead, createdAt
 *
 * type values: LIKE | COMMENT | FOLLOW | MENTION | MESSAGE
 *
 * Indexes:
 *   recipientId + createdAt
 */
@Document(collection = "notifications")
@CompoundIndexes({
    @CompoundIndex(name = "recipient_created_idx",
            def = "{'recipientId': 1, 'createdAt': -1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    private String id;

    private String recipientId;   // → users._id (người nhận)
    private String actorId;       // → users._id (người thực hiện)

    /** LIKE | COMMENT | FOLLOW | MENTION | MESSAGE */
    private String type;

    private String postId;        // → posts._id    (nullable)
    private String commentId;     // → comments._id (nullable)

    @Builder.Default
    private boolean isRead = false;

    private Instant createdAt;
}
