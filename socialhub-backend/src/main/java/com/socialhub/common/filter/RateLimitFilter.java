package com.socialhub.common.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate Limiting Filter using Bucket4j
 * Runs BEFORE JwtAuthenticationFilter
 * 
 * Limits:
 * - /auth/login: 5/minute (by IP)
 * - /auth/register: 5/hour (by IP)
 * - /auth/forgot-password, /auth/resend-verification: 3/hour
 * - /media/upload*: 20/minute
 * 
 * Returns 429 Too Many Requests with Retry-After header
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();
        String key = null;
        Bucket bucket = null;
        String ip = getClientIp(request);

        // Determine rate limit bucket based on endpoint
        if (path.equals("/api/auth/login") && method.equals("POST")) {
            // 5 per minute by IP
            key = "login:" + ip;
            bucket = getOrCreateBucket(key, 5, 60);

        } else if (path.equals("/api/auth/register") && method.equals("POST")) {
            // 5 per hour by IP
            key = "register:" + ip;
            bucket = getOrCreateBucket(key, 5, 3600);

        } else if ((path.equals("/api/auth/forgot-password") || path.equals("/api/auth/resend-verification")) 
                   && method.equals("POST")) {
            // 3 per hour by IP
            key = "password-reset:" + ip;
            bucket = getOrCreateBucket(key, 3, 3600);

        } else if (path.startsWith("/api/media/upload") && method.equals("POST")) {
            // 20 per minute by IP
            key = "upload:" + ip;
            bucket = getOrCreateBucket(key, 20, 60);
        }

        // Check rate limit if applicable
        if (bucket != null) {
            if (!bucket.tryConsume(1)) {
                long secondsToWait = calculateRetryAfter(bucket);

                log.warn("Rate limit exceeded for key: {}, retry-after: {} seconds", key, secondsToWait);
                
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.addHeader("Retry-After", String.valueOf(Math.max(1, secondsToWait)));
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"code\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Get or create bucket with specified capacity and refill duration
     */
    private Bucket getOrCreateBucket(String key, long capacity, int refillSeconds) {
        return buckets.computeIfAbsent(key, k -> {
            Bandwidth limit = Bandwidth.classic(capacity, Refill.intervally(capacity, Duration.ofSeconds(refillSeconds)));
            return Bucket4j.builder()
                    .addLimit(limit)
                    .build();
        });
    }

    /**
     * Calculate retry-after value in seconds
     */
    private long calculateRetryAfter(Bucket bucket) {
        // Simple approximation: 1 second default
        return 1;
    }

    /**
     * Extract client IP from request headers or remote address
     */
    private String getClientIp(HttpServletRequest request) {
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


