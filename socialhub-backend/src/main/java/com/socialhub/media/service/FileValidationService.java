package com.socialhub.media.service;

import com.socialhub.common.exception.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * File validation service for secure uploads
 * - Checks MIME type with magic bytes (Apache Tika)
 * - Validates file size limits
 * - Prevents path traversal attacks
 * - Blocks SVG files (XSS risk)
 */
@Slf4j
@Service
public class FileValidationService {

    private static final Tika tika = new Tika();

    // Allowed MIME types
    private static final Set<String> ALLOWED_IMAGE_MIMES = new HashSet<>(Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif"
    ));

    private static final Set<String> ALLOWED_VIDEO_MIMES = new HashSet<>(Arrays.asList(
            "video/mp4",
            "video/webm",
            "video/quicktime",    // .mov
            "video/x-msvideo"     // .avi
    ));

    // Size limits
    private static final long IMAGE_MAX_SIZE = 10 * 1024 * 1024;  // 10 MB
    private static final long VIDEO_MAX_SIZE = 50 * 1024 * 1024;  // 50 MB
    private static final long DOCUMENT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    /**
     * Validate image file
     */
    public void validateImageFile(MultipartFile file) throws ValidationException {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        // Check original filename for path traversal
        validateFilename(file.getOriginalFilename());

        // Check size
        if (file.getSize() > IMAGE_MAX_SIZE) {
            throw new ValidationException("Image file too large. Maximum size: 10MB");
        }

        // Check MIME type by magic bytes
        validateImageMimeType(file);
    }

    /**
     * Validate video file
     */
    public void validateVideoFile(MultipartFile file) throws ValidationException {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        validateFilename(file.getOriginalFilename());

        if (file.getSize() > VIDEO_MAX_SIZE) {
            throw new ValidationException("Video file too large. Maximum size: 50MB");
        }

        validateVideoMimeType(file);
    }

    /**
     * Validate document file (PDF, etc.)
     */
    public void validateDocumentFile(MultipartFile file) throws ValidationException {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        validateFilename(file.getOriginalFilename());

        if (file.getSize() > DOCUMENT_MAX_SIZE) {
            throw new ValidationException("Document file too large. Maximum size: 5MB");
        }

        // Additional checks can be added for documents
    }

    /**
     * Validate image MIME type using Tika
     */
    private void validateImageMimeType(MultipartFile file) throws ValidationException {
        try {
            String detectedMime = tika.detect(file.getInputStream());

            if (!ALLOWED_IMAGE_MIMES.contains(detectedMime)) {
                log.warn("Invalid image MIME type: {} for file: {}", detectedMime, file.getOriginalFilename());
                throw new ValidationException("Invalid image format. Allowed: JPEG, PNG, WebP, GIF");
            }

            // Block SVG specifically (XSS risk)
            if (detectedMime.equals("image/svg+xml") || file.getOriginalFilename().endsWith(".svg")) {
                log.warn("SVG file upload attempt: {}", file.getOriginalFilename());
                throw new ValidationException("SVG files are not allowed");
            }

        } catch (IOException e) {
            log.error("Error detecting MIME type: {}", e.getMessage());
            throw new ValidationException("Error validating file type");
        }
    }

    /**
     * Validate video MIME type using Tika
     */
    private void validateVideoMimeType(MultipartFile file) throws ValidationException {
        try {
            String detectedMime = tika.detect(file.getInputStream());

            if (!ALLOWED_VIDEO_MIMES.contains(detectedMime)) {
                log.warn("Invalid video MIME type: {} for file: {}", detectedMime, file.getOriginalFilename());
                throw new ValidationException("Invalid video format. Allowed: MP4, WebM, MOV, AVI");
            }

        } catch (IOException e) {
            log.error("Error detecting MIME type: {}", e.getMessage());
            throw new ValidationException("Error validating file type");
        }
    }

    /**
     * Validate filename to prevent path traversal
     */
    private void validateFilename(String filename) throws ValidationException {
        if (filename == null || filename.isEmpty()) {
            throw new ValidationException("Filename cannot be empty");
        }

        // Block path traversal attempts
        if (filename.contains("../") || filename.contains("..\\") || filename.startsWith("/")) {
            log.warn("Path traversal attempt detected: {}", filename);
            throw new ValidationException("Invalid filename");
        }

        // Block absolute paths
        if (filename.matches("^[A-Za-z]:.*")) {
            throw new ValidationException("Invalid filename");
        }
    }

    /**
     * Get MIME type of file
     */
    public String detectMimeType(MultipartFile file) throws IOException {
        return tika.detect(file.getInputStream());
    }
}
