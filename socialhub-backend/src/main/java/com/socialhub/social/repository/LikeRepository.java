package com.socialhub.social.repository;

import com.socialhub.social.document.Like;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Like Repository for MongoDB operations
 */
@Repository
public interface LikeRepository extends MongoRepository<Like, String> {
    
    // Check if user already liked post
    boolean existsByPostIdAndUserId(String postId, String userId);
    
    // Find like record
    Optional<Like> findByPostIdAndUserId(String postId, String userId);
    
    // Count likes on post
    long countByPostId(String postId);
    
    // Find all users who liked a post
    List<Like> findByPostId(String postId);
    
    // Find all posts liked by user
    List<Like> findByUserId(String userId);
    
    // Delete like
    void deleteByPostIdAndUserId(String postId, String userId);
}
