package com.socialhub.post.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating an existing post
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePostRequest {

    @Size(max = 5000, message = "Content must not exceed 5000 characters")
    private String content;

    private List<CreatePostRequest.MediaItemDto> media;

    private List<String> hashtags;

    /**
     * Visibility options: PUBLIC, FOLLOWERS, PRIVATE
     */
    private String visibility;
}
