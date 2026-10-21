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
