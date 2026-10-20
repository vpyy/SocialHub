package com.socialhub.auth.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * JWT Token Provider — uses jjwt 0.12.x API exclusively.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwtSecret:mySecretKeyForSocialHubJWTTokenGenerationAndValidation123456789}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:86400000}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // ──────────────────────────────────────────────────────
    // Generate
    // ──────────────────────────────────────────────────────

    public String generateToken(String userId, String username) {
        Date now      = new Date();
        Date expiry   = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(userId)                   // 0.12.x: subject() not setSubject()
                .claim("username", username)
                .issuedAt(now)                     // 0.12.x: issuedAt() not setIssuedAt()
                .expiration(expiry)                // 0.12.x: expiration() not setExpiration()
                .signWith(getSigningKey())         // 0.12.x: key only, algorithm inferred
                .compact();
    }

    // ──────────────────────────────────────────────────────
    // Read claims
    // ──────────────────────────────────────────────────────

    public String getUserIdFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public String getUsernameFromToken(String token) {
        return parseClaims(token).get("username", String.class);
    }

    // ──────────────────────────────────────────────────────
    // Validate
    // ──────────────────────────────────────────────────────

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    // ──────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }
}
