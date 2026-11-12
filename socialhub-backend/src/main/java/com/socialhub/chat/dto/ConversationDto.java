package com.socialhub.chat.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConversationDto {
    private String id;
    private List<ParticipantDto> participants;
    private String lastMessage;
    private Instant lastMessageAt;
    private Instant createdAt;
    private long unreadCount;
    
    // Group chat info
    private boolean isGroup;
    private String groupName;
    private String groupAvatarUrl;
    private List<String> adminIds;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParticipantDto {
        private String userId;
        private String username;
        private String displayName;
        private String avatarUrl;
    }
}
