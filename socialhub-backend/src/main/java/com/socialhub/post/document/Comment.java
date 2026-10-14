package com.socialhub.post.document;

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
 * comments collection
 *
 * Fields: _id, postId, authorId, content,
 *         parentCommentId, createdAt, updatedAt
 *
 * Indexes:
 *   postId + createdAt (compound)
 */
@Document(collection = "comments")
@CompoundIndexes({
    @CompoundIndex(name = "post_created_idx", def = "{'postId': 1, 'createdAt': 1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    private String id;

    private String postId;           // → posts._id
    private String authorId;         // → users._id
    private String content;

    /** null = top-level comment; non-null = reply */
    private String parentCommentId;  // → comments._id

    private Instant createdAt;
    private Instant updatedAt;
}
