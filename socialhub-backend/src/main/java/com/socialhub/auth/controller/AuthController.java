package com.socialhub.auth.controller;

import com.socialhub.auth.dto.*;
import com.socialhub.auth.model.RefreshToken;
import com.socialhub.auth.service.RefreshTokenService;
import com.socialhub.auth.service.EmailVerificationService;
import com.socialhub.auth.util.DeviceInfoExtractor;
import com.socialhub.auth.util.JwtTokenProvider;
import com.socialhub.common.exception.TokenException;
import com.socialhub.common.response.ApiResponse;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.CreateUserDto;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000"
})
public class AuthController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final com.socialhub.user.repository.UserRepository userRepository;

    // ──────────────────────────────────────────────────────
    // POST /api/auth/register
    // ──────────────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(
            @Valid @RequestBody CreateUserDto dto) {

        log.info("Register request — email: {}", dto.getEmail());
        UserDto userDto = userService.createUser(dto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(userDto, "Đăng ký thành công"));
    }

    // ──────────────────────────────────────────────────────
    // POST /api/auth/login
    // ──────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        log.info("Login attempt — identifier: {}", req.getEmailOrUsername());

        User user = userService.findByUsernameOrEmail(req.getEmailOrUsername());

        if (!"ACTIVE".equals(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Tài khoản đã bị khoá", "/api/auth/login"));
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            log.warn("Wrong password for: {}", req.getEmailOrUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Email/username hoặc mật khẩu không đúng", "/api/auth/login"));
        }

        // Create refresh token session
        DeviceInfoExtractor.DeviceInfo deviceInfo = DeviceInfoExtractor.extractDeviceInfo(servletRequest);
        String ip = deviceInfo.getIp();
        Map<String, Object> tokenData = refreshTokenService.createRefreshToken(user.getId(), deviceInfo, ip);
        
        String refreshToken = (String) tokenData.get("refreshToken");
        String sessionId = (String) tokenData.get("sessionId");
        
        // Generate access token with session ID
        String accessToken = jwtTokenProvider.generateTokenWithSession(user.getId(), user.getUsername(), sessionId);

        // Set HTTP-only cookie with refresh token
        setRefreshTokenCookie(servletResponse, refreshToken);

        LoginResponse response = LoginResponse.builder()
                .token(accessToken)
                .tokenType("Bearer")
                .expiresIn((int) (jwtTokenProvider.getExpirationMs() / 1000)) // Convert to seconds
                .user(userService.toDto(user))
                .build();

        log.info("Login success — username: {}, sessionId: {}", user.getUsername(), sessionId);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    // ──────────────────────────────────────────────────────
    // POST /api/auth/refresh
    // ──────────────────────────────────────────────────────
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        try {
            // Extract refresh token from cookie
            String refreshToken = extractRefreshTokenFromCookie(servletRequest);

            if (refreshToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "code", "TOKEN_EXPIRED",
                                "message", "Refresh token not found"
                        ));
            }

            // Call refresh service
            Map<String, Object> tokenData = refreshTokenService.refresh(refreshToken);
            String newRefreshToken = (String) tokenData.get("refreshToken");
            String sessionId = (String) tokenData.get("sessionId");

            // Get userId from refresh token doc
            RefreshToken refreshTokenDoc = refreshTokenService.getRefreshTokenById(sessionId);
            if (refreshTokenDoc == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "code", "TOKEN_EXPIRED",
                                "message", "Session not found"
                        ));
            }

            String userId = refreshTokenDoc.getUserId();
            String username = refreshTokenDoc.getUserId(); // Can use any identifier

            // Generate new access token
            String accessToken = jwtTokenProvider.generateTokenWithSession(userId, username, sessionId);

            // Set new cookie
            setRefreshTokenCookie(servletResponse, newRefreshToken);

            return ResponseEntity.ok(ApiResponse.success(
                    Map.of(
                            "accessToken", accessToken,
                            "expiresIn", 1800
                    ),
                    "Token refreshed"
            ));

        } catch (TokenException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "success", false,
                            "code", e.getCode(),
                            "message", e.getMessage()
                    ));
        }
    }

    // ──────────────────────────────────────────────────────
    // POST /api/auth/logout
    // ──────────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            Authentication authentication,
            jakarta.servlet.http.HttpServletRequest request,
            HttpServletResponse servletResponse) {

        String sessionId = (String) request.getAttribute("sessionId");

        if (sessionId != null) {
            refreshTokenService.revokeSession(sessionId);
        }

        // Clear cookie
        clearRefreshTokenCookie(servletResponse);

        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
    }

    // ──────────────────────────────────────────────────────
    // POST /api/auth/logout-all
    // ──────────────────────────────────────────────────────
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll(
            Authentication authentication,
            @RequestBody Map<String, Boolean> body,
            jakarta.servlet.http.HttpServletRequest request,
            HttpServletResponse servletResponse) {

        String userId = (String) authentication.getPrincipal();
        String sessionId = (String) request.getAttribute("sessionId");
        boolean exceptCurrent = body.getOrDefault("exceptCurrent", false);

        String exceptSessionId = exceptCurrent ? sessionId : null;
        refreshTokenService.revokeAllSessions(userId, exceptSessionId);

        if (!exceptCurrent) {
            clearRefreshTokenCookie(servletResponse);
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Logged out from all devices"));
    }

    // ──────────────────────────────────────────────────────
    // GET /api/auth/sessions
    // ──────────────────────────────────────────────────────
    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSessions(
            Authentication authentication,
            jakarta.servlet.http.HttpServletRequest request) {

        String userId = (String) authentication.getPrincipal();
        String currentSessionId = (String) request.getAttribute("sessionId");

        List<Map<String, Object>> sessions = refreshTokenService.getSessions(userId);

        // Add isCurrent flag
        sessions.forEach(session -> {
            session.put("isCurrent", session.get("sessionId").equals(currentSessionId));
        });

        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    // ──────────────────────────────────────────────────────
    // DELETE /api/auth/sessions/{sessionId}
    // ──────────────────────────────────────────────────────
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable String sessionId,
            Authentication authentication) {

        String userId = (String) authentication.getPrincipal();

        // Validate ownership
        RefreshToken refreshTokenDoc = refreshTokenService.getRefreshTokenById(sessionId);
        if (refreshTokenDoc == null || !refreshTokenDoc.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Unauthorized", "FORBIDDEN"));
        }

        refreshTokenService.revokeSession(sessionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Session revoked"));
    }

    // ──────────────────────────────────────────────────────
    // Phase 2: Email Verification & Password Reset
    // ──────────────────────────────────────────────────────

    /**
     * POST /api/auth/verify-email
     * Verify email using token from email link
     */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest req) {

        log.info("Email verification request");

        User user = emailVerificationService.verifyEmailToken(req.getToken());

        return ResponseEntity.ok(ApiResponse.success(null, "Email xác minh thành công"));
    }

    /**
     * POST /api/auth/resend-verification
     * Resend email verification link
     * Rate limited: 3/hour per email
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest req) {

        log.info("Resend verification request for: {}", req.getEmail());

        User user = userService.findByUsernameOrEmail(req.getEmail());

        if (user.getEmailVerified()) {
            return ResponseEntity.ok(ApiResponse.success(null, "Email đã được xác minh"));
        }

        emailVerificationService.generateAndSendVerificationEmail(user.getId(), user.getEmail());

        return ResponseEntity.ok(ApiResponse.success(null, "Email xác minh đã được gửi lại"));
    }

    /**
     * POST /api/auth/forgot-password
     * Request password reset email
     * Always returns success message (no user enumeration)
     * Rate limited: 3/hour per IP
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req) {

        log.info("Forgot password request for: {}", req.getEmail());

        try {
            User user = userService.findByUsernameOrEmail(req.getEmail());

            // Only send if LOCAL auth (not OAuth)
            if ("LOCAL".equals(user.getAuthProvider())) {
                emailVerificationService.generateAndSendPasswordResetEmail(user.getId(), user.getEmail());
            }
        } catch (Exception e) {
            log.debug("User not found for forgot password: {}", req.getEmail());
        }

        // Always return same message for security
        return ResponseEntity.ok(ApiResponse.success(null, "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu"));
    }

    /**
     * POST /api/auth/reset-password
     * Reset password using token from email link
     * Revokes all sessions after password change
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req) {

        log.info("Password reset request");

        User user = emailVerificationService.verifyPasswordResetToken(req.getToken());

        // Update password
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        user.setUpdatedAt(java.time.Instant.now());
        userRepository.save(user);

        // Revoke all sessions for security
        refreshTokenService.revokeAllSessions(user.getId(), null);

        log.info("Password reset successful for user: {}", user.getId());

        return ResponseEntity.ok(ApiResponse.success(null, "Mật khẩu đã được đặt lại thành công"));
    }

    /**
     * POST /api/auth/oauth/google
     * Authenticate with Google using ID token
     * Creates new user if not exists
     */
    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<LoginResponse>> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest req,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        log.info("Google OAuth authentication request");

        try {
            // Verify and decode Google ID token (TODO: implement with google-auth-library)
            // For now, this is a placeholder - needs implementation with Google API library
            String googleUserId = req.getIdToken(); // TODO: verify token and extract userId, email
            String email = null; // TODO: extract from verified token
            String displayName = null; // TODO: extract from verified token

            User user = null;

            // Try to find existing user by email or Google ID
            try {
                user = userRepository.findByEmailIgnoreCase(email).orElse(null);
            } catch (Exception e) {
                log.debug("User not found by email");
            }

            if (user == null) {
                // Create new user linked to Google
                user = User.builder()
                        .email(email)
                        .username("user_" + System.currentTimeMillis())
                        .displayName(displayName)
                        .passwordHash("") // OAuth users don't have password
                        .emailVerified(true) // Google verified email
                        .authProvider("GOOGLE")
                        .role("USER")
                        .status("ACTIVE")
                        .createdAt(java.time.Instant.now())
                        .updatedAt(java.time.Instant.now())
                        .build();

                userRepository.save(user);
                log.info("New user created from Google OAuth: {}", user.getEmail());
            } else if (!"GOOGLE".equals(user.getAuthProvider())) {
                // Link Google to existing LOCAL account
                user.setAuthProvider("GOOGLE");
                user.setEmailVerified(true);
                user.setUpdatedAt(java.time.Instant.now());
                userRepository.save(user);
                log.info("Google linked to existing user: {}", user.getId());
            }

            // Create session and return tokens
            DeviceInfoExtractor.DeviceInfo deviceInfo = DeviceInfoExtractor.extractDeviceInfo(servletRequest);
            String ip = deviceInfo.getIp();
            Map<String, Object> tokenData = refreshTokenService.createRefreshToken(user.getId(), deviceInfo, ip);

            String refreshToken = (String) tokenData.get("refreshToken");
            String sessionId = (String) tokenData.get("sessionId");

            String accessToken = jwtTokenProvider.generateTokenWithSession(user.getId(), user.getUsername(), sessionId);

            setRefreshTokenCookie(servletResponse, refreshToken);

            LoginResponse response = LoginResponse.builder()
                    .token(accessToken)
                    .tokenType("Bearer")
                    .expiresIn((int) (jwtTokenProvider.getExpirationMs() / 1000))
                    .user(userService.toDto(user))
                    .build();

            log.info("Google OAuth successful for user: {}", user.getId());
            return ResponseEntity.ok(ApiResponse.success(response, "Google authentication successful"));

        } catch (Exception e) {
            log.error("Google OAuth error: {}", e.getMessage(), e);
            throw new com.socialhub.common.exception.ValidationException("Google authentication failed");
        }
    }

    // ──────────────────────────────────────────────────────
    // Helper methods
    // ──────────────────────────────────────────────────────

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refreshToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(604800); // 7 days
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }

        for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}
