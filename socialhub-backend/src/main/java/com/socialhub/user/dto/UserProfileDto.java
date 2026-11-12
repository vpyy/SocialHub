package com.socialhub.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Public User Profile DTO — contains profile details, stats, follow status, and recent posts.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileDto {

    private String id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String coverUrl;
    private String bio;
    private String role;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    // Follow and activity counts
    private long followersCount;
    private long followingCount;
    private long postsCount;

    // Relationship with currently authenticated user
    private Boolean isFollowing;
    private Boolean isSelf;

    // Recent posts for user profile tab
    @Builder.Default
    private List<Object> posts = new ArrayList<>();

    @JsonProperty("avatar")
    public String getAvatar() {
        return avatarUrl;
    }

    @JsonProperty("cover")
    public String getCover() {
        return coverUrl;
    }
}
