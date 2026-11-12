package com.socialhub.auth.service;

import com.socialhub.auth.model.VerificationToken;
import com.socialhub.auth.repository.VerificationTokenRepository;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.email.service.EmailService;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

/**
 * Service for email verification and password reset token operations
 * 
 * - Generates secure random tokens
 * - Stores SHA-256 hashes in database (prevents extraction)
 * - Validates and consumes tokens (one-time use)
 * - Handles 24h verification and 30min password reset
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final int TOKEN_LENGTH_BYTES = 32; // 256-bit tokens
    private static final long EMAIL_VERIFY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
    private static final long PASSWORD_RESET_TTL_SECONDS = 30 * 60; // 30 minutes

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generate and send email verification link
     */
    public void generateAndSendVerificationEmail(String userId, String email) {
        try {
            // Revoke any previous verification token for this user
            tokenRepository.findByUserIdAndType(userId, VerificationToken.TokenType.EMAIL_VERIFY)
                    .ifPresent(token -> tokenRepository.delete(token));

            // Generate new token
            String token = generateToken();
            String tokenHash = hashToken(token);
            Instant now = Instant.now();

            VerificationToken verificationToken = VerificationToken.builder()
                    .userId(userId)
                    .type(VerificationToken.TokenType.EMAIL_VERIFY)
                    .tokenHash(tokenHash)
                    .createdAt(now)
                    .expiresAt(now.plusSeconds(EMAIL_VERIFY_TTL_SECONDS))
                    .used(false)
                    .build();

            tokenRepository.save(verificationToken);

            // Send email
            emailService.sendVerificationEmail(email, token);
            log.info("Email verification token generated and sent to {}", email);

        } catch (Exception e) {
            log.error("Failed to generate verification email: {}", e.getMessage(), e);
            throw new ValidationException("Không thể gửi email xác minh");
        }
    }

    /**
     * Generate and send password reset link
     */
    public void generateAndSendPasswordResetEmail(String userId, String email) {
        try {
            // Revoke any previous password reset token for this user
            tokenRepository.findByUserIdAndType(userId, VerificationToken.TokenType.PASSWORD_RESET)
                    .ifPresent(token -> tokenRepository.delete(token));

            // Generate new token
            String token = generateToken();
            String tokenHash = hashToken(token);
            Instant now = Instant.now();

            VerificationToken resetToken = VerificationToken.builder()
                    .userId(userId)
                    .type(VerificationToken.TokenType.PASSWORD_RESET)
                    .tokenHash(tokenHash)
                    .createdAt(now)
                    .expiresAt(now.plusSeconds(PASSWORD_RESET_TTL_SECONDS))
                    .used(false)
                    .build();

            tokenRepository.save(resetToken);

            // Send email
            emailService.sendPasswordResetEmail(email, token);
            log.info("Password reset token generated and sent to {}", email);

        } catch (Exception e) {
            log.error("Failed to generate password reset email: {}", e.getMessage(), e);
            throw new ValidationException("Không thể gửi email đặt lại mật khẩu");
        }
    }

    /**
     * Verify email token and mark user as verified
     * 
     * @throws ValidationException if token invalid, expired, or already used
     */
    public User verifyEmailToken(String token) {
        String tokenHash = hashToken(token);
        
        Optional<VerificationToken> tokenOpt = tokenRepository.findByTokenHash(tokenHash);
        
        if (tokenOpt.isEmpty()) {
            throw new ValidationException("Token xác minh không hợp lệ");
        }

        VerificationToken verifyToken = tokenOpt.get();

        // Check if already used
        if (verifyToken.getUsed() != null && verifyToken.getUsed()) {
            throw new ValidationException("Token đã được sử dụng");
        }

        // Check if expired
        if (Instant.now().isAfter(verifyToken.getExpiresAt())) {
            throw new ValidationException("Token xác minh đã hết hạn");
        }

        // Check token type
        if (verifyToken.getType() != VerificationToken.TokenType.EMAIL_VERIFY) {
            throw new ValidationException("Token không hợp lệ cho xác minh email");
        }

        // Mark as used
        verifyToken.setUsed(true);
        verifyToken.setUsedAt(Instant.now());
        tokenRepository.save(verifyToken);

        // Update user
        Optional<User> userOpt = userRepository.findById(verifyToken.getUserId());
        if (userOpt.isEmpty()) {
            throw new ValidationException("Người dùng không tồn tại");
        }

        User user = userOpt.get();
        user.setEmailVerified(true);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        log.info("Email verified for user {}", user.getId());
        return user;
    }

    /**
     * Verify password reset token and return the user
     * 
     * @throws ValidationException if token invalid, expired, or already used
     */
    public User verifyPasswordResetToken(String token) {
        String tokenHash = hashToken(token);
        
        Optional<VerificationToken> tokenOpt = tokenRepository.findByTokenHash(tokenHash);
        
        if (tokenOpt.isEmpty()) {
            throw new ValidationException("Link đặt lại mật khẩu không hợp lệ");
        }

        VerificationToken resetToken = tokenOpt.get();

        // Check if already used
        if (resetToken.getUsed() != null && resetToken.getUsed()) {
            throw new ValidationException("Link đặt lại mật khẩu đã được sử dụng");
        }

        // Check if expired
        if (Instant.now().isAfter(resetToken.getExpiresAt())) {
            throw new ValidationException("Link đặt lại mật khẩu đã hết hạn");
        }

        // Check token type
        if (resetToken.getType() != VerificationToken.TokenType.PASSWORD_RESET) {
            throw new ValidationException("Token không hợp lệ cho đặt lại mật khẩu");
        }

        // Mark as used
        resetToken.setUsed(true);
        resetToken.setUsedAt(Instant.now());
        tokenRepository.save(resetToken);

        // Return user
        Optional<User> userOpt = userRepository.findById(resetToken.getUserId());
        if (userOpt.isEmpty()) {
            throw new ValidationException("Người dùng không tồn tại");
        }

        return userOpt.get();
    }

    /**
     * Generate a cryptographically secure random token
     */
    private String generateToken() {
        byte[] randomBytes = new byte[TOKEN_LENGTH_BYTES];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Hash token using SHA-256
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Token hashing failed", e);
        }
    }
}
