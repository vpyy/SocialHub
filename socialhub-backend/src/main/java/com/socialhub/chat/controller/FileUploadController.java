package com.socialhub.chat.controller;

import com.socialhub.chat.dto.MessageDto;
import com.socialhub.chat.service.FileUploadService;
import com.socialhub.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileUploadService fileUploadService;

    /**
     * Upload file (PDF, DOCX, images, etc.) and send as message
     * POST /api/conversations/{id}/messages/upload
     */
    @PostMapping("/{id}/messages/upload")
    public ResponseEntity<ApiResponse<MessageDto>> uploadFile(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String caption) {

        log.info("File upload request: convId={}, userId={}, filename={}, size={}", 
                 id, userId, file.getOriginalFilename(), file.getSize());

        MessageDto message = fileUploadService.uploadFile(id, userId, file, caption);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, "File uploaded successfully"));
    }

    /**
     * Upload group avatar
     * POST /api/conversations/{id}/avatar
     */
    @PostMapping("/{id}/avatar")
    public ResponseEntity<ApiResponse<String>> uploadGroupAvatar(
            @PathVariable String id,
            @AuthenticationPrincipal String userId,
            @RequestParam("avatar") MultipartFile avatar) {

        log.info("Group avatar upload: convId={}, userId={}, filename={}", 
                 id, userId, avatar.getOriginalFilename());

        String avatarUrl = fileUploadService.uploadGroupAvatar(id, userId, avatar);
        
        return ResponseEntity.ok(ApiResponse.success(avatarUrl, "Avatar uploaded successfully"));
    }
}
