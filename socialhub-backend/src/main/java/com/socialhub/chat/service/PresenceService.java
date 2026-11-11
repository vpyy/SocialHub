package com.socialhub.chat.service;

import com.socialhub.chat.dto.PresenceEvent;
import com.socialhub.chat.repository.ConversationRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-memory presence management service
 * Tracks online/offline status based on WebSocket session count
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {
    
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    // In-memory storage: userId -> session count
    private final Map<String, Integer> userSessionCounts = new ConcurrentHashMap<>();
    
    // Track userId -> Set of sessionIds for cleanup
    private final Map<String, Set<String>> userSessions = new ConcurrentHashMap<>();
    
    /**
     * User connected via WebSocket
     */
    public void userConnected(String userId, String sessionId) {
        log.info("User connected: userId={}, sessionId={}", userId, sessionId);
        
        // Track session
        userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        
        // Increment session count
        int count = userSessionCounts.merge(userId, 1, Integer::sum);
        
        // If this is the first session, user is now online
        if (count == 1) {
            broadcastPresenceToConversationMembers(userId, true, null);
        }
    }
    
    /**
     * User disconnected from WebSocket
     */
    public void userDisconnected(String userId, String sessionId) {
        log.info("User disconnected: userId={}, sessionId={}", userId, sessionId);
        
        // Remove session
        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        }
        
        // Decrement session count
        Integer count = userSessionCounts.get(userId);
        if (count != null && count > 0) {
            count = count - 1;
            if (count == 0) {
                userSessionCounts.remove(userId);
                // User is now offline, update lastSeenAt
                Instant lastSeenAt = Instant.now();
                updateUserLastSeen(userId, lastSeenAt);
                broadcastPresenceToConversationMembers(userId, false, lastSeenAt);
            } else {
                userSessionCounts.put(userId, count);
            }
        }
    }
    
    /**
     * Check if user is currently online
     */
    public boolean isUserOnline(String userId) {
        Integer count = userSessionCounts.get(userId);
        return count != null && count > 0;
    }
    
    /**
     * Get presence status for multiple users
     */
    public List<PresenceEvent> getPresenceStatus(List<String> userIds) {
        return userIds.stream()
                .map(userId -> {
                    boolean online = isUserOnline(userId);
                    Instant lastSeen = online ? null : getUserLastSeen(userId);
                    return PresenceEvent.builder()
                            .userId(userId)
                            .online(online)
                            .lastSeenAt(lastSeen)
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Broadcast presence only to users who share conversations
     * This optimizes bandwidth by avoiding system-wide broadcasts
     */
    private void broadcastPresenceToConversationMembers(String userId, boolean online, Instant lastSeenAt) {
        try {
            // Get all conversations the user is part of
            List<String> conversationIds = conversationRepository
                    .findAllByParticipantIdsContaining(userId)
                    .stream()
                    .map(c -> c.getId())
                    .toList();
            
            // Get all unique participant IDs from these conversations
            Set<String> notifyUserIds = new HashSet<>();
            for (String convId : conversationIds) {
                conversationRepository.findById(convId).ifPresent(conv -> {
                    notifyUserIds.addAll(conv.getParticipantIds());
                });
            }
            
            // Remove the user themselves
            notifyUserIds.remove(userId);
            
            // Send presence event to each user via their personal queue
            PresenceEvent event = PresenceEvent.builder()
                    .userId(userId)
                    .online(online)
                    .lastSeenAt(lastSeenAt)
                    .build();
            
            for (String targetUserId : notifyUserIds) {
                messagingTemplate.convertAndSendToUser(
                        targetUserId,
                        "/queue/presence",
                        event
                );
            }
            
            log.info("Broadcasted presence for user {} to {} conversation members", 
                    userId, notifyUserIds.size());
            
        } catch (Exception e) {
            log.error("Error broadcasting presence for user {}", userId, e);
        }
    }
    
    /**
     * Update user's lastSeenAt in database
     */
    private void updateUserLastSeen(String userId, Instant lastSeenAt) {
        try {
            userRepository.findById(userId).ifPresent(user -> {
                user.setLastSeenAt(lastSeenAt);
                userRepository.save(user);
                log.debug("Updated lastSeenAt for user {}", userId);
            });
        } catch (Exception e) {
            log.error("Error updating lastSeenAt for user {}", userId, e);
        }
    }
    
    /**
     * Get user's last seen time from database
     */
    private Instant getUserLastSeen(String userId) {
        return userRepository.findById(userId)
                .map(User::getLastSeenAt)
                .orElse(null);
    }
}
