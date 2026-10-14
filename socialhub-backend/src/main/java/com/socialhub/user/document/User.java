package com.socialhub.user.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * users collection
 *
 * Fields: _id, username, email, passwordHash, displayName,
 *         avatarUrl, coverUrl, bio, role, status, createdAt, updatedAt
 *
 * Indexes:
 *   username → UNIQUE
 *   email    → UNIQUE
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

    private String passwordHash;

    private String displayName;
    private String avatarUrl;
    private String coverUrl;
    private String bio;

    /** USER | ADMIN */
    @Builder.Default
    private String role = "USER";

    /** ACTIVE | BLOCKED */
    @Builder.Default
    private String status = "ACTIVE";

    private Instant createdAt;
    private Instant updatedAt;
}
