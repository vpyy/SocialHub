package com.socialhub.user.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * User Document for MongoDB
 * 
 * Stores user profile information for the SocialHub platform
 * Indexes:
 * - username: unique, case-insensitive
 * - email: unique, case-insensitive
 */
@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String username;
    
    @Indexed(unique = true)
    private String email;
    
    // Password stored as hash (BCrypt)
    private String passwordHash;
    
    // Profile Information
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String coverUrl;
    
    // Account Status
    private boolean isActive;
    private boolean isVerified;
    
    // Statistics
    private long followerCount;
    private long followingCount;
    private long postsCount;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    
    // Transient field for security (not stored in DB)
    @Transient
    private transient String password;
    
    /**
     * Normalize email and username for case-insensitive uniqueness
     */
    public void normalizeData() {
        if (this.email != null) {
            this.email = this.email.toLowerCase().trim();
        }
        if (this.username != null) {
            this.username = this.username.toLowerCase().trim();
        }
    }
    
    /**
     * Pre-persist initialization
     */
    public void prePersist() {
        normalizeData();
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.followerCount == 0) {
            this.followerCount = 0;
        }
        if (this.followingCount == 0) {
            this.followingCount = 0;
        }
        if (this.postsCount == 0) {
            this.postsCount = 0;
        }
        this.isActive = true;
        this.isVerified = false;
    }
}
