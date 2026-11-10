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
 * refresh_tokens collection
 *
 * One document = one session
 * _id is also the sessionId (used in JWT claim "sid")
 */
@Document(collection = "refresh_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    private String id;                    // = sessionId

    private String userId;                // Reference to User._id

    private String tokenHash;             // SHA-256 of current refresh token
    private String previousTokenHash;     // SHA-256 of previous token (for reuse detection)

    private String browser;               // Chrome, Safari, Firefox, etc.
    private String os;                    // Windows, macOS, Linux, iOS, Android
    private String userAgent;             // Full User-Agent header
    private String ip;                    // Client IP address

    private Instant createdAt;
    private Instant lastUsedAt;           // Updated on each refresh

    @Indexed(expireAfterSeconds = 604800) // 7 days TTL
    private Instant expiresAt;

    @Builder.Default
    private Boolean revoked = false;      // Set to true on logout/password change
}
