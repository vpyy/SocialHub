package com.socialhub.chat.dto;

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
public class MessageDto {
    private String id;
    private String conversationId;

    // sender info
    private String senderId;
    private String senderUsername;
    private String senderDisplayName;
    private String senderAvatarUrl;

    private String content;
    /** TEXT | IMAGE | VIDEO | POST | VOICE */
    private String messageType;
    private String mediaUrl;
    private String sharedPostId;
    private PostDto sharedPost;      // embedded when messageType=POST

    private boolean isRead;
    private Instant createdAt;
    private Instant editedAt;  // Thời gian sửa lần cuối
    
    /** Reactions: {userId: reactionType} */
    private java.util.Map<String, String> reactions;
    
    // Voice message
    private String voiceUrl;
    private Long voiceDuration;  // ms
    
    // Reply feature
    private String replyToMessageId;
    private MessageDto replyToMessage;  // embedded original message
    
    // Pin feature
    private boolean isPinned;
    
    // Delete for everyone
    private boolean isDeletedForEveryone;
    
    // File upload
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    
    // Link preview
    private String linkPreviewUrl;
    private String linkPreviewTitle;
    private String linkPreviewDescription;
    private String linkPreviewImage;
}
