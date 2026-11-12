package com.socialhub.social.repository;

import com.socialhub.social.document.Like;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Like operations
 */
@Repository
public interface LikeRepository extends MongoRepository<Like, String> {

    /**
     * Find like by user and post
     */
    Optional<Like> findByUserIdAndPostId(String userId, String postId);

    /**
     * Check if user liked a post
     */
    boolean existsByUserIdAndPostId(String userId, String postId);

    /**
     * Get all likes for a post (paginated)
     */
    Page<Like> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);

    /**
     * Count likes for a post
     */
    long countByPostId(String postId);

    /**
     * Delete all likes for a post
     */
    void deleteByPostId(String postId);

    /**
     * Find all posts liked by user
     */
    List<Like> findByUserIdOrderByCreatedAtDesc(String userId);
}
