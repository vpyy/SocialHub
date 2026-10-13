package com.socialhub.auth.controller;

import com.socialhub.auth.dto.LoginRequest;
import com.socialhub.auth.dto.LoginResponse;
import com.socialhub.auth.util.JwtTokenProvider;
import com.socialhub.common.response.ApiResponse;
import com.socialhub.user.dto.CreateUserDto;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * 
 * Handles login, register, and logout
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {
    
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Register new user
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(
        @Valid @RequestBody CreateUserDto createUserDto
    ) {
        log.info("Registering user with email: {}", createUserDto.getEmail());
        UserDto userDto = userService.createUser(createUserDto);
        return ResponseEntity.ok(ApiResponse.success(userDto, "User registered successfully"));
    }
    
    /**
     * Login user and return JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
        @Valid @RequestBody LoginRequest loginRequest
    ) {
        log.info("User login attempt: {}", loginRequest.getEmailOrUsername());
        
        // Find user by email or username
        var user = userService.findByUsernameOrEmail(
            loginRequest.getEmailOrUsername(),
            loginRequest.getEmailOrUsername()
        );
        
        // Verify password
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
            log.warn("Invalid password for user: {}", loginRequest.getEmailOrUsername());
            return ResponseEntity.status(401)
                .body(ApiResponse.error("Invalid email/username or password", "/api/auth/login"));
        }
        
        // Generate token
        String token = jwtTokenProvider.generateToken(user.getId(), user.getUsername());
        
        log.info("User logged in successfully: {}", user.getUsername());
        
        LoginResponse response = LoginResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getExpirationMs())
            .user(userService.convertToDto(user))
            .build();
        
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }
    
    /**
     * Logout user (client-side token removal)
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        log.info("User logout");
        return ResponseEntity.ok(ApiResponse.success(null, "Logout successful"));
    }
}
