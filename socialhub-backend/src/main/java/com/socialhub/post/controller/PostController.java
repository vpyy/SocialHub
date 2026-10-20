package com.socialhub.post.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.post.dto.CreatePostRequest;
import com.socialhub.post.dto.PostDto;
import com.socialhub.post.dto.UpdatePostRequest;
import com.socialhub.post.service.PostService;
import com.socialhub.social.service.RepostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for Post operations
 * Base path: /api/posts
 */
@Slf4j
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "Post management endpoints")
public class PostController {

    private final PostService postService;
    private final RepostService repostService;

    /**
     * Create a new post
     * POST /api/posts
     */
    @PostMapping
    @Operation(summary = "Create a new post", description = "Create a new post with content, media, hashtags, and visibility settings")
    public ResponseEntity<ApiResponse<PostDto>> createPost(
            @Parameter(description = "Author user ID", required = true) @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String authorId,
            @Valid @RequestBody CreatePostRequest request) {

        log.info("POST /api/posts - Creating post for author: {}", authorId);

        PostDto post = postService.createPost(authorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(post, "Post created successfully"));
    }

    /**
     * Get personalized feed
     * GET /api/posts/feed
     */
    @GetMapping("/feed")
    @Operation(summary = "Get personalized feed", description = "Get posts from followed users and public posts")
    public ResponseEntity<ApiResponse<Page<PostDto>>> getFeed(
            @Parameter(description = "Current user ID") @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String currentUserId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/posts/feed - Fetching feed for user: {} (page: {}, size: {})", currentUserId, page, size);

        Page<PostDto> feed = postService.getFeed(currentUserId, page, size);
        return ResponseEntity.ok(ApiResponse.success(feed, "Feed retrieved successfully"));
    }

    /**
     * Get public feed (explore)
     * GET /api/posts/public
     */
    @GetMapping("/public")
    @Operation(summary = "Get public feed", description = "Get all public posts (no authentication required)")
    public ResponseEntity<ApiResponse<Page<PostDto>>> getPublicFeed(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/posts/public - Fetching public feed (page: {}, size: {})", page, size);

        Page<PostDto> feed = postService.getPublicFeed(page, size);
        return ResponseEntity.ok(ApiResponse.success(feed, "Public feed retrieved successfully"));
    }

    /**
     * Get post by ID
     * GET /api/posts/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get post by ID", description = "Retrieve detailed information about a specific post")
    public ResponseEntity<ApiResponse<PostDto>> getPostById(
            @Parameter(description = "Post ID", required = true) @PathVariable String id,
            @Parameter(description = "Current user ID") @RequestHeader(value = "X-User-Id", required = false) String currentUserId) {

        log.info("GET /api/posts/{} - Fetching post", id);

        PostDto post = postService.getPostById(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(post, "Post retrieved successfully"));
    }

    /**
     * Update post
     * PUT /api/posts/{id}
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update post", description = "Update content, media, hashtags, or visibility of a post")
    public ResponseEntity<ApiResponse<PostDto>> updatePost(
            @Parameter(description = "Post ID", required = true) @PathVariable String id,
            @Parameter(description = "Author user ID", required = true) @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String authorId,
            @Valid @RequestBody UpdatePostRequest request) {

        log.info("PUT /api/posts/{} - Updating post by author: {}", id, authorId);

        PostDto post = postService.updatePost(id, authorId, request);
        return ResponseEntity.ok(ApiResponse.success(post, "Post updated successfully"));
    }

    /**
     * Delete post
     * DELETE /api/posts/{id}
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete post", description = "Delete a post (only the author can delete their own post)")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @Parameter(description = "Post ID", required = true) @PathVariable String id,
            @Parameter(description = "Author user ID", required = true) @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String authorId) {

        log.info("DELETE /api/posts/{} - Deleting post by author: {}", id, authorId);

        postService.deletePost(id, authorId);
        return ResponseEntity.ok(ApiResponse.success(null, "Post deleted successfully"));
    }

    /**
     * Search posts by keyword
     * GET /api/posts/search?q=keyword&page=0&size=20
     */
    @GetMapping("/search")
    @Operation(summary = "Search posts", description = "Search public posts by keyword in content")
    public ResponseEntity<ApiResponse<Page<PostDto>>> searchPosts(
            @Parameter(description = "Search keyword", required = true) @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/posts/search?q={} (page: {}, size: {})", q, page, size);
        Page<PostDto> results = postService.searchPosts(q, page, size);
        return ResponseEntity.ok(ApiResponse.success(results, "Search results"));
    }

    /**
     * Get posts by user ID
     * GET /api/posts/user/{userId}
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user posts", description = "Retrieve all posts created by a specific user")
    public ResponseEntity<ApiResponse<Page<PostDto>>> getUserPosts(
            @Parameter(description = "User ID", required = true) @PathVariable String userId,
            @Parameter(description = "Current user ID") @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/posts/user/{} - Fetching posts (page: {}, size: {})", userId, page, size);

        Page<PostDto> posts = postService.getUserPosts(userId, currentUserId, page, size);
        return ResponseEntity.ok(ApiResponse.success(posts, "User posts retrieved successfully"));
    }

    /**
     * Toggle repost on a post
     * POST /api/posts/{id}/repost
     */
    @PostMapping("/{id}/repost")
    @Operation(summary = "Toggle repost", description = "Repost or unrepost a post")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleRepost(
            @Parameter(description = "Post ID", required = true) @PathVariable String id,
            @Parameter(description = "Current user ID", required = true) @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String userId) {

        log.info("POST /api/posts/{}/repost - Toggle repost by user: {}", id, userId);

        Map<String, Object> result = repostService.toggleRepost(userId, id);
        boolean reposted = (boolean) result.get("reposted");

        return ResponseEntity.ok(ApiResponse.success(result,
                reposted ? "Post reposted successfully" : "Post unreposted successfully"));
    }
}
