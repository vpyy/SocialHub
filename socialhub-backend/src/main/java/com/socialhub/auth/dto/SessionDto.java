package com.socialhub.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionDto {

    private String sessionId;
    private String browser;
    private String os;
    private String ip;
    
    private Instant createdAt;
    private Instant lastUsedAt;
    
    @JsonProperty("isCurrent")
    private Boolean isCurrent;
}
