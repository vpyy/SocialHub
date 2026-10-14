package com.socialhub.post.repository;

import com.socialhub.post.document.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for comments collection.
 */
@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    // Top-level comments của 1 bài viết (parentCommentId = null)
    Page<Comment> findByPostIdAndParentCommentIdIsNullOrderByCreatedAtAsc(
            String postId, Pageable pageable);

    // Reply của 1 comment cha
    Page<Comment> findByParentCommentIdOrderByCreatedAtAsc(
            String parentCommentId, Pageable pageable);

    long countByPostId(String postId);

    void deleteByPostId(String postId);
}
