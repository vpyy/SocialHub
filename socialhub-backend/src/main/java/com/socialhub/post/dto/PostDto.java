package com.socialhub.post.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * Response DTO for Post entity
 * Used to transfer post data to frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PostDto {

    private String id;
    private String authorId;
    private String authorUsername;
    private String authorDisplayName;
    private String authorAvatarUrl;
    
    private String content;
    private List<MediaItemDto> media;
    private List<String> hashtags;
    private String visibility;
    
    private long likeCount;
    private long commentCount;
    private long shareCount;
    
    private boolean likedByCurrentUser;
    
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaItemDto {
        private String type;  // IMAGE or VIDEO
        private String url;
    }
}
