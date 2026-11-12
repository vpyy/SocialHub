package com.socialhub.post.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.socialhub.post.document.Post;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PostResponseDto {
    private String id;
    private AuthorDto author;
    private String content;
    private List<Post.MediaItem> media;
    private String imageUrl;
    private String imageCaption;
    private List<String> hashtags;
    private String visibility;
    private long likes;
    private long comments;
    private long shares;
    private boolean isLiked;
    private boolean isReposted;
    private boolean isBookmarked;
    private Instant createdAt;
    private Instant updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuthorDto {
        private String id;
        private String username;
        private String displayName;
        private String avatarUrl;
        private boolean isVerified;
    }
}
