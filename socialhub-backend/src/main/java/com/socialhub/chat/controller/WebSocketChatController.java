package com.socialhub.chat.controller;

import com.socialhub.chat.dto.PresenceEvent;
import com.socialhub.chat.dto.TypingEvent;
import com.socialhub.chat.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

/**
 * WebSocket Controller for real-time chat features
 * Handles typing indicators and presence broadcasts
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;
    
    /**
     * Handle typing indicator
     * Client sends to: /app/chat/typing
     * Server broadcasts to: /topic/conversation/{conversationId}/typing
     */
    @MessageMapping("/chat/typing")
    public void handleTyping(@Payload TypingEvent event, Principal principal) {
        String userId = principal.getName();
        
        log.debug("Typing event from user {}: conversationId={}, typing={}", 
                userId, event.getConversationId(), event.isTyping());
        
        // Set userId from authenticated principal
        event.setUserId(userId);
        
        // Broadcast to conversation topic
        messagingTemplate.convertAndSend(
                "/topic/conversation/" + event.getConversationId() + "/typing",
                event
        );
    }
    
    /**
     * Request presence status for specific users
     * Client sends to: /app/users/presence
     * Server responds to: /user/queue/presence (personal queue)
     */
    @MessageMapping("/users/presence")
    public void requestPresence(@Payload List<String> userIds, Principal principal) {
        String requesterId = principal.getName();
        
        log.debug("Presence request from user {}: requesting {} users", requesterId, userIds.size());
        
        // Get presence status for requested users
        List<PresenceEvent> presenceList = presenceService.getPresenceStatus(userIds);
        
        // Send back to requester's personal queue
        messagingTemplate.convertAndSendToUser(
                requesterId,
                "/queue/presence",
                presenceList
        );
    }
}
