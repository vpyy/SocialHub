package com.socialhub.social.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FollowUserDto {
    private String id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String bio;
    private Boolean isFollowing;
    private Boolean isSelf;
    private Instant followedAt;

    @JsonProperty("avatar")
    public String getAvatar() {
        return avatarUrl;
    }
}
