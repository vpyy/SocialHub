package com.socialhub.media.service;

import com.socialhub.common.exception.ValidationException;
import com.socialhub.media.dto.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;

/**
 * File storage service
 * - Saves files with UUID names
 * - Generates public URLs
 */
@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    @Value("${file.upload.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    private final FileValidationService fileValidationService;

    public FileStorageService(FileValidationService fileValidationService) {
        this.fileValidationService = fileValidationService;
    }

    /**
     * Save image file
     */
    public FileUploadResponse saveImageFile(MultipartFile file) throws ValidationException, IOException {
        // Validate
        fileValidationService.validateImageFile(file);

        // Store
        return saveFile(file, "images");
    }

    /**
     * Save video file
     */
    public FileUploadResponse saveVideoFile(MultipartFile file) throws ValidationException, IOException {
        fileValidationService.validateVideoFile(file);
        return saveFile(file, "videos");
    }

    /**
     * Save document file
     */
    public FileUploadResponse saveDocumentFile(MultipartFile file) throws ValidationException, IOException {
        fileValidationService.validateDocumentFile(file);
        return saveFile(file, "documents");
    }

    /**
     * Generic file save with type
     */
    private FileUploadResponse saveFile(MultipartFile file, String subdir) throws IOException {
        // Generate UUID filename (discard original to prevent information leak)
        String uuid = UUID.randomUUID().toString();
        String extension = getFileExtension(file.getOriginalFilename());
        String filename = uuid + (extension != null ? extension : "");

        // Create directory if not exists
        Path dirPath = Paths.get(uploadDir, subdir);
        Files.createDirectories(dirPath);

        // Save file
        Path filePath = dirPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath);

        // Get MIME type
        String mimeType = fileValidationService.detectMimeType(file);

        // Generate public URL
        String url = baseUrl + "/" + subdir + "/" + filename;

        log.info("File saved: {} (size: {} bytes, type: {})", filename, file.getSize(), mimeType);

        return FileUploadResponse.builder()
                .id(uuid)
                .url(url)
                .type(mimeType)
                .size(file.getSize())
                .filename(filename)
                .uploadedAt(Instant.now())
                .build();
    }

    /**
     * Delete file
     */
    public void deleteFile(String filename, String subdir) throws IOException {
        Path filePath = Paths.get(uploadDir, subdir, filename);
        if (Files.exists(filePath)) {
            Files.delete(filePath);
            log.info("File deleted: {}", filename);
        }
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return null;
        }
        int lastIndexOfDot = filename.lastIndexOf(".");
        return filename.substring(lastIndexOfDot);
    }
}
