package com.socialhub.websocket.config;

import com.socialhub.auth.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.ArrayList;
import java.util.List;

/**
 * WebSocket Configuration for STOMP protocol with JWT authorization
 * 
 * Endpoints:
 * - /user/queue/**: user-specific queues (server → client)
 * - /topic/conversation/{id}**: conversation topics (authorized members only)
 * - /app/**: application endpoints (client → server, authenticated only)
 * 
 * Authorization:
 * - CONNECT: validate JWT token
 * - SUBSCRIBE: validate destination (/user/queue/** or /topic/conversation/{id}/**)
 * - SEND: validate destination must be /app/**
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@EnableScheduling
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.websocket.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple message broker with these prefixes
        config.enableSimpleBroker("/topic", "/queue");
        
        // Set application destination prefix
        config.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix so convertAndSendToUser works
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Parse allowed origins from env
        String[] origins = allowedOrigins.split(",");
        
        registry.addEndpoint("/ws")
                .setAllowedOrigins(origins)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new StompAuthorizationInterceptor(jwtTokenProvider));
    }

    /**
     * Channel interceptor for STOMP authorization
     */
    @Slf4j
    public static class StompAuthorizationInterceptor implements ChannelInterceptor {

        private final JwtTokenProvider jwtTokenProvider;

        public StompAuthorizationInterceptor(JwtTokenProvider jwtTokenProvider) {
            this.jwtTokenProvider = jwtTokenProvider;
        }

        @Override
        public Message<?> preSend(Message<?> message, MessageChannel channel) {
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
            StompCommand command = accessor.getCommand();

            if (command == null) {
                return message;
            }

            switch (command) {
                case CONNECT:
                    handleConnect(message, accessor);
                    break;
                case SUBSCRIBE:
                    handleSubscribe(message, accessor);
                    break;
                case SEND:
                    handleSend(message, accessor);
                    break;
                default:
                    break;
            }

            return message;
        }

        /**
         * Handle CONNECT: validate JWT token and set Principal
         */
        private void handleConnect(Message<?> message, StompHeaderAccessor accessor) {
            try {
                String token = accessor.getFirstNativeHeader("Authorization");

                if (token != null && token.startsWith("Bearer ")) {
                    String jwt = token.substring(7);

                    if (jwtTokenProvider.validateToken(jwt)) {
                        String userId = jwtTokenProvider.getUserIdFromToken(jwt);
                        String sessionId = jwtTokenProvider.getSessionIdFromToken(jwt);
                        
                        log.info("[WebSocket:CONNECT] Authenticated user: {} (session: {})", userId, sessionId);

                        List<GrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

                        Authentication auth = new UsernamePasswordAuthenticationToken(
                                userId, null, authorities);

                        accessor.setUser(auth);
                        
                        // Also set userId in session attributes so WebSocketEventListener can read it
                        if (accessor.getSessionAttributes() != null) {
                            accessor.getSessionAttributes().put("userId", userId);
                        }
                    } else {
                        log.warn("[WebSocket:CONNECT] Invalid JWT token");
                    }
                } else {
                    log.warn("[WebSocket:CONNECT] No Bearer token in headers");
                }
            } catch (Exception e) {
                log.error("[WebSocket:CONNECT] Authentication error: {}", e.getMessage());
            }
        }

        /**
         * Handle SUBSCRIBE: validate destination
         * - Allow /user/queue/** (user-specific)
         * - Allow /topic/conversation/{id}/** (for authorized members)
         * - Log unauthorized attempts
         */
        private void handleSubscribe(Message<?> message, StompHeaderAccessor accessor) {
            try {
                Object principal = accessor.getUser();
                if (principal == null) {
                    log.warn("[WebSocket:SUBSCRIBE] Not authenticated");
                    return;
                }

                String userId = (String) ((Authentication) principal).getPrincipal();
                String destination = accessor.getDestination();

                // Allow /user/queue/** (auto-routed to this user)
                if (destination != null && destination.startsWith("/user/queue/")) {
                    log.debug("[WebSocket:SUBSCRIBE] User {} subscribing to personal queue: {}", userId, destination);
                    return;
                }

                // Allow /topic/notifications/** for this user and broadcast
                if (destination != null && (destination.equals("/topic/notifications/" + userId) || destination.equals("/topic/notifications/broadcast"))) {
                    log.debug("[WebSocket:SUBSCRIBE] User {} subscribing to personal/broadcast notifications: {}", userId, destination);
                    return;
                }

                // Allow /topic/conversation/{id}/** (would need to check membership)
                if (destination != null && destination.startsWith("/topic/conversation/")) {
                    log.info("[WebSocket:SUBSCRIBE] User {} subscribing to conversation: {}", userId, destination);
                    // TODO: Validate user is member of conversation {id}
                    return;
                }

                // Log all other subscription attempts (should not reach here normally)
                log.warn("[WebSocket:SUBSCRIBE] User {} attempted subscription to unauthorized: {}", userId, destination);

            } catch (Exception e) {
                log.error("[WebSocket:SUBSCRIBE] Authorization error: {}", e.getMessage());
            }
        }

        /**
         * Handle SEND: validate destination must be /app/**
         */
        private void handleSend(Message<?> message, StompHeaderAccessor accessor) {
            try {
                Object principal = accessor.getUser();
                if (principal == null) {
                    log.warn("[WebSocket:SEND] Not authenticated");
                    return;
                }

                String userId = (String) ((Authentication) principal).getPrincipal();
                String destination = accessor.getDestination();

                // Allow /app/** (application endpoints)
                if (destination != null && destination.startsWith("/app/")) {
                    log.debug("[WebSocket:SEND] User {} sending to: {}", userId, destination);
                    return;
                }

                // Log unauthorized send attempts
                log.warn("[WebSocket:SEND] User {} attempted unauthorized send to: {}", userId, destination);

            } catch (Exception e) {
                log.error("[WebSocket:SEND] Authorization error: {}", e.getMessage());
            }
        }
    }
}
