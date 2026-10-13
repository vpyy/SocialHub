package com.socialhub.social.repository;

import com.socialhub.social.document.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Bookmark Repository for MongoDB operations
 */
@Repository
public interface BookmarkRepository extends MongoRepository<Bookmark, String> {
    
    // Check if user bookmarked post
    boolean existsByUserIdAndPostId(String userId, String postId);
    
    // Find bookmark record
    Optional<Bookmark> findByUserIdAndPostId(String userId, String postId);
    
    // Get all bookmarks for user
    Page<Bookmark> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    // Count bookmarks of user
    long countByUserId(String userId);
    
    // Delete bookmark
    void deleteByUserIdAndPostId(String userId, String postId);
}
