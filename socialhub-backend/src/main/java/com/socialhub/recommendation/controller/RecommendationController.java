package com.socialhub.recommendation.controller;

import com.socialhub.common.exception.ApiException;
import com.socialhub.common.response.ApiResponse;
import com.socialhub.recommendation.dto.PopularPostDto;
import com.socialhub.recommendation.dto.RecommendedUserDto;
import com.socialhub.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/discover")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * GET /api/discover/popular-posts?limit=10
     * Get trending/popular posts for discovery page
     */
    @GetMapping("/popular-posts")
    public ResponseEntity<ApiResponse<List<PopularPostDto>>> getPopularPosts(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        log.info("GET /api/discover/popular-posts, limit={}", limit);
        
        String currentUserId = extractCurrentUserId(authentication);
        if (currentUserId == null) {
            // Allow anonymous users to see popular posts
            currentUserId = "anonymous";
        }
        
        List<PopularPostDto> popularPosts = recommendationService
            .getPopularPosts(currentUserId, Math.min(limit, 100));
        
        return ResponseEntity.ok(ApiResponse.success(
            popularPosts,
            "Popular posts retrieved successfully"
        ));
    }

    /**
     * GET /api/discover/suggested-users?limit=10
     * Get suggested users for discovery page (requires authentication)
     */
    @GetMapping("/suggested-users")
    public ResponseEntity<ApiResponse<List<RecommendedUserDto>>> getSuggestedUsers(
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        log.info("GET /api/discover/suggested-users, limit={}", limit);
        
        String currentUserId = extractCurrentUserId(authentication);
        if (currentUserId == null) {
            throw new ApiException(
                "Vui lòng đăng nhập để xem gợi ý người dùng",
                "UNAUTHORIZED",
                401
            );
        }
        
        List<RecommendedUserDto> suggestedUsers = recommendationService
            .getRecommendedUsers(currentUserId, Math.min(limit, 100));
        
        return ResponseEntity.ok(ApiResponse.success(
            suggestedUsers,
            "Suggested users retrieved successfully"
        ));
    }

    // ──────────────────────────────────────────────────────
    // Helper: Extract current user ID from authentication
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
