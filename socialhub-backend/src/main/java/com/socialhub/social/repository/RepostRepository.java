package com.socialhub.social.repository;

import com.socialhub.social.document.Repost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Repost operations
 */
@Repository
public interface RepostRepository extends MongoRepository<Repost, String> {

    /**
     * Find repost by user and post
     */
    Optional<Repost> findByUserIdAndPostId(String userId, String postId);

    /**
     * Check if user reposted a post
     */
    boolean existsByUserIdAndPostId(String userId, String postId);

    /**
     * Get all reposts for a post (paginated)
     */
    Page<Repost> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);

    /**
     * Count reposts for a post
     */
    long countByPostId(String postId);

    /**
     * Delete all reposts for a post
     */
    void deleteByPostId(String postId);

    /**
     * Find all posts reposted by user (ordered by most recent)
     */
    List<Repost> findByUserIdOrderByCreatedAtDesc(String userId);
    
    /**
     * Find all posts reposted by user (paginated)
     */
    Page<Repost> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
