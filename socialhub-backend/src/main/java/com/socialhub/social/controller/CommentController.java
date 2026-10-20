package com.socialhub.social.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.social.dto.CommentDto;
import com.socialhub.social.dto.CreateCommentRequest;
import com.socialhub.social.service.CommentService;
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

/**
 * REST Controller for Comment operations
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Comment management endpoints")
public class CommentController {

    private final CommentService commentService;

    /**
     * Create a comment or reply
     * POST /api/posts/{id}/comments
     */
    @PostMapping("/posts/{id}/comments")
    @Operation(summary = "Create a comment", description = "Add a comment or reply to a post")
    public ResponseEntity<ApiResponse<CommentDto>> createComment(
            @Parameter(description = "Post ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Author user ID")
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String authorId,
            @Valid @RequestBody CreateCommentRequest request) {
        
        log.info("POST /api/posts/{}/comments - Author: {}", id, authorId);
        
        CommentDto comment = commentService.createComment(id, authorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(comment, "Comment created successfully"));
    }

    /**
     * Get comments for a post
     * GET /api/posts/{id}/comments
     */
    @GetMapping("/posts/{id}/comments")
    @Operation(summary = "Get post comments", description = "Get all comments for a post (with replies)")
    public ResponseEntity<ApiResponse<Page<CommentDto>>> getPostComments(
            @Parameter(description = "Post ID", required = true)
            @PathVariable String id,
            @Parameter(description = "Current user ID")
            @RequestHeader(value = "X-User-Id", required = false) String currentUserId,
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("GET /api/posts/{}/comments (page: {}, size: {})", id, page, size);
        
        Page<CommentDto> comments = commentService.getPostComments(id, currentUserId, page, size);
        return ResponseEntity.ok(ApiResponse.success(comments, "Comments retrieved successfully"));
    }

    /**
     * Delete a comment
     * DELETE /api/comments/{id}
     */
    @DeleteMapping("/comments/{id}")
    @Operation(summary = "Delete a comment", description = "Delete a comment (only author can delete)")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @Parameter(description = "Comment ID", required = true)
            @PathVariable String id,
            @Parameter(description = "User ID")
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "temp-user-id") String userId) {
        
        log.info("DELETE /api/comments/{} - User: {}", id, userId);
        
        commentService.deleteComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Comment deleted successfully"));
    }
}
