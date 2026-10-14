package com.socialhub.social.repository;

import com.socialhub.social.document.Follow;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for follows collection.
 */
@Repository
public interface FollowRepository extends MongoRepository<Follow, String> {

    Optional<Follow> findByFollowerIdAndFollowingId(String followerId, String followingId);

    boolean existsByFollowerIdAndFollowingId(String followerId, String followingId);

    // Danh sách người mà userId đang follow
    Page<Follow> findByFollowerIdOrderByCreatedAtDesc(String followerId, Pageable pageable);

    // Danh sách người đang follow userId
    Page<Follow> findByFollowingIdOrderByCreatedAtDesc(String followingId, Pageable pageable);

    long countByFollowerId(String followerId);

    long countByFollowingId(String followingId);

    void deleteByFollowerIdAndFollowingId(String followerId, String followingId);

    /** Lấy list followingId để build feed */
    @Query(value = "{ 'followerId': ?0 }", fields = "{ 'followingId': 1 }")
    List<Follow> findFollowingIdsByFollowerId(String followerId);
}
