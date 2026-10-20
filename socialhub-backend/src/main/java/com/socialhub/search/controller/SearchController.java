package com.socialhub.search.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.post.dto.PostDto;
import com.socialhub.search.service.SearchService;
import com.socialhub.user.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Search operations
 * Base path: /api/search
 */
@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Search endpoints for users, posts, and hashtags")
public class SearchController {

    private final SearchService searchService;

    /**
     * Search users by keyword (name or username)
     * GET /api/search/users?q=keyword
     */
    @GetMapping("/users")
    @Operation(summary = "Search users", description = "Search users by display name or username")
    public ResponseEntity<ApiResponse<List<UserDto>>> searchUsers(
            @Parameter(description = "Search keyword", required = true)
            @RequestParam String q) {
        
        log.info("GET /api/search/users?q={}", q);
        
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "Empty search query"));
        }
        
        List<UserDto> results = searchService.searchUsers(q.trim());
        return ResponseEntity.ok(ApiResponse.success(results, "Users found: " + results.size()));
    }

    /**
     * Search posts by keyword
     * GET /api/search/posts?q=keyword
     */
    @GetMapping("/posts")
    @Operation(summary = "Search posts", description = "Search posts by content keyword")
    public ResponseEntity<ApiResponse<List<PostDto>>> searchPosts(
            @Parameter(description = "Search keyword", required = true)
            @RequestParam String q,
            @Parameter(description = "Current user ID")
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId) {
        
        log.info("GET /api/search/posts?q={}", q);
        
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "Empty search query"));
        }
        
        List<PostDto> results = searchService.searchPosts(q.trim(), currentUserId);
        return ResponseEntity.ok(ApiResponse.success(results, "Posts found: " + results.size()));
    }

    /**
     * Search posts by hashtag
     * GET /api/search/hashtags?tag=hashtag
     */
    @GetMapping("/hashtags")
    @Operation(summary = "Search posts by hashtag", description = "Search posts by specific hashtag")
    public ResponseEntity<ApiResponse<List<PostDto>>> searchByHashtag(
            @Parameter(description = "Hashtag to search", required = true)
            @RequestParam String tag,
            @Parameter(description = "Current user ID")
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId) {
        
        log.info("GET /api/search/hashtags?tag={}", tag);
        
        if (tag == null || tag.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "Empty hashtag query"));
        }
        
        String cleanTag = tag.trim().replaceAll("^#+", "");
        List<PostDto> results = searchService.searchByHashtag(cleanTag, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(results, "Posts found: " + results.size()));
    }
}
