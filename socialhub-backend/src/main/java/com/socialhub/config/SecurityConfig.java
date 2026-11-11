package com.socialhub.config;

import com.socialhub.auth.filter.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Spring Security Configuration
 * - JWT-based stateless authentication
 * - CORS enabled for frontend development (localhost:5173)
 * - Exempts public endpoints: auth, health, WebSocket, ICE servers
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Security filter chain configuration
     */
    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {
        http
            // CORS configuration
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // CSRF disabled for stateless API (using JWT)
            .csrf(csrf -> csrf.disable())
            
            // Stateless session (no server-side session)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Authorization rules
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                
                // WebSocket endpoint - exempted from JWT (handled by WebSocketConfig)
                .requestMatchers("/ws", "/ws/**").permitAll()
                
                // Public API endpoints - auth
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/verify-email").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/resend-verification").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/forgot-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/reset-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/oauth/google").permitAll()
                
                // Public call endpoints
                .requestMatchers(HttpMethod.GET, "/api/calls/ice-servers").permitAll()

                // Public read-only endpoints
                .requestMatchers(HttpMethod.GET, "/api/posts/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*/liked-posts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*/reposts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*/followers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/users/*/following").permitAll()
                
                // Public media files (uploaded content)
                .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                // Dev seed endpoints (remove in production)
                .requestMatchers("/api/dev/**").permitAll()

                // All other requests require authentication
                .anyRequest().authenticated()
            )
            
            // HTTP Basic disabled (using JWT instead)
            .httpBasic(basic -> basic.disable())
            
            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            
            // Exception handling
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(401);
                    response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized - Invalid or missing JWT token\",\"errorCode\":\"UNAUTHORIZED\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setContentType("application/json");
                    response.setStatus(403);
                    response.getWriter().write("{\"success\":false,\"message\":\"Access Denied\",\"errorCode\":\"FORBIDDEN\"}");
                })
            );

        return http.build();
    }

    /**
     * CORS Configuration
     * Allows requests from Vite dev server and localhost variants
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));
        configuration.setAllowedHeaders(Arrays.asList(
            "Content-Type", "Authorization", "X-Requested-With"
        ));
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization", "Content-Type"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Password Encoder Bean
     * Using BCrypt for secure password hashing
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
