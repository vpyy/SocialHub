package com.socialhub.social.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Bookmark Document for MongoDB
 * 
 * Stores bookmarked posts for users
 * Compound index prevents duplicate bookmarks
 */
@Document(collection = "bookmarks")
@CompoundIndexes({
    @CompoundIndex(name = "user_post_idx", def = "{'userId': 1, 'postId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bookmark {
    
    @Id
    private String id;
    
    private String userId;  // Reference to User._id
    private String postId;  // Reference to Post._id
    
    private LocalDateTime createdAt;
    
    public Bookmark(String userId, String postId) {
        this.userId = userId;
        this.postId = postId;
        this.createdAt = LocalDateTime.now();
    }
}
