package com.socialhub.social.repository;

import com.socialhub.social.document.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Follow Repository for MongoDB operations
 */
@Repository
public interface FollowRepository extends MongoRepository<Follow, String> {
    
    // Check if user1 follows user2
    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);
    
    // Find follow record
    Optional<Follow> findByFollowerIdAndFollowingId(String followerId, String followingId);
    
    // Get followers of a user (who follow this user)
    Page<Follow> findByFollowingId(String followingId, Pageable pageable);
    
    // Get following list (people this user follows)
    Page<Follow> findByFollowerId(String followerId, Pageable pageable);
    
    // Count followers
    long countByFollowingId(String followingId);
    
    // Count following
    long countByFollowerId(String followerId);
    
    // Get all followers
    List<Follow> findByFollowingId(String followingId);
    
    // Get all following
    List<Follow> findByFollowerId(String followerId);
    
    // Delete follow
    void deleteByFollowerIdAndFollowingId(String followerId, String followingId);
}
