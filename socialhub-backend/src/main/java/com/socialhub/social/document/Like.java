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
 * Like Document for MongoDB
 * 
 * Stores like relationship between users and posts
 * Compound index prevents duplicate likes
 */
@Document(collection = "likes")
@CompoundIndexes({
    @CompoundIndex(name = "post_user_idx", def = "{'postId': 1, 'userId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Like {
    
    @Id
    private String id;
    
    private String postId;  // Reference to Post._id
    private String userId;  // Reference to User._id
    
    private LocalDateTime createdAt;
    
    public Like(String postId, String userId) {
        this.postId = postId;
        this.userId = userId;
        this.createdAt = LocalDateTime.now();
    }
}
