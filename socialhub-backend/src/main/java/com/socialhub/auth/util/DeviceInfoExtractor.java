package com.socialhub.auth.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Extracts device information from HTTP request
 */
public class DeviceInfoExtractor {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeviceInfo {
        private String browser;
        private String os;
        private String userAgent;
        private String ip;
    }

    public static DeviceInfo extractDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            userAgent = "Unknown";
        }

        String browser = parseBrowser(userAgent);
        String os = parseOS(userAgent);
        String ip = getClientIp(request);

        return DeviceInfo.builder()
                .browser(browser)
                .os(os)
                .userAgent(userAgent)
                .ip(ip)
                .build();
    }

    private static String parseBrowser(String userAgent) {
        if (userAgent.contains("Chrome")) return "Chrome";
        if (userAgent.contains("Safari") && !userAgent.contains("Chrome")) return "Safari";
        if (userAgent.contains("Firefox")) return "Firefox";
        if (userAgent.contains("Edge")) return "Edge";
        if (userAgent.contains("Opera")) return "Opera";
        return "Unknown";
    }

    private static String parseOS(String userAgent) {
        if (userAgent.contains("Windows")) return "Windows";
        if (userAgent.contains("Mac")) return "macOS";
        if (userAgent.contains("Linux") && !userAgent.contains("Android")) return "Linux";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        return "Unknown";
    }

    private static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) {
            return ip.split(",")[0].trim();
        }
        ip = request.getHeader("X-Real-IP");
        if (ip != null && !ip.isEmpty()) {
            return ip;
        }
        return request.getRemoteAddr();
    }
}
