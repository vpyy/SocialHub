package com.socialhub.social.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * comments collection
 * 
 * Stores comments and replies on posts
 * parentCommentId = null → top-level comment
 * parentCommentId != null → reply to comment
 */
@Document(collection = "comments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    private String id;

    @Indexed
    private String postId;              // → posts._id
    
    @Indexed
    private String authorId;            // → users._id
    
    private String content;
    
    @Indexed
    private String parentCommentId;     // null = top-level, or parent comment ID for replies
    
    @Builder.Default
    private long likeCount = 0;
    
    @Builder.Default
    private long replyCount = 0;
    
    private Instant createdAt;
    private Instant updatedAt;
}
