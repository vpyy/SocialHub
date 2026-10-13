package com.socialhub.post.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Comment Document for MongoDB
 * 
 * Stores comments on posts
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
    private String postId;  // Reference to Post._id
    
    @Indexed
    private String userId;  // Reference to User._id
    
    private String content;
    private long likeCount;
    
    @Indexed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private boolean isDeleted;
    
    public Comment(String postId, String userId, String content) {
        this.postId = postId;
        this.userId = userId;
        this.content = content;
        this.likeCount = 0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isDeleted = false;
    }
}
