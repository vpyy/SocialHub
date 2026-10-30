package com.socialhub.recommendation.dto;

import com.socialhub.post.dto.PostResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for popular/trending post in Discovery page
 * Extends PostResponseDto with popularity metrics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PopularPostDto {
    private PostResponseDto post;
    private long totalEngagement; // likeCount + commentCount + shareCount
    private String trend; // "trending" or "popular"
}
