package com.socialhub.call.controller;

import com.socialhub.call.dto.IceServerConfig;
import com.socialhub.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Controller for WebRTC calling configuration
 * Provides ICE servers config (STUN/TURN) without exposing credentials in frontend
 */
@Slf4j
@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000"
})
public class CallController {

    @Value("${webrtc.stun.urls:stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302}")
    private String stunUrls;

    @Value("${webrtc.turn.urls:}")
    private String turnUrls;

    @Value("${webrtc.turn.username:}")
    private String turnUsername;

    @Value("${webrtc.turn.credential:}")
    private String turnCredential;

    /**
     * GET /api/calls/ice-servers
     * Returns ICE servers configuration for WebRTC
     * Credentials are server-side only (not exposed in frontend code)
     * Public endpoint - no authentication required
     */
    @GetMapping("/ice-servers")
    public ResponseEntity<ApiResponse<IceServerConfig>> getIceServers(Authentication authentication) {
        String userId = authentication != null ? (String) authentication.getPrincipal() : "anonymous";
        log.debug("ICE config requested by user: {}", userId);

        List<IceServerConfig.IceServer> iceServers = new ArrayList<>();

        // Add STUN servers (public, no credentials)
        if (stunUrls != null && !stunUrls.isEmpty()) {
            List<String> stunList = Arrays.asList(stunUrls.split(","));
            iceServers.add(IceServerConfig.IceServer.builder()
                    .urls(stunList)
                    .build());
        }

        // Add TURN servers (if configured with credentials)
        if (turnUrls != null && !turnUrls.isEmpty() && turnUsername != null && !turnUsername.isEmpty()) {
            List<String> turnList = Arrays.asList(turnUrls.split(","));
            iceServers.add(IceServerConfig.IceServer.builder()
                    .urls(turnList)
                    .username(turnUsername)
                    .credential(turnCredential)
                    .build());
        }

        IceServerConfig config = IceServerConfig.builder()
                .iceServers(iceServers)
                .build();

        return ResponseEntity.ok(ApiResponse.success(config, "ICE config retrieved"));
    }
}
