package com.socialhub.social.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for Like response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LikeDto {
    
    private String id;
    private String userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String postId;
    private Instant createdAt;
}
