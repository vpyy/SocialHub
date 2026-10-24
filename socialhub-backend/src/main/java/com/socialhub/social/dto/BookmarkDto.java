package com.socialhub.social.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.socialhub.post.dto.PostDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookmarkDto {
    private String id;
    private String userId;
    private String postId;
    private PostDto post;          // full post embedded for convenience
    private Instant createdAt;
}
