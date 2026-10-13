package com.socialhub.health.controller;

import com.socialhub.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Health Check Endpoint
 * 
 * This endpoint provides:
 * - Application status
 * - Database connectivity
 * - System information
 */
@Slf4j
@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Application health check endpoints")
public class HealthController {

    @Autowired(required = false)
    private HealthEndpoint healthEndpoint;

    /**
     * Basic health check
     * 
     * @return Health status with service information
     */
    @GetMapping
    @Operation(summary = "Get application health status", description = "Returns basic health status of the application")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        log.info("Health check requested");
        
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("service", "socialhub-backend");
        healthData.put("version", "1.0.0");
        healthData.put("environment", System.getProperty("spring.profiles.active", "default"));

        try {
            // Check MongoDB connection through Actuator
            if (healthEndpoint != null) {
                var health = healthEndpoint.health();
                healthData.put("database", health.getStatus().toString());
            }
        } catch (Exception e) {
            log.warn("Could not retrieve detailed health information: {}", e.getMessage());
            healthData.put("database", "UNKNOWN");
        }

        return ResponseEntity.ok(ApiResponse.success(healthData, "Application is running"));
    }

    /**
     * Detailed health check with component information
     */
    @GetMapping("/detailed")
    @Operation(summary = "Get detailed health status", description = "Returns detailed health status including all components")
    public ResponseEntity<ApiResponse<Object>> healthDetailed() {
        log.info("Detailed health check requested");
        
        if (healthEndpoint != null) {
            try {
                var health = healthEndpoint.health();
                return ResponseEntity.ok(ApiResponse.success(health, "Detailed health information retrieved"));
            } catch (Exception e) {
                log.error("Error retrieving detailed health: {}", e.getMessage());
                return ResponseEntity.ok(ApiResponse.success(
                    Map.of("status", "UNKNOWN", "error", e.getMessage()),
                    "Could not retrieve detailed health"
                ));
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(
            Map.of("status", "UP", "service", "socialhub-backend"),
            "Health check completed"
        ));
    }

    /**
     * Database connectivity check
     */
    @GetMapping("/db")
    @Operation(summary = "Check database connectivity", description = "Verifies connection to MongoDB")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dbHealth() {
        log.info("Database health check requested");
        
        Map<String, Object> dbStatus = new HashMap<>();
        
        if (healthEndpoint != null) {
            try {
                var health = healthEndpoint.health();
                dbStatus.put("status", health.getStatus().toString());
                dbStatus.put("database", "MongoDB");
                dbStatus.put("connection", "OK");
                return ResponseEntity.ok(ApiResponse.success(dbStatus, "Database is connected"));
            } catch (Exception e) {
                log.error("Database health check failed: {}", e.getMessage());
                dbStatus.put("status", "DOWN");
                dbStatus.put("database", "MongoDB");
                dbStatus.put("error", e.getMessage());
                return ResponseEntity.status(503).body(ApiResponse.success(dbStatus, "Database connection failed"));
            }
        }

        dbStatus.put("status", "UNKNOWN");
        dbStatus.put("database", "MongoDB");
        return ResponseEntity.ok(ApiResponse.success(dbStatus, "Database status unknown"));
    }
}
