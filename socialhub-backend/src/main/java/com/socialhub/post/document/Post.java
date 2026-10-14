package com.socialhub.post.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * posts collection
 *
 * Fields: _id, authorId, content, media[], hashtags[],
 *         visibility, likeCount, commentCount, shareCount,
 *         createdAt, updatedAt
 *
 * Indexes:
 *   authorId + createdAt (compound)
 *   createdAt
 *   hashtags
 */
@Document(collection = "posts")
@CompoundIndexes({
    @CompoundIndex(name = "author_created_idx", def = "{'authorId': 1, 'createdAt': -1}")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    private String id;

    @Indexed
    private String authorId;   // → users._id

    private String content;

    /** Embedded media documents [{type, url}] */
    @Builder.Default
    private List<MediaItem> media = new ArrayList<>();

    @Builder.Default
    private List<String> hashtags = new ArrayList<>();

    /** PUBLIC | FOLLOWERS | PRIVATE */
    @Builder.Default
    private String visibility = "PUBLIC";

    @Builder.Default
    private long likeCount = 0;

    @Builder.Default
    private long commentCount = 0;

    @Builder.Default
    private long shareCount = 0;

    @Indexed
    private Instant createdAt;
    private Instant updatedAt;

    // ──────────────────────────────────────────────────────
    // Embedded document: media item
    // ──────────────────────────────────────────────────────
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaItem {
        /** IMAGE | VIDEO */
        private String type;
        private String url;
    }
}
