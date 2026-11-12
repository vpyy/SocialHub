package com.socialhub.social.document;

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
 * bookmarks collection
 *
 * Fields: _id, userId, postId, createdAt
 *
 * Indexes:
 *   userId + postId → UNIQUE
 *   userId + createdAt
 */
@Document(collection = "bookmarks")
@CompoundIndexes({
    @CompoundIndex(name = "user_post_unique_idx",
            def = "{'userId': 1, 'postId': 1}", unique = true),
    @CompoundIndex(name = "user_created_idx",
            def = "{'userId': 1, 'createdAt': -1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bookmark {

    @Id
    private String id;

    private String userId;   // → users._id
    private String postId;   // → posts._id

    private Instant createdAt;
}
