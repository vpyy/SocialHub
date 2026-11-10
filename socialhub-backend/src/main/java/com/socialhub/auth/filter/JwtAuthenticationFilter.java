package com.socialhub.auth.filter;

import com.socialhub.auth.service.RefreshTokenService;
import com.socialhub.auth.util.JwtTokenProvider;
import com.socialhub.common.exception.TokenException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter
 * 
 * Intercepts requests and validates JWT tokens + sessions
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        try {
            String token = extractTokenFromRequest(request);
            
            if (token != null && jwtTokenProvider.validateToken(token)) {
                String userId = jwtTokenProvider.getUserIdFromToken(token);
                String username = jwtTokenProvider.getUsernameFromToken(token);
                String sessionId = jwtTokenProvider.getSessionIdFromToken(token);
                
                // Validate session if sessionId is present
                if (sessionId != null) {
                    try {
                        refreshTokenService.validateSession(sessionId);
                    } catch (TokenException e) {
                        log.warn("Session validation failed for sessionId: {} — {}", sessionId, e.getCode());
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"success\":false,\"code\":\"" + e.getCode() + "\",\"message\":\"" + e.getMessage() + "\"}");
                        return;
                    }
                }
                
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        null
                    );
                
                // Store sessionId in request attributes for later use
                request.setAttribute("sessionId", sessionId);
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Set Security Context for user: {} with session: {}", username, sessionId);
            }
        } catch (Exception e) {
            log.error("Failed to set user authentication: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Extract JWT token from Authorization header
     */
    private String extractTokenFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        
        return null;
    }
}
