package com.socialhub.user.controller;

import com.socialhub.common.exception.ApiException;
import com.socialhub.common.response.ApiResponse;
import com.socialhub.post.dto.PostResponseDto;
import com.socialhub.social.dto.FollowResponseDto;
import com.socialhub.social.dto.FollowUserDto;
import com.socialhub.social.service.FollowService;
import com.socialhub.user.dto.*;
import com.socialhub.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FollowService followService;

    // ──────────────────────────────────────────────────────
    // 1. GET /api/users/{username} — Public Profile
    // ──────────────────────────────────────────────────────
    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(
            @PathVariable String username,
            Authentication authentication) {
        String currentUserId = extractCurrentUserId(authentication);
        UserProfileDto profile = userService.getUserProfile(username, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(profile, "OK"));
    }

    // ──────────────────────────────────────────────────────
    // 2. PUT /api/users/me — Update My Profile
    // ──────────────────────────────────────────────────────
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @Valid @RequestBody UpdateProfileDto dto,
            Authentication authentication) {
        String currentUserId = extractCurrentUserId(authentication);
        if (currentUserId == null) {
            throw new ApiException("Vui lòng đăng nhập để thực hiện thao tác này", "UNAUTHORIZED", 401);
        }
        UserProfileDto updated = userService.updateMyProfile(currentUserId, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật profile thành công"));
    }

    // ──────────────────────────────────────────────────────
    // 3. POST /api/users/{id}/follow — Toggle Follow / Unfollow
    // ──────────────────────────────────────────────────────
    @PostMapping("/{id}/follow")
    public ResponseEntity<ApiResponse<FollowResponseDto>> toggleFollow(
            @PathVariable String id,
            Authentication authentication) {
        String currentUserId = extractCurrentUserId(authentication);
        if (currentUserId == null) {
            throw new ApiException("Vui lòng đăng nhập để thực hiện thao tác này", "UNAUTHORIZED", 401);
        }
        FollowResponseDto result = followService.toggleFollow(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    // ──────────────────────────────────────────────────────
    // 4. GET /api/users/{id}/followers — Followers List
    // ──────────────────────────────────────────────────────
    @GetMapping("/{id}/followers")
    public ResponseEntity<ApiResponse<List<FollowUserDto>>> getFollowers(
            @PathVariable String id,
            Authentication authentication) {
        String currentUserId = extractCurrentUserId(authentication);
        List<FollowUserDto> followers = followService.getFollowers(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(followers, "OK"));
    }

    // ──────────────────────────────────────────────────────
    // 5. GET /api/users/{id}/following — Following List
    // ──────────────────────────────────────────────────────
    @GetMapping("/{id}/following")
    public ResponseEntity<ApiResponse<List<FollowUserDto>>> getFollowing(
            @PathVariable String id,
            Authentication authentication) {
        String currentUserId = extractCurrentUserId(authentication);
        List<FollowUserDto> following = followService.getFollowing(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(following, "OK"));
    }

    // ──────────────────────────────────────────────────────
    // 6. GET /api/users/{id}/reposts — User Reposts
    // ──────────────────────────────────────────────────────
    @GetMapping("/{id}/reposts")
    public ResponseEntity<ApiResponse<List<PostResponseDto>>> getReposts(
            @PathVariable String id,
            Authentication authentication) {
        log.info("GET /api/users/{}/reposts", id);
        String currentUserId = extractCurrentUserId(authentication);
        List<PostResponseDto> reposts = userService.getUserReposts(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(reposts, "Reposts retrieved successfully"));
    }

    // ──────────────────────────────────────────────────────
    // 7. GET /api/users/{id}/liked-posts — User Liked Posts
    // ──────────────────────────────────────────────────────
    @GetMapping("/{id}/liked-posts")
    public ResponseEntity<ApiResponse<List<PostResponseDto>>> getLikedPosts(
            @PathVariable String id,
            Authentication authentication) {
        log.info("GET /api/users/{}/liked-posts", id);
        String currentUserId = extractCurrentUserId(authentication);
        List<PostResponseDto> likedPosts = userService.getUserLikedPosts(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(likedPosts, "Liked posts retrieved successfully"));
    }

    // ──────────────────────────────────────────────────────
    // Settings Endpoints (require authentication)
    // ──────────────────────────────────────────────────────

    /**
     * PUT /api/users/me/password — Change Password
     */
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest req,
            Authentication authentication) {
        String userId = extractCurrentUserId(authentication);
        if (userId == null) {
            throw new ApiException("Vui lòng đăng nhập để thực hiện thao tác này", "UNAUTHORIZED", 401);
        }
        userService.changePassword(userId, req.getCurrentPassword(), req.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Mật khẩu đã được cập nhật"));
    }

    /**
     * PUT /api/users/me/avatar — Update Avatar URL
     */
    @PutMapping("/me/avatar")
    public ResponseEntity<ApiResponse<UserDto>> updateAvatar(
            @Valid @RequestBody UpdateAvatarRequest req,
            Authentication authentication) {
        String userId = extractCurrentUserId(authentication);
        if (userId == null) {
            throw new ApiException("Vui lòng đăng nhập để thực hiện thao tác này", "UNAUTHORIZED", 401);
        }
        UserDto updated = userService.updateAvatar(userId, req.getAvatarUrl());
        return ResponseEntity.ok(ApiResponse.success(updated, "Avatar đã được cập nhật"));
    }

    /**
     * PUT /api/users/me/cover — Update Cover URL
     */
    @PutMapping("/me/cover")
    public ResponseEntity<ApiResponse<UserDto>> updateCover(
            @Valid @RequestBody UpdateCoverRequest req,
            Authentication authentication) {
        String userId = extractCurrentUserId(authentication);
        if (userId == null) {
            throw new ApiException("Vui lòng đăng nhập để thực hiện thao tác này", "UNAUTHORIZED", 401);
        }
        UserDto updated = userService.updateCover(userId, req.getCoverUrl());
        return ResponseEntity.ok(ApiResponse.success(updated, "Cover đã được cập nhật"));
    }

    // ──────────────────────────────────────────────────────
    // Existing API compatibility
    // ──────────────────────────────────────────────────────

    /** GET /api/users/username/:username */
    @GetMapping("/username/{username}")
    public ResponseEntity<ApiResponse<UserDto>> getByUsername(@PathVariable String username) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserByUsername(username), "OK"));
    }

    /** GET /api/users/search?q=keyword */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserDto>>> search(@RequestParam String q) {
        List<UserDto> results = userService.searchUsers(q);
        return ResponseEntity.ok(ApiResponse.success(results, "OK"));
    }

    // ──────────────────────────────────────────────────────
    // Helper
    // ──────────────────────────────────────────────────────
    private String extractCurrentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if ("anonymousUser".equals(principal)) {
            return null;
        }
        return principal.toString();
    }
}
