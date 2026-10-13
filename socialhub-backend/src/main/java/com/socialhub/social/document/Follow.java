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
 * Follow Document for MongoDB
 * 
 * Stores follow relationship between users
 * Compound index prevents duplicate follows
 */
@Document(collection = "follows")
@CompoundIndexes({
    @CompoundIndex(name = "follower_following_idx", def = "{'followerId': 1, 'followingId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {
    
    @Id
    private String id;
    
    private String followerId;   // Reference to User._id (who follows)
    private String followingId;  // Reference to User._id (who is followed)
    
    private LocalDateTime createdAt;
    
    public Follow(String followerId, String followingId) {
        this.followerId = followerId;
        this.followingId = followingId;
        this.createdAt = LocalDateTime.now();
    }
}
