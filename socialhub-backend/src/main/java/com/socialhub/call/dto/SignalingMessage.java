package com.socialhub.call.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebRTC Signaling Message
 * Used for SDP offer/answer and ICE candidate exchange
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignalingMessage {
    
    /**
     * Message types:
     * - offer: SDP offer from caller
     * - answer: SDP answer from callee
     * - ice-candidate: ICE candidate for connection
     */
    private String type;
    
    /**
     * Call ID to identify the call session
     */
    private String callId;
    
    /**
     * Sender user ID
     */
    private String from;
    
    /**
     * Recipient user ID
     */
    private String to;
    
    /**
     * SDP payload for offer/answer
     */
    private SdpPayload sdp;
    
    /**
     * ICE candidate payload
     */
    private IceCandidatePayload candidate;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SdpPayload {
        private String type;  // "offer" or "answer"
        private String sdp;   // SDP string
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IceCandidatePayload {
        private String candidate;
        private String sdpMid;
        private Integer sdpMLineIndex;
    }
}
