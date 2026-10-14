package com.socialhub.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * User DTO — returned in API responses.
 * Does NOT expose passwordHash.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {

    private String id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String coverUrl;
    private String bio;

    /** USER | ADMIN */
    private String role;

    /** ACTIVE | BLOCKED */
    private String status;

    private Instant createdAt;
    private Instant updatedAt;
}
