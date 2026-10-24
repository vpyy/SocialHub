package com.socialhub.social.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.social.dto.BookmarkDto;
import com.socialhub.social.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    /** POST /api/posts/{id}/bookmark — toggle */
    @PostMapping("/api/posts/{id}/bookmark")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleBookmark(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {

        Map<String, Object> result = bookmarkService.toggleBookmark(id, userId);
        boolean bookmarked = (boolean) result.get("bookmarked");
        return ResponseEntity.ok(ApiResponse.success(result,
                bookmarked ? "Đã lưu bài viết" : "Đã bỏ lưu bài viết"));
    }

    /** GET /api/bookmarks?page=0&size=20 */
    @GetMapping("/api/bookmarks")
    public ResponseEntity<ApiResponse<Page<BookmarkDto>>> getBookmarks(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ApiResponse.success(
                bookmarkService.getUserBookmarks(userId, page, size), "OK"));
    }
}
