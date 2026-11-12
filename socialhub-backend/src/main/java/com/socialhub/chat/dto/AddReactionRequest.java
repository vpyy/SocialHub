package com.socialhub.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddReactionRequest {
    /**
     * Emoji reaction: 👍, ❤️, 😂, 😮, 😢, 😠, v.v.
     * Hoặc custom string
     */
    private String reaction;
}
