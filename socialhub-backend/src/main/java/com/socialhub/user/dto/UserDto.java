package com.socialhub.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User DTO for API responses
 * 
 * This DTO does NOT include sensitive information like passwordHash
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "User information in API response")
public class UserDto {
    
    @Schema(description = "User unique identifier (MongoDB ObjectId)", example = "507f1f77bcf86cd799439011")
    private String id;
    
    @Schema(description = "Unique username", example = "minh_dev")
    private String username;
    
    @Schema(description = "User email address", example = "minh@example.com")
    private String email;
    
    @Schema(description = "Display name", example = "Nguyễn Quang Minh")
    private String displayName;
    
    @Schema(description = "User biography", example = "Full-stack developer passionate about clean code")
    private String bio;
    
    @Schema(description = "Avatar image URL", example = "https://example.com/avatars/minh.jpg")
    private String avatarUrl;
    
    @Schema(description = "Cover image URL", example = "https://example.com/covers/minh-cover.jpg")
    private String coverUrl;
    
    @Schema(description = "Account is active", example = "true")
    private boolean isActive;
    
    @Schema(description = "Account is verified", example = "false")
    private boolean isVerified;
    
    @Schema(description = "Number of followers", example = "128")
    private long followerCount;
    
    @Schema(description = "Number of users following", example = "45")
    private long followingCount;
    
    @Schema(description = "Number of posts created", example = "12")
    private long postsCount;
    
    @Schema(description = "Account creation timestamp", example = "2024-01-15T10:30:00")
    private LocalDateTime createdAt;
    
    @Schema(description = "Last profile update timestamp", example = "2024-01-20T14:30:00")
    private LocalDateTime updatedAt;
    
    @Schema(description = "Last login timestamp", example = "2024-01-21T09:15:00")
    private LocalDateTime lastLoginAt;
}
