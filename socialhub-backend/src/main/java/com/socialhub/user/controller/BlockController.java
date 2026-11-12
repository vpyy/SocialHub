package com.socialhub.user.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.user.service.BlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * User blocking endpoints
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;

    private String getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return (String) authentication.getPrincipal();
    }

    /**
     * Block a user
     */
    @PostMapping("/{userId}/block")
    public ResponseEntity<?> blockUser(@PathVariable String userId) {
        var block = blockService.blockUser(getCurrentUserId(), userId);
        return ResponseEntity.ok(ApiResponse.success(block));
    }

    /**
     * Unblock a user
     */
    @DeleteMapping("/{userId}/block")
    public ResponseEntity<?> unblockUser(@PathVariable String userId) {
        blockService.unblockUser(getCurrentUserId(), userId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked successfully"));
    }

    /**
     * Check if blocked
     */
    @GetMapping("/{userId}/block/status")
    public ResponseEntity<?> checkBlockStatus(@PathVariable String userId) {
        var isBlocked = blockService.isBlocked(getCurrentUserId(), userId);
        return ResponseEntity.ok(ApiResponse.success(new BlockStatusResponse(isBlocked)));
    }

    /**
     * Get blocked users
     */
    @GetMapping("/blocked")
    public ResponseEntity<?> getBlockedUsers() {
        var blockedUsers = blockService.getBlockedUsers(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success(blockedUsers));
    }

    // DTO
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class BlockStatusResponse {
        private boolean isBlocked;
    }
}
