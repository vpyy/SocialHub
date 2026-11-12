package com.socialhub.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockedUserDto {
    private String id;
    private String username;
    private String displayName;
    private String avatarUrl;
    private Instant blockedAt;
}
