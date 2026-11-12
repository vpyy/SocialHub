package com.socialhub.call.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IceServerConfig {
    private List<IceServer> iceServers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IceServer {
        private List<String> urls;
        private String username;
        private String credential;
    }
}
