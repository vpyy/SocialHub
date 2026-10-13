package com.socialhub.post.repository;

import com.socialhub.post.document.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Post Repository for MongoDB operations
 */
@Repository
public interface PostRepository extends MongoRepository<Post, String> {
    
    // Find posts by user
    Page<Post> findByUserIdAndIsDeletedFalse(String userId, Pageable pageable);
    
    // Find all posts chronologically (for feed)
    Page<Post> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);
    
    // Find posts by privacy level
    Page<Post> findByPrivacyAndIsDeletedFalseOrderByCreatedAtDesc(String privacy, Pageable pageable);
    
    // Find posts by multiple users (for following feed)
    Page<Post> findByUserIdInAndIsDeletedFalseOrderByCreatedAtDesc(List<String> userIds, Pageable pageable);
    
    // Search posts by content (hashtags or text)
    @Query("{ 'content': { $regex: ?0, $options: 'i' }, 'isDeleted': false }")
    Page<Post> searchByContent(String keyword, Pageable pageable);
    
    // Find posts by hashtag
    @Query("{ 'hashtags': ?0, 'isDeleted': false }")
    Page<Post> findByHashtag(String hashtag, Pageable pageable);
    
    // Count user's posts
    long countByUserIdAndIsDeletedFalse(String userId);
    
    // Get trending hashtags (for aggregation)
    @Query(value = "{ 'isDeleted': false }", fields = "{ 'hashtags': 1 }")
    List<Post> findAllHashtags();
}
