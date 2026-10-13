package com.socialhub.user.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.CreateUserDto;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * User Service
 * 
 * Handles business logic for user operations:
 * - User creation and registration
 * - User profile retrieval
 * - Data validation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Create a new user (registration)
     */
    public UserDto createUser(CreateUserDto createUserDto) {
        log.info("Creating new user with email: {}", createUserDto.getEmail());
        
        // Validate email uniqueness
        if (userRepository.existsByEmailIgnoreCase(createUserDto.getEmail())) {
            throw new ValidationException("Email already exists");
        }
        
        // Auto-generate username from displayName
        String baseUsername = generateUsernameFromDisplayName(createUserDto.getDisplayName());
        String username = baseUsername;
        int counter = 1;
        
        // Ensure username is unique by adding suffix if needed
        while (userRepository.existsByUsernameIgnoreCase(username)) {
            username = baseUsername + counter;
            counter++;
        }
        
        log.info("Generated username: {} for displayName: {}", username, createUserDto.getDisplayName());
        
        // Create new user
        User user = User.builder()
            .username(username)
            .email(createUserDto.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(createUserDto.getPassword()))
            .displayName(createUserDto.getDisplayName())
            .bio(createUserDto.getBio() != null ? createUserDto.getBio() : "")
            .isActive(true)
            .isVerified(false)
            .followerCount(0)
            .followingCount(0)
            .postsCount(0)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
        
        User savedUser = userRepository.save(user);
        log.info("User created successfully with id: {} and username: {}", savedUser.getId(), savedUser.getUsername());
        
        return convertToDto(savedUser);
    }
    
    /**
     * Generate username from displayName
     * Converts "Hoàng Minh" to "hoang-minh"
     */
    private String generateUsernameFromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return "user";
        }
        
        return displayName
            .toLowerCase()
            .trim()
            // Remove Vietnamese diacritics (ă, â, ê, ô, ơ, ư, etc.)
            .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
            .replaceAll("[èéẹẻẽêềếệểễ]", "e")
            .replaceAll("[ìíịỉĩ]", "i")
            .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
            .replaceAll("[ùúụủũưừứựửữ]", "u")
            .replaceAll("[ỳýỵỷỹ]", "y")
            .replaceAll("[đ]", "d")
            // Replace spaces and special chars with dash
            .replaceAll("[^a-z0-9]+", "-")
            // Remove leading/trailing dashes
            .replaceAll("^-+|-+$", "")
            // Limit to 50 chars
            .substring(0, Math.min(50, displayName.length()));
    }
    
    /**
     * Get user by ID
     */
    public UserDto getUserById(String id) {
        log.debug("Fetching user by id: {}", id);
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return convertToDto(user);
    }
    
    /**
     * Get user by username
     */
    public UserDto getUserByUsername(String username) {
        log.debug("Fetching user by username: {}", username);
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return convertToDto(user);
    }
    
    /**
     * Get user by email
     */
    public UserDto getUserByEmail(String email) {
        log.debug("Fetching user by email: {}", email);
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return convertToDto(user);
    }
    
    /**
     * Find user by username (internal use for authentication)
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
    }
    
    /**
     * Find user by username or email
     */
    public User findByUsernameOrEmail(String username, String email) {
        return userRepository.findByUsernameIgnoreCase(username)
            .or(() -> userRepository.findByEmailIgnoreCase(email))
            .orElseThrow(() -> new ResourceNotFoundException("User", "username or email", username));
    }
    
    /**
     * Update user profile
     */
    public UserDto updateProfile(String userId, CreateUserDto updateDto) {
        log.info("Updating profile for user: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (updateDto.getDisplayName() != null) {
            user.setDisplayName(updateDto.getDisplayName());
        }
        if (updateDto.getBio() != null) {
            user.setBio(updateDto.getBio());
        }
        if (updateDto.getPassword() != null && !updateDto.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(updateDto.getPassword()));
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        
        log.info("User profile updated: {}", userId);
        return convertToDto(savedUser);
    }
    
    /**
     * Update user avatar
     */
    public UserDto updateAvatar(String userId, String avatarUrl) {
        log.info("Updating avatar for user: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        
        return convertToDto(savedUser);
    }
    
    /**
     * Update user cover image
     */
    public UserDto updateCover(String userId, String coverUrl) {
        log.info("Updating cover image for user: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        user.setCoverUrl(coverUrl);
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        
        return convertToDto(savedUser);
    }
    
    /**
     * Increment follower count
     */
    public void incrementFollowerCount(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setFollowerCount(user.getFollowerCount() + 1);
        userRepository.save(user);
    }
    
    /**
     * Decrement follower count
     */
    public void decrementFollowerCount(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (user.getFollowerCount() > 0) {
            user.setFollowerCount(user.getFollowerCount() - 1);
            userRepository.save(user);
        }
    }
    
    /**
     * Increment following count
     */
    public void incrementFollowingCount(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setFollowingCount(user.getFollowingCount() + 1);
        userRepository.save(user);
    }
    
    /**
     * Decrement following count
     */
    public void decrementFollowingCount(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (user.getFollowingCount() > 0) {
            user.setFollowingCount(user.getFollowingCount() - 1);
            userRepository.save(user);
        }
    }
    
    /**
     * Convert User document to UserDto
     * Ensures sensitive data like passwordHash is not exposed
     */
    public UserDto convertToDto(User user) {
        return UserDto.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .displayName(user.getDisplayName())
            .bio(user.getBio())
            .avatarUrl(user.getAvatarUrl())
            .coverUrl(user.getCoverUrl())
            .isActive(user.isActive())
            .isVerified(user.isVerified())
            .followerCount(user.getFollowerCount())
            .followingCount(user.getFollowingCount())
            .postsCount(user.getPostsCount())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .lastLoginAt(user.getLastLoginAt())
            .build();
    }
}
