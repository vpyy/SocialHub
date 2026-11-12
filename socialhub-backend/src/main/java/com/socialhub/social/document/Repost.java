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
 * reposts collection
 *
 * Compound index ensures one repost per user per post.
 */
@Document(collection = "reposts")
@CompoundIndexes({
    @CompoundIndex(name = "user_post_repost_idx", def = "{'userId': 1, 'postId': 1}", unique = true)
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Repost {

    @Id
    private String id;

    private String userId;      // → users._id
    private String postId;      // → posts._id
    
    private Instant createdAt;
}
