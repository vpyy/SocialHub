package com.socialhub.auth.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * verification_tokens collection
 * 
 * Token types:
 * - EMAIL_VERIFY: 24 hours
 * - PASSWORD_RESET: 30 minutes
 * 
 * Token is used once and marked with usedAt
 */
@Document(collection = "verification_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationToken {

    @Id
    private String id;

    private String userId;                // Reference to User._id
    
    private TokenType type;               // EMAIL_VERIFY or PASSWORD_RESET
    
    private String tokenHash;             // SHA-256 hash of random token
    
    private Instant createdAt;
    
    @Indexed(expireAfterSeconds = 86400) // 24 hours TTL
    private Instant expiresAt;
    
    private Instant usedAt;               // When token was consumed
    
    private Boolean used;                 // false by default, set to true when consumed

    public enum TokenType {
        EMAIL_VERIFY,
        PASSWORD_RESET
    }
}
