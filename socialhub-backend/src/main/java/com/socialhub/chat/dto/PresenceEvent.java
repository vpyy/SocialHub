package com.socialhub.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for user presence events (online/offline status)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PresenceEvent {
    private String userId;
    private boolean online;
    private Instant lastSeenAt;
}
