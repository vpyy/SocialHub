package com.socialhub.post.repository;

import com.socialhub.post.document.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Comment Repository for MongoDB operations
 */
@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {
    
    // Find all comments for a post
    Page<Comment> findByPostIdAndIsDeletedFalseOrderByCreatedAtDesc(String postId, Pageable pageable);
    
    // Count comments on a post
    long countByPostIdAndIsDeletedFalse(String postId);
    
    // Find comments by user
    Page<Comment> findByUserIdAndIsDeletedFalse(String userId, Pageable pageable);
    
    // Find comments by multiple posts (for batch operations)
    List<Comment> findByPostIdInAndIsDeletedFalse(List<String> postIds);
    
    // Check if user commented on post
    boolean existsByPostIdAndUserIdAndIsDeletedFalse(String postId, String userId);
}
