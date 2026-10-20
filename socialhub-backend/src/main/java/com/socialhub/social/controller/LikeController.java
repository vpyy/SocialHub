package com.socialhub.social.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.social.dto.LikeDto;
import com.socialhub.social.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for Like operations
 */
@Slf4j
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Likes", description = "Like management endpoints")
public class LikeController {

    private final LikeService likeService;

    /**
     * Toggle like on a post
     * POST /api/posts/{id}/like
     */
    @PostMapping("/{id}/like")
    @Operation(summary = "Toggle like on a post", description = "Like or unlike a post")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleLike(
            @Parameter(description = "Post ID", required = true)
            @PathVariable String id,
            @Parameter(description = "User ID")
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String userId) {
        
        log.info("POST /api/posts/{}/like - User: {}", id, userId);
        
        boolean liked = likeService.toggleLike(id, userId);
        
        Map<String, Object> result = Map.of(
            "liked", liked,
            "message", liked ? "Post liked" : "Post unliked"
        );
        
        return ResponseEntity.ok(ApiResponse.success(result, 
            liked ? "Post liked successfully" : "Post unliked successfully"));
    }

    /**
     * Get users who liked a post
     * GET /api/posts/{id}/likes
     */
    @GetMapping("/{id}/likes")
    @Operation(summary = "Get post likes", description = "Get list of users who liked the post")
    public ResponseEntity<ApiResponse<Page<LikeDto>>> getPostLikes(
            @Parameter(description = "Post ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/posts/{}/likes (page: {}, size: {})", id, page, size);
        
        Page<LikeDto> likes = likeService.getPostLikes(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(likes, "Likes retrieved successfully"));
    }
}
