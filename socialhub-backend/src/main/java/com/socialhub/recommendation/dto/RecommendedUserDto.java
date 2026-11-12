package com.socialhub.recommendation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for recommended user in Discovery page
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendedUserDto {
    private String id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private boolean isFollowing;
    private int mutualFollowersCount;
    private String reason; // "mutual_followers" or "followed_by_friends"
}
