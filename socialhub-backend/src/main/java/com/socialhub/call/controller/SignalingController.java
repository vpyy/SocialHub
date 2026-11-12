package com.socialhub.call.controller;

import com.socialhub.call.dto.SignalingMessage;
import com.socialhub.call.service.CallSignalingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

/**
 * WebSocket STOMP controller for WebRTC signaling
 * Handles SDP offer/answer and ICE candidate exchange
 * 
 * Client sends to:
 * - /app/call/{callId}/offer
 * - /app/call/{callId}/answer
 * - /app/call/{callId}/ice-candidate
 * 
 * Server sends to: /user/queue/call
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class SignalingController {

    private final CallSignalingService signalingService;

    /**
     * Handle SDP offer from caller
     * Client sends to: /app/call/{callId}/offer
     */
    @MessageMapping("/call/{callId}/offer")
    public void handleOffer(
            @DestinationVariable String callId,
            @Payload SignalingMessage.SdpPayload sdp,
            SimpMessageHeaderAccessor headerAccessor) {

        String senderId = extractUserId(headerAccessor);
        
        if (senderId == null) {
            log.warn("Offer from unauthenticated session");
            return;
        }

        log.debug("Received offer for call: {} from user: {}", callId, senderId);
        signalingService.handleOffer(callId, senderId, sdp);
    }

    /**
     * Handle SDP answer from callee
     * Client sends to: /app/call/{callId}/answer
     */
    @MessageMapping("/call/{callId}/answer")
    public void handleAnswer(
            @DestinationVariable String callId,
            @Payload SignalingMessage.SdpPayload sdp,
            SimpMessageHeaderAccessor headerAccessor) {

        String senderId = extractUserId(headerAccessor);
        
        if (senderId == null) {
            log.warn("Answer from unauthenticated session");
            return;
        }

        log.debug("Received answer for call: {} from user: {}", callId, senderId);
        signalingService.handleAnswer(callId, senderId, sdp);
    }

    /**
     * Handle ICE candidate
     * Client sends to: /app/call/{callId}/ice-candidate
     */
    @MessageMapping("/call/{callId}/ice-candidate")
    public void handleIceCandidate(
            @DestinationVariable String callId,
            @Payload SignalingMessage.IceCandidatePayload candidate,
            SimpMessageHeaderAccessor headerAccessor) {

        String senderId = extractUserId(headerAccessor);
        
        if (senderId == null) {
            log.warn("ICE candidate from unauthenticated session");
            return;
        }

        log.debug("Received ICE candidate for call: {} from user: {}", callId, senderId);
        signalingService.handleIceCandidate(callId, senderId, candidate);
    }

    /**
     * Extract user ID from STOMP header accessor.
     * WebSocketConfig sets the principal via accessor.setUser(auth) where auth is a
     * UsernamePasswordAuthenticationToken whose principal is the userId string.
     */
    private String extractUserId(SimpMessageHeaderAccessor headerAccessor) {
        try {
            java.security.Principal principal = headerAccessor.getUser();
            if (principal instanceof Authentication auth) {
                Object p = auth.getPrincipal();
                if (p instanceof String) {
                    return (String) p;
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract userId from header: {}", e.getMessage());
        }
        return null;
    }
}
