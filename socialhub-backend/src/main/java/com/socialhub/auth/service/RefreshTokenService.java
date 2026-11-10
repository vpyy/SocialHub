package com.socialhub.auth.service;

import com.socialhub.auth.model.RefreshToken;
import com.socialhub.auth.repository.RefreshTokenRepository;
import com.socialhub.auth.util.DeviceInfoExtractor;
import com.socialhub.common.exception.TokenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Create new refresh token session
     * Returns: { refreshToken, sessionId }
     */
    public Map<String, Object> createRefreshToken(
            String userId,
            DeviceInfoExtractor.DeviceInfo deviceInfo,
            String ip) {

        String refreshToken = generateSecureRandomToken();
        String tokenHash = sha256(refreshToken);

        RefreshToken doc = RefreshToken.builder()
                .userId(userId)
                .tokenHash(tokenHash)
                .browser(deviceInfo.getBrowser())
                .os(deviceInfo.getOs())
                .userAgent(deviceInfo.getUserAgent())
                .ip(ip != null ? ip : "Unknown")
                .createdAt(Instant.now())
                .lastUsedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(604800)) // 7 days
                .revoked(false)
                .build();

        RefreshToken saved = refreshTokenRepository.save(doc);

        Map<String, Object> result = new HashMap<>();
        result.put("refreshToken", refreshToken);
        result.put("sessionId", saved.getId());

        return result;
    }

    /**
     * Refresh access token using refresh token from cookie
     * Returns: { accessToken, refreshToken, sessionId }
     * Throws: TOKEN_EXPIRED, TOKEN_REVOKED, TOKEN_REUSED
     */
    public Map<String, Object> refresh(String refreshToken) throws TokenException {

        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new TokenException("TOKEN_EXPIRED", "Refresh token not found");
        }

        String hash = sha256(refreshToken);

        // Try to find by current tokenHash
        RefreshToken doc = refreshTokenRepository.findByTokenHash(hash)
                .orElse(null);

        if (doc != null) {
            // Token found by current hash
            if (doc.getRevoked()) {
                throw new TokenException("TOKEN_REVOKED", "Session revoked");
            }

            if (doc.getExpiresAt().isBefore(Instant.now())) {
                throw new TokenException("TOKEN_EXPIRED", "Refresh token expired");
            }

            // Token is valid, rotate it
            return rotateRefreshToken(doc);
        }

        // Try to find by previousTokenHash (reuse detection)
        doc = refreshTokenRepository.findByPreviousTokenHash(hash)
                .orElse(null);

        if (doc != null && !doc.getRevoked()) {
            // Token reuse detected!
            doc.setRevoked(true);
            refreshTokenRepository.save(doc);
            log.warn("Token reuse detected for userId: {}", doc.getUserId());
            throw new TokenException("TOKEN_REUSED", "Token reuse detected");
        }

        // Token not found or expired
        throw new TokenException("TOKEN_EXPIRED", "Refresh token not found or expired");
    }

    /**
     * Rotate refresh token: generate new token, update previousTokenHash
     */
    private Map<String, Object> rotateRefreshToken(RefreshToken doc) {
        String newRefreshToken = generateSecureRandomToken();
        String newHash = sha256(newRefreshToken);

        doc.setPreviousTokenHash(doc.getTokenHash());
        doc.setTokenHash(newHash);
        doc.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(doc);

        Map<String, Object> result = new HashMap<>();
        result.put("refreshToken", newRefreshToken);
        result.put("sessionId", doc.getId());

        return result;
    }

    /**
     * Validate session exists and is not revoked
     */
    public void validateSession(String sessionId) throws TokenException {
        RefreshToken doc = refreshTokenRepository.findByIdAndRevokedFalse(sessionId)
                .orElse(null);

        if (doc == null) {
            throw new TokenException("TOKEN_REVOKED", "Session revoked or not found");
        }

        if (doc.getExpiresAt().isBefore(Instant.now())) {
            throw new TokenException("TOKEN_EXPIRED", "Session expired");
        }
    }

    /**
     * Revoke single session
     */
    public void revokeSession(String sessionId) {
        RefreshToken doc = refreshTokenRepository.findById(sessionId)
                .orElse(null);

        if (doc != null) {
            doc.setRevoked(true);
            refreshTokenRepository.save(doc);
            log.info("Session revoked: {}", sessionId);
        }
    }

    /**
     * Revoke all sessions for a user, optionally except one
     */
    public void revokeAllSessions(String userId, String exceptSessionId) {
        List<RefreshToken> docs = refreshTokenRepository.findByUserId(userId);

        for (RefreshToken doc : docs) {
            if (exceptSessionId == null || !doc.getId().equals(exceptSessionId)) {
                doc.setRevoked(true);
                refreshTokenRepository.save(doc);
            }
        }

        log.info("Revoked all sessions for userId: {}, except: {}", userId, exceptSessionId);
    }

    /**
     * Get all active sessions for user
     */
    public List<Map<String, Object>> getSessions(String userId) {
        List<RefreshToken> docs = refreshTokenRepository.findByUserIdAndRevokedFalse(userId);

        return docs.stream()
                .map(doc -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("sessionId", doc.getId());
                    map.put("browser", doc.getBrowser());
                    map.put("os", doc.getOs());
                    map.put("ip", doc.getIp());
                    map.put("createdAt", doc.getCreatedAt());
                    map.put("lastUsedAt", doc.getLastUsedAt());
                    return map;
                })
                .sorted((a, b) -> ((Instant) b.get("lastUsedAt"))
                        .compareTo((Instant) a.get("lastUsedAt")))
                .collect(Collectors.toList());
    }

    /**
     * Get refresh token by sessionId
     */
    public RefreshToken getRefreshTokenById(String sessionId) {
        return refreshTokenRepository.findById(sessionId).orElse(null);
    }

    // ──────────────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────────────

    private String generateSecureRandomToken() {
        SecureRandom sr = new SecureRandom();
        byte[] bytes = new byte[32]; // 256 bits
        sr.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
