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
 * follows collection
 *
 * Fields: _id, followerId, followingId, createdAt
 *
 * Indexes:
 *   followerId + followingId → UNIQUE
 *   followingId + createdAt
 *   followerId  + createdAt
 */
@Document(collection = "follows")
@CompoundIndexes({
    @CompoundIndex(name = "follower_following_idx",
            def = "{'followerId': 1, 'followingId': 1}", unique = true),
    @CompoundIndex(name = "following_created_idx",
            def = "{'followingId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "follower_created_idx",
            def = "{'followerId': 1, 'createdAt': -1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Follow {

    @Id
    private String id;

    private String followerId;    // → users._id  (người follow)
    private String followingId;   // → users._id  (người được follow)

    private Instant createdAt;
}
