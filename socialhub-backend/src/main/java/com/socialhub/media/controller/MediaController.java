package com.socialhub.media.controller;

import com.socialhub.common.response.ApiResponse;
import com.socialhub.media.dto.FileUploadResponse;
import com.socialhub.media.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Media upload controller
 * - POST /api/media/upload: single file upload
 * - POST /api/media/upload/batch: batch upload
 */
@Slf4j
@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final FileStorageService fileStorageService;

    /**
     * Single file upload (image, video, or document)
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "image") String type,
            Authentication authentication) {

        try {
            String userId = (String) authentication.getPrincipal();
            log.info("Upload request from user {} - file: {}, type: {}", userId, file.getOriginalFilename(), type);

            FileUploadResponse response = switch (type.toLowerCase()) {
                case "image" -> fileStorageService.saveImageFile(file);
                case "video" -> fileStorageService.saveVideoFile(file);
                case "document" -> fileStorageService.saveDocumentFile(file);
                default -> throw new IllegalArgumentException("Invalid file type: " + type);
            };

            return ResponseEntity.ok(ApiResponse.success(response, "File uploaded successfully"));

        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), "/api/media/upload"));
        }
    }

    /**
     * Batch file upload (for chat, carousel, etc.)
     */
    @PostMapping(value = "/upload/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<FileUploadResponse>>> uploadBatch(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "type", defaultValue = "image") String type,
            Authentication authentication) {

        try {
            String userId = (String) authentication.getPrincipal();
            log.info("Batch upload request from user {} - {} files, type: {}", userId, files.length, type);

            if (files.length > 10) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Maximum 10 files per batch", "/api/media/upload/batch"));
            }

            List<FileUploadResponse> responses = new ArrayList<>();

            for (MultipartFile file : files) {
                try {
                    FileUploadResponse response = switch (type.toLowerCase()) {
                        case "image" -> fileStorageService.saveImageFile(file);
                        case "video" -> fileStorageService.saveVideoFile(file);
                        case "document" -> fileStorageService.saveDocumentFile(file);
                        default -> throw new IllegalArgumentException("Invalid file type: " + type);
                    };
                    responses.add(response);
                } catch (Exception e) {
                    log.warn("Failed to upload file {}: {}", file.getOriginalFilename(), e.getMessage());
                    // Continue with other files
                }
            }

            if (responses.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No files uploaded successfully", "/api/media/upload/batch"));
            }

            return ResponseEntity.ok(ApiResponse.success(responses, "Batch upload completed"));

        } catch (Exception e) {
            log.error("Batch upload failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage(), "/api/media/upload/batch"));
        }
    }
}
