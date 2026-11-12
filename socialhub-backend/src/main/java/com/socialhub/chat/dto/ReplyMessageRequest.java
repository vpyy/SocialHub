package com.socialhub.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReplyMessageRequest {
    @NotBlank
    private String replyToMessageId;
    
    @NotBlank
    private String content;
    
    private String messageType;  // TEXT, IMAGE, VOICE, FILE
    private String mediaUrl;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
}
