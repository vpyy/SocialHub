package com.socialhub.auth.controller;

import com.socialhub.auth.dto.LoginRequest;
import com.socialhub.auth.dto.LoginResponse;
import com.socialhub.auth.util.JwtTokenProvider;
import com.socialhub.common.response.ApiResponse;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.CreateUserDto;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    private final PasswordEncoder passwordEncoder;

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
            @Valid @RequestBody LoginRequest req) {

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

        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername());

        LoginResponse response = LoginResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationMs())
                .user(userService.toDto(user))
                .build();

        log.info("Login success — username: {}", user.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    // ──────────────────────────────────────────────────────
    // POST /api/auth/logout  (stateless — client drops token)
    // ──────────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
    }
}
