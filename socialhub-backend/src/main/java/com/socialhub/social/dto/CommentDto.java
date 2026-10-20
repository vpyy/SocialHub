package com.socialhub.social.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO for Comment response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CommentDto {
    
    private String id;
    private String postId;
    private String authorId;
    private String authorUsername;
    private String authorDisplayName;
    private String authorAvatarUrl;
    
    private String content;
    private String parentCommentId;
    
    private long likeCount;
    private long replyCount;
    
    private boolean likedByCurrentUser;
    
    private Instant createdAt;
    private Instant updatedAt;
    
    // Nested replies for frontend convenience
    private List<CommentDto> replies;
}
