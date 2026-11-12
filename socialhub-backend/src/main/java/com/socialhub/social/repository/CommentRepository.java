package com.socialhub.social.repository;

import com.socialhub.social.document.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Comment operations
 */
@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    /**
     * Find top-level comments for a post (no parent)
     */
    Page<Comment> findByPostIdAndParentCommentIdIsNullOrderByCreatedAtDesc(String postId, Pageable pageable);

    /**
     * Find replies for a comment
     */
    List<Comment> findByParentCommentIdOrderByCreatedAtAsc(String parentCommentId);

    /**
     * Count comments for a post (top-level only)
     */
    long countByPostIdAndParentCommentIdIsNull(String postId);

    /**
     * Count replies for a comment
     */
    long countByParentCommentId(String parentCommentId);

    /**
     * Delete all comments for a post
     */
    void deleteByPostId(String postId);

    /**
     * Delete all replies for a comment
     */
    void deleteByParentCommentId(String parentCommentId);
}
