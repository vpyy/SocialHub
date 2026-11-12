package com.socialhub.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Request DTO for creating a new post
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePostRequest {

    @NotBlank(message = "Content cannot be empty")
    @Size(max = 5000, message = "Content must not exceed 5000 characters")
    private String content;

    @Builder.Default
    private List<MediaItemDto> media = new ArrayList<>();

    @Builder.Default
    private List<String> hashtags = new ArrayList<>();

    /**
     * Visibility options: PUBLIC, FOLLOWERS, PRIVATE
     * Default: PUBLIC
     */
    @Builder.Default
    private String visibility = "PUBLIC";

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MediaItemDto {
        private String type;  // IMAGE or VIDEO
        private String url;
    }
}
