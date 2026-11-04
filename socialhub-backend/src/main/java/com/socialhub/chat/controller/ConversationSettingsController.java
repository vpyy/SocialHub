package com.socialhub.chat.controller;

import com.socialhub.chat.service.ConversationSettingsService;
import com.socialhub.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Conversation settings endpoints (per-user)
 * - Pin/Unpin conversation
 * - Mute/Unmute notifications
 * - Archive/Delete conversation (soft delete)
 * - Mark as unread
 */
@RestController
@RequestMapping("/api/conversations/{conversationId}/settings")
@RequiredArgsConstructor
public class ConversationSettingsController {

    private final ConversationSettingsService settingsService;

    private String getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return (String) authentication.getPrincipal();
    }

    /**
     * Pin conversation to top
     */
    @PostMapping("/pin")
    public ResponseEntity<?> pinConversation(@PathVariable String conversationId) {
        var settings = settingsService.pinConversation(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * Unpin conversation
     */
    @DeleteMapping("/pin")
    public ResponseEntity<?> unpinConversation(@PathVariable String conversationId) {
        var settings = settingsService.unpinConversation(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * Mute conversation
     */
    @PostMapping("/mute")
    public ResponseEntity<?> muteConversation(
            @PathVariable String conversationId,
            @RequestBody(required = false) MuteRequest request
    ) {
        var mutedUntil = request != null ? request.getMutedUntil() : null;
        var settings = settingsService.muteConversation(getCurrentUserId(), conversationId, mutedUntil);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * Unmute conversation
     */
    @DeleteMapping("/mute")
    public ResponseEntity<?> unmuteConversation(@PathVariable String conversationId) {
        var settings = settingsService.unmuteConversation(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * Archive conversation (soft delete)
     */
    @PostMapping("/archive")
    public ResponseEntity<?> archiveConversation(@PathVariable String conversationId) {
        var settings = settingsService.archiveConversation(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * Unarchive conversation
     */
    @DeleteMapping("/archive")
    public ResponseEntity<?> unarchiveConversation(@PathVariable String conversationId) {
        var settings = settingsService.unarchiveConversation(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * Mark as unread
     */
    @PostMapping("/unread")
    public ResponseEntity<?> markAsUnread(@PathVariable String conversationId) {
        var settings = settingsService.markAsUnread(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    /**
     * Get settings
     */
    @GetMapping
    public ResponseEntity<?> getSettings(@PathVariable String conversationId) {
        var settings = settingsService.getOrCreateSettings(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    // DTO
    @lombok.Data
    public static class MuteRequest {
        private String mutedUntil;
    }
}
