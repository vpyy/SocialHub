package com.socialhub.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Refresh Token Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RefreshTokenResponse {
    
    private String accessToken;
    
    private long expiresIn;  // in seconds (1800 = 30 minutes)
    
    private String sessionId;  // optional, mainly for debugging
}
