package com.socialhub.notification.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.notification.dto.NotificationDto;
import com.socialhub.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /** GET /api/notifications?page=0&size=20 */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationDto>>> getNotifications(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getNotifications(userId, page, size),
                "OK"));
    }

    /** GET /api/notifications/unread-count */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @RequestHeader("X-User-Id") String userId) {

        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count), "OK"));
    }

    /** PUT /api/notifications/read-all */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(
            @RequestHeader("X-User-Id") String userId) {

        notificationService.markAllRead(userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã đánh dấu tất cả là đã đọc"));
    }

    /** PUT /api/notifications/{id}/read */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markOneRead(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {

        notificationService.markOneRead(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "OK"));
    }
}
