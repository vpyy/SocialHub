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
 * likes collection
 * 
 * Stores user likes on posts
 * Compound index ensures one like per user per post
 */
@Document(collection = "likes")
// Temporarily disabled due to index conflict - MongoDB already has this index
// @CompoundIndexes({
//     @CompoundIndex(name = "user_post_idx", def = "{'userId': 1, 'postId': 1}", unique = true)
// })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Like {

    @Id
    private String id;

    private String userId;      // → users._id
    private String postId;      // → posts._id
    
    private Instant createdAt;
}
