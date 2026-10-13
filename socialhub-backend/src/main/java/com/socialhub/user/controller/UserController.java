package com.socialhub.user.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.user.dto.CreateUserDto;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * User API Endpoints
 * 
 * Base URL: /api/user
 */
@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Tag(name = "User", description = "User management endpoints")
public class UserController {
    
    private final UserService userService;
    
    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieves user profile information by user ID")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserDto>> getUserById(
            @Parameter(description = "User ID (MongoDB ObjectId)", example = "507f1f77bcf86cd799439011")
            @PathVariable String id) {
        log.info("Get user by id: {}", id);
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
    }
    
    /**
     * Get user by username
     */
    @GetMapping("/username/{username}")
    @Operation(summary = "Get user by username", description = "Retrieves user profile information by username")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserDto>> getUserByUsername(
            @Parameter(description = "Username", example = "minh_dev")
            @PathVariable String username) {
        log.info("Get user by username: {}", username);
        UserDto user = userService.getUserByUsername(username);
        return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
    }
    
    /**
     * Get user by email
     */
    @GetMapping("/email/{email}")
    @Operation(summary = "Get user by email", description = "Retrieves user profile information by email")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserDto>> getUserByEmail(
            @Parameter(description = "Email address", example = "minh@example.com")
            @PathVariable String email) {
        log.info("Get user by email: {}", email);
        UserDto user = userService.getUserByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(user, "User retrieved successfully"));
    }
    
    /**
     * Create new user (test endpoint - will be part of auth registration)
     * 
     * NOTE: This endpoint is public for testing during setup phase.
     * In production, user creation should be done through the auth/register endpoint.
     */
    @PostMapping
    @Operation(summary = "Create new user (TEST ONLY)", description = "Creates a new user account - This is a test endpoint for setup phase")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User created successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation error"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Username or email already exists")
    })
    public ResponseEntity<ApiResponse<UserDto>> createUser(
            @Valid @RequestBody CreateUserDto createUserDto) {
        log.info("Create new user with email: {}", createUserDto.getEmail());
        UserDto user = userService.createUser(createUserDto);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.success(user, "User created successfully"));
    }
}
