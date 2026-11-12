package com.socialhub.media.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileUploadResponse {
    private String id;           // MongoDB ObjectId
    private String url;          // Public URL to access file
    private String type;         // MIME type (image/jpeg, video/mp4, etc.)
    private long size;           // File size in bytes
    private String filename;     // UUID-based filename stored
    private Instant uploadedAt;
}
