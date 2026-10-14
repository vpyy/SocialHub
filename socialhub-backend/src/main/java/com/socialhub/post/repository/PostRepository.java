package com.socialhub.post.repository;

import com.socialhub.post.document.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for posts collection.
 *
 * Visibility values: PUBLIC | FOLLOWERS | PRIVATE
 */
@Repository
public interface PostRepository extends MongoRepository<Post, String> {

    // Tất cả bài của 1 user, mới nhất trước
    Page<Post> findByAuthorIdOrderByCreatedAtDesc(String authorId, Pageable pageable);

    // Feed: bài của nhiều user (following), mới nhất trước
    Page<Post> findByAuthorIdInAndVisibilityInOrderByCreatedAtDesc(
            List<String> authorIds, List<String> visibilities, Pageable pageable);

    // Feed public: dành cho người chưa đăng nhập / trang khám phá
    Page<Post> findByVisibilityOrderByCreatedAtDesc(String visibility, Pageable pageable);

    // Tìm bài theo hashtag
    @Query("{ 'hashtags': ?0, 'visibility': { $in: ?1 } }")
    Page<Post> findByHashtagAndVisibilities(String hashtag, List<String> visibilities, Pageable pageable);

    // Tìm kiếm bài theo từ khóa trong content
    @Query("{ 'content': { $regex: ?0, $options: 'i' }, 'visibility': { $in: ?1 } }")
    Page<Post> searchByContentAndVisibilities(String keyword, List<String> visibilities, Pageable pageable);

    long countByAuthorId(String authorId);
}
