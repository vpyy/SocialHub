package com.socialhub.dev;

import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Data initializer for development
 * Creates test users if they don't exist
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        createTestUserIfNotExists();
    }

    private void createTestUserIfNotExists() {
        String testUserId = "temp-user-id";
        
        if (!userRepository.existsById(testUserId)) {
            User testUser = User.builder()
                    .id(testUserId)
                    .username("testuser")
                    .email("test@socialhub.com")
                    .displayName("Test User")
                    .avatarUrl("https://via.placeholder.com/100")
                    .bio("This is a test user for development")
                    .role("USER")
                    .status("ACTIVE")
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            
            userRepository.save(testUser);
            log.info("✅ Test user created: {} (ID: {})", testUser.getUsername(), testUser.getId());
        } else {
            log.info("✅ Test user already exists (ID: {})", testUserId);
        }
    }
}
