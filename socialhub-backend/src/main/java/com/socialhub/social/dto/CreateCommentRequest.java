package com.socialhub.social.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a comment
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCommentRequest {

    @NotBlank(message = "Content cannot be empty")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String content;

    /**
     * Parent comment ID for replies
     * null = top-level comment
     */
    private String parentCommentId;
}
