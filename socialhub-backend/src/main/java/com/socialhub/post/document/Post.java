package com.socialhub.post.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Post Document for MongoDB
 * 
 * Stores user-generated content with media and privacy settings
 */
@Document(collection = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;  // Reference to User._id
    
    private String content;
    private List<String> imageUrls;
    private String videoUrl;
    
    // Engagement metrics
    private long likeCount;
    private long commentCount;
    private long shareCount;
    
    // Privacy: PUBLIC, FOLLOWERS_ONLY, PRIVATE
    @Indexed
    private String privacy;
    
    // Metadata
    @Indexed
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // For easier querying
    @Indexed
    private boolean isDeleted;
    
    @Builder.Default
    private List<String> hashtags = new ArrayList<>();
    
    public Post(String userId, String content, String privacy) {
        this.userId = userId;
        this.content = content;
        this.privacy = privacy != null ? privacy : "PUBLIC";
        this.likeCount = 0;
        this.commentCount = 0;
        this.shareCount = 0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.isDeleted = false;
        this.imageUrls = new ArrayList<>();
    }
}
