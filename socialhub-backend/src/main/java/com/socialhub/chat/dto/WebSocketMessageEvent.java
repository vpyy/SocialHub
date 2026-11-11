package com.socialhub.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * WebSocket message event wrapper
 * Supports different event types: message:new, edited, deleted, unsent, reaction, pinned, read
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebSocketMessageEvent {
    
    public enum EventType {
        MESSAGE_NEW("message:new"),
        MESSAGE_EDITED("edited"),
        MESSAGE_DELETED("deleted"),
        MESSAGE_UNSENT("unsent"),
        MESSAGE_REACTION("reaction"),
        MESSAGE_PINNED("pinned"),
        MESSAGE_READ("read");
        
        private final String value;
        
        EventType(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    private String type; // Event type
    private String conversationId;
    private MessageDto message; // For new/edited messages
    private String messageId; // For deleted/unsent/reaction/pinned events
    private Map<String, Object> data; // Additional event data
    private Instant timestamp;
}
