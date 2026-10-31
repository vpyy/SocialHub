package com.socialhub.chat.controller;

import com.socialhub.chat.dto.*;
import com.socialhub.chat.service.ChatService;
import com.socialhub.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /** POST /api/conversations — get or create 1-1 conversation */
    @PostMapping
    public ResponseEntity<ApiResponse<ConversationDto>> getOrCreate(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody StartConversationRequest req) {

        ConversationDto dto = chatService.getOrCreateConversation(userId, req.getTargetUserId());
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success(dto, "OK"));
    }

    /** GET /api/conversations?page=0&size=20 */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ConversationDto>>> list(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                chatService.getConversations(userId, page, size), "OK"));
    }

    /** GET /api/conversations/{id}/messages?page=0&size=50 */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<Page<MessageDto>>> getMessages(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMessages(id, userId, page, size), "OK"));
    }

    /** POST /api/conversations/{id}/messages — send message */
    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody SendMessageRequest req) {

        MessageDto dto = chatService.sendMessage(id, userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Tin nhắn đã gửi"));
    }

    /** PUT /api/conversations/{id}/messages/read — mark all as read */
    @PutMapping("/{id}/messages/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {

        chatService.markMessagesRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "OK"));
    }

    /** POST /api/conversations/group — create group chat */
    @PostMapping("/group")
    public ResponseEntity<ApiResponse<ConversationDto>> createGroupChat(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateGroupChatRequest req) {

        ConversationDto dto = chatService.createGroupChat(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Nhóm chat đã được tạo"));
    }
}
