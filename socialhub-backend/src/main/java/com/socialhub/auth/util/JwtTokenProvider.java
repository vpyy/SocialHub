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
    
    @Value("${app.jwtSecret:dev-secret-key-change-in-production-12345678901234567890}")
    private String jwtSecret;

    @Value("${app.jwtExpirationMs:1800000}")  // 30 minutes default for access token
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // ──────────────────────────────────────────────────────
    // Generate
    // ──────────────────────────────────────────────────────

    public String generateToken(String userId, String username) {
        return generateTokenWithSession(userId, username, null);
    }

    /**
     * Generate token with session ID (for refresh token flow)
     */
    public String generateTokenWithSession(String userId, String username, String sessionId) {
        Date now      = new Date();
        Date expiry   = new Date(now.getTime() + jwtExpirationMs);

        var builder = Jwts.builder()
                .subject(userId)                   // 0.12.x: subject() not setSubject()
                .claim("username", username)
                .issuedAt(now)                     // 0.12.x: issuedAt() not setIssuedAt()
                .expiration(expiry);               // 0.12.x: expiration() not setExpiration()
        
        // Add session ID if provided
        if (sessionId != null) {
            builder.claim("sid", sessionId);
        }
        
        return builder.signWith(getSigningKey())   // 0.12.x: key only, algorithm inferred
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

    public String getSessionIdFromToken(String token) {
        return parseClaims(token).get("sid", String.class);
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
