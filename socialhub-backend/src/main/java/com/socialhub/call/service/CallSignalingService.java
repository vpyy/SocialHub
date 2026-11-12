package com.socialhub.call.service;

import com.socialhub.call.dto.SignalingMessage;
import com.socialhub.chat.document.Call;
import com.socialhub.chat.repository.CallRepository;
import com.socialhub.common.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Service for WebRTC signaling via WebSocket
 * Routes SDP offers/answers and ICE candidates between call participants
 * 
 * Server sends messages to: /user/queue/call
 * Message types: incoming, offer, answer, ice-candidate, accepted, rejected, ended, busy, missed
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CallSignalingService {

    private final SimpMessagingTemplate messagingTemplate;
    private final CallRepository callRepository;

    /**
     * Handle SDP offer from caller
     */
    public void handleOffer(String callId, String senderId, SignalingMessage.SdpPayload sdp) {
        validateAndRoute(callId, senderId, "offer", sdp, null);
    }

    /**
     * Handle SDP answer from callee
     */
    public void handleAnswer(String callId, String senderId, SignalingMessage.SdpPayload sdp) {
        validateAndRoute(callId, senderId, "answer", sdp, null);
    }

    /**
     * Handle ICE candidate from either party
     */
    public void handleIceCandidate(String callId, String senderId, SignalingMessage.IceCandidatePayload candidate) {
        validateAndRoute(callId, senderId, "ice-candidate", null, candidate);
    }

    /**
     * Validate call and route signaling message to recipient
     */
    private void validateAndRoute(String callId, String senderId, String messageType,
                                   SignalingMessage.SdpPayload sdp,
                                   SignalingMessage.IceCandidatePayload candidate) {
        // Validate call exists
        Optional<Call> callOpt = callRepository.findById(callId);
        if (callOpt.isEmpty()) {
            log.warn("Signaling for non-existent call: {}", callId);
            throw new ValidationException("Call not found");
        }

        Call call = callOpt.get();

        // Validate sender is part of this call
        if (!call.getCallerId().equals(senderId) && !call.getCalleeId().equals(senderId)) {
            log.warn("User {} attempted signaling for call {} they're not part of", senderId, callId);
            throw new ValidationException("Unauthorized signaling");
        }

        // Determine recipient (the other party)
        String recipientId = call.getCallerId().equals(senderId) 
                ? call.getCalleeId() 
                : call.getCallerId();

        // Check if call is in valid state for signaling
        String status = call.getStatus();
        if (!"RINGING".equals(status) && !"ACTIVE".equals(status) && !"CONNECTING".equals(status)
                && !"ACCEPTED".equals(status) && !"INITIATED".equals(status)) {
            log.warn("Signaling for call in invalid state: {}", status);
            return; // Silently ignore, call may have ended
        }

        // Update call status if transitioning (first offer/answer)
        if (("RINGING".equals(status) || "ACCEPTED".equals(status) || "INITIATED".equals(status))
                && ("offer".equals(messageType) || "answer".equals(messageType))) {
            call.setStatus("CONNECTING");
            callRepository.save(call);
            log.info("Call {} transitioned to CONNECTING", callId);
        }

        // Build message payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", messageType);
        payload.put("callId", callId);
        payload.put("from", senderId);

        if (sdp != null) {
            payload.put("sdp", Map.of("type", sdp.getType(), "sdp", sdp.getSdp()));
        }

        if (candidate != null) {
            Map<String, Object> candidateMap = new HashMap<>();
            candidateMap.put("candidate", candidate.getCandidate());
            candidateMap.put("sdpMid", candidate.getSdpMid());
            candidateMap.put("sdpMLineIndex", candidate.getSdpMLineIndex());
            payload.put("candidate", candidateMap);
        }

        // Route message to recipient via WebSocket
        messagingTemplate.convertAndSendToUser(recipientId, "/queue/call", payload);

        log.debug("Routed {} signal from {} to {} for call {}", 
                messageType, senderId, recipientId, callId);
    }

    /**
     * Send call notification to recipient
     * Types: incoming, accepted, rejected, ended, busy, missed
     */
    public void sendCallNotification(String recipientId, String type, Map<String, Object> callData) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.putAll(callData);

        messagingTemplate.convertAndSendToUser(recipientId, "/queue/call", payload);
        log.debug("Sent call notification: {} to user: {}", type, recipientId);
    }

    /**
     * Update call status when WebRTC connection established
     */
    public void onConnectionEstablished(String callId) {
        Optional<Call> callOpt = callRepository.findById(callId);
        if (callOpt.isEmpty()) {
            return;
        }

        Call call = callOpt.get();
        if ("CONNECTING".equals(call.getStatus())) {
            call.setStatus("ACTIVE");
            // Use answeredAt to mark when WebRTC connection established
            if (call.getAnsweredAt() == null) {
                call.setAnsweredAt(Instant.now());
            }
            callRepository.save(call);
            log.info("Call {} is now ACTIVE (WebRTC connected)", callId);
        }
    }

    /**
     * Update call status when WebRTC connection fails
     */
    public void onConnectionFailed(String callId) {
        Optional<Call> callOpt = callRepository.findById(callId);
        if (callOpt.isEmpty()) {
            return;
        }

        Call call = callOpt.get();
        if ("CONNECTING".equals(call.getStatus()) || "ACTIVE".equals(call.getStatus())) {
            call.setStatus("FAILED");
            call.setEndedAt(Instant.now());
            callRepository.save(call);
            log.info("Call {} FAILED (WebRTC connection issue)", callId);
        }
    }
}
