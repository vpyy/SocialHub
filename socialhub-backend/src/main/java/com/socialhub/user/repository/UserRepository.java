package com.socialhub.user.repository;

import com.socialhub.user.document.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data MongoDB Repository for User document
 * 
 * Provides basic CRUD operations and custom queries
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    /**
     * Find user by username (case-insensitive)
     */
    Optional<User> findByUsernameIgnoreCase(String username);
    
    /**
     * Find user by email (case-insensitive)
     */
    Optional<User> findByEmailIgnoreCase(String email);
    
    /**
     * Check if username exists
     */
    boolean existsByUsernameIgnoreCase(String username);
    
    /**
     * Check if email exists
     */
    boolean existsByEmailIgnoreCase(String email);
    
    /**
     * Find all active users
     */
    java.util.List<User> findByIsActiveTrue();
    
    /**
     * Find all verified users
     */
    java.util.List<User> findByIsVerifiedTrue();
    
    /**
     * Search users by display name or username
     */
    java.util.List<User> findByDisplayNameContainsIgnoreCaseOrUsernameContainsIgnoreCase(String displayName, String username);
}

