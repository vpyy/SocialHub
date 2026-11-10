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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /** POST /api/conversations/group — create group conversation */
    @PostMapping("/group")
    public ResponseEntity<ApiResponse<ConversationDto>> createGroup(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateGroupChatRequest req) {

        ConversationDto dto = chatService.createGroupConversation(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Nhóm đã được tạo"));
    }

    /** POST /api/conversations — get or create 1-1 conversation */
    @PostMapping
    public ResponseEntity<ApiResponse<ConversationDto>> getOrCreate(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody StartConversationRequest req) {

        ConversationDto dto = chatService.getOrCreateConversation(userId, req.getTargetUserId());
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success(dto, "OK"));
    }

    /** GET /api/conversations?page=0&size=20 */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ConversationDto>>> list(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                chatService.getConversations(userId, page, size), "OK"));
    }

    /** GET /api/conversations/{id}/messages?page=0&size=50 */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<Page<MessageDto>>> getMessages(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMessages(id, userId, page, size), "OK"));
    }

    /** POST /api/conversations/{id}/messages — send message */
    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<MessageDto>> sendMessage(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @RequestBody SendMessageRequest req) {

        MessageDto dto = chatService.sendMessage(id, userId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Tin nhắn đã gửi"));
    }

    /** PUT /api/conversations/{id}/messages/read — mark all as read */
    @PutMapping("/{id}/messages/read")
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {

        chatService.markMessagesRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "OK"));
    }

    /** DELETE /api/conversations/{id}/messages/{messageId} — delete message */
    @DeleteMapping("/{id}/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId) {

        chatService.deleteMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Tin nhắn đã xóa"));
    }

    /** PUT /api/conversations/{id}/messages/{messageId} — edit message */
    @PutMapping("/{id}/messages/{messageId}")
    public ResponseEntity<ApiResponse<MessageDto>> editMessage(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody EditMessageRequest req) {

        MessageDto dto = chatService.editMessage(messageId, userId, req);
        return ResponseEntity.ok(ApiResponse.success(dto, "Tin nhắn đã được cập nhật"));
    }

    /** GET /api/conversations/{id}/messages/search?query=... — search messages */
    @GetMapping("/{id}/messages/search")
    public ResponseEntity<ApiResponse<Page<MessageDto>>> searchMessages(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                chatService.searchMessages(id, userId, query, page, size), "OK"));
    }

    /** POST /api/conversations/{id}/messages/{messageId}/reactions — add reaction */
    @PostMapping("/{id}/messages/{messageId}/reactions")
    public ResponseEntity<ApiResponse<MessageDto>> addReaction(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody AddReactionRequest req) {

        MessageDto dto = chatService.addReaction(messageId, userId, req);
        return ResponseEntity.ok(ApiResponse.success(dto, "Phản ứng đã thêm"));
    }

    /** DELETE /api/conversations/{id}/messages/{messageId}/reactions — remove reaction */
    @DeleteMapping("/{id}/messages/{messageId}/reactions")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId) {

        chatService.removeReaction(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Phản ứng đã xóa"));
    }

    /** PUT /api/conversations/{id} — update group info */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationDto>> updateGroup(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UpdateGroupRequest req) {

        ConversationDto dto = chatService.updateGroupChat(id, userId, req);
        return ResponseEntity.ok(ApiResponse.success(dto, "Nhóm đã được cập nhật"));
    }

    /** DELETE /api/conversations/{id}/leave — leave group */
    @DeleteMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {

        chatService.leaveGroup(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã thoát nhóm"));
    }

    /** DELETE /api/conversations/{id} — delete conversation */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteConversation(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {

        chatService.deleteConversation(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đoạn chat đã xóa"));
    }

    /** POST /api/conversations/{id}/messages/{messageId}/reply — reply to message */
    @PostMapping("/{id}/messages/{messageId}/reply")
    public ResponseEntity<ApiResponse<MessageDto>> replyMessage(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ReplyMessageRequest req) {

        MessageDto dto = chatService.replyMessage(id, userId, messageId, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Tin nhắn trả lời đã gửi"));
    }

    /** POST /api/conversations/{id}/messages/{messageId}/pin — pin message */
    @PostMapping("/{id}/messages/{messageId}/pin")
    public ResponseEntity<ApiResponse<MessageDto>> pinMessage(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId) {

        MessageDto dto = chatService.pinMessage(id, messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Tin nhắn đã ghim"));
    }

    /** DELETE /api/conversations/{id}/messages/{messageId}/pin — unpin message */
    @DeleteMapping("/{id}/messages/{messageId}/pin")
    public ResponseEntity<ApiResponse<MessageDto>> unpinMessage(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId) {

        MessageDto dto = chatService.unpinMessage(id, messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã bỏ ghim"));
    }

    /** DELETE /api/conversations/{id}/messages/{messageId}/unsend — unsend for everyone */
    @DeleteMapping("/{id}/messages/{messageId}/unsend")
    public ResponseEntity<ApiResponse<Void>> unsendMessage(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId) {

        chatService.unsendMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Tin nhắn đã thu hồi"));
    }

    /** POST /api/conversations/{id}/messages/{messageId}/forward — forward message */
    @PostMapping("/{id}/messages/{messageId}/forward")
    public ResponseEntity<ApiResponse<Void>> forwardMessage(
            @PathVariable String id,
            @PathVariable String messageId,
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ForwardMessageRequest req) {

        chatService.forwardMessage(messageId, userId, req.getTargetConversationIds());
        return ResponseEntity.ok(ApiResponse.success(null, "Tin nhắn đã chuyển tiếp"));
    }

    /** POST /api/conversations/{id}/typing — set typing indicator */
    @PostMapping("/{id}/typing")
    public ResponseEntity<ApiResponse<Void>> setTyping(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {

        chatService.setTyping(id, userId, true);
        return ResponseEntity.ok(ApiResponse.success(null, "OK"));
    }

    /** DELETE /api/conversations/{id}/typing — clear typing indicator */
    @DeleteMapping("/{id}/typing")
    public ResponseEntity<ApiResponse<Void>> clearTyping(
            @PathVariable String id,
            @AuthenticationPrincipal String userId) {

        chatService.setTyping(id, userId, false);
        return ResponseEntity.ok(ApiResponse.success(null, "OK"));
    }

    /** POST /api/conversations/{id}/members/{memberId}/promote — promote to admin */
    @PostMapping("/{id}/members/{memberId}/promote")
    public ResponseEntity<ApiResponse<ConversationDto>> promoteMember(
            @PathVariable String id,
            @PathVariable String memberId,
            @AuthenticationPrincipal String userId) {

        ConversationDto dto = chatService.promoteMember(id, userId, memberId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã thăng cấp thành Admin"));
    }

    /** DELETE /api/conversations/{id}/members/{memberId}/promote — demote from admin */
    @DeleteMapping("/{id}/members/{memberId}/promote")
    public ResponseEntity<ApiResponse<ConversationDto>> demoteMember(
            @PathVariable String id,
            @PathVariable String memberId,
            @AuthenticationPrincipal String userId) {

        ConversationDto dto = chatService.demoteMember(id, userId, memberId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Đã gỡ quyền Admin"));
    }

    /** POST /api/conversations/{id}/calls — initiate call */
    @PostMapping("/{id}/calls")
    public ResponseEntity<ApiResponse<CallDto>> initiateCall(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, String> req) {

        String calleeId = req.get("calleeId");
        String callType = req.getOrDefault("callType", "VOICE");
        CallDto dto = chatService.initiateCall(id, userId, calleeId, callType);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Cuộc gọi đã bắt đầu"));
    }

    /** PUT /api/calls/{callId} — update call status */
    @PutMapping("/calls/{callId}")
    public ResponseEntity<ApiResponse<CallDto>> updateCallStatus(
            @PathVariable String callId,
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, String> req) {

        String status = req.get("status");
        CallDto dto = chatService.updateCallStatus(callId, status, userId);
        return ResponseEntity.ok(ApiResponse.success(dto, "Trạng thái cuộc gọi đã cập nhật"));
    }

    /** GET /api/conversations/{id}/calls — get call history */
    @GetMapping("/{id}/calls")
    public ResponseEntity<ApiResponse<Page<CallDto>>> getCallHistory(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                chatService.getCallHistory(id, userId, page, size), "OK"));
    }
}
