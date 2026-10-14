package com.socialhub.social.repository;

import com.socialhub.social.document.Like;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for likes collection.
 */
@Repository
public interface LikeRepository extends MongoRepository<Like, String> {

    Optional<Like> findByUserIdAndPostId(String userId, String postId);

    boolean existsByUserIdAndPostId(String userId, String postId);

    long countByPostId(String postId);

    void deleteByUserIdAndPostId(String userId, String postId);
}
