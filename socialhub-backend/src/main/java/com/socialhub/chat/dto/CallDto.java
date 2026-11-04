package com.socialhub.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallDto {
    private String id;
    private String conversationId;
    private String callerId;
    private String calleeId;
    private String status;
    private Instant startedAt;
    private Instant answeredAt;
    private Instant endedAt;
    private Long duration;
    private String callType;  // VOICE, VIDEO
    private Instant createdAt;
    
    // Caller info
    private String callerUsername;
    private String callerDisplayName;
    private String callerAvatarUrl;
    
    // Callee info
    private String calleeUsername;
    private String calleeDisplayName;
    private String calleeAvatarUrl;
}
