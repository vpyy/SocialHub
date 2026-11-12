package com.socialhub.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for typing indicator events
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TypingEvent {
    private String conversationId;
    private String userId;
    private boolean typing;
}
