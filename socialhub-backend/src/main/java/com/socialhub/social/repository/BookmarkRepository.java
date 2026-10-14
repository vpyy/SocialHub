package com.socialhub.social.repository;

import com.socialhub.social.document.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for bookmarks collection.
 */
@Repository
public interface BookmarkRepository extends MongoRepository<Bookmark, String> {

    Optional<Bookmark> findByUserIdAndPostId(String userId, String postId);

    boolean existsByUserIdAndPostId(String userId, String postId);

    Page<Bookmark> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    void deleteByUserIdAndPostId(String userId, String postId);
}
