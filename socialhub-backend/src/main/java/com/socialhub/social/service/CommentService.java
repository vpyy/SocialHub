package com.socialhub.social.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.post.document.Post;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Comment;
import com.socialhub.social.dto.CommentDto;
import com.socialhub.social.dto.CreateCommentRequest;
import com.socialhub.social.repository.CommentRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Comment operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * Create a comment or reply
     */
    @Transactional
    public CommentDto createComment(String postId, String authorId, CreateCommentRequest request) {
        log.info("Creating comment on post {} by user {}", postId, authorId);

        // Verify post exists
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Verify author exists
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + authorId));

        // If it's a reply, verify parent comment exists
        Comment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found"));
            
            // Ensure parent comment is for the same post
            if (!parentComment.getPostId().equals(postId)) {
                throw new ValidationException("Parent comment does not belong to this post");
            }
        }

        // Create comment
        Comment comment = Comment.builder()
                .postId(postId)
                .authorId(authorId)
                .content(request.getContent())
                .parentCommentId(request.getParentCommentId())
                .likeCount(0)
                .replyCount(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        comment = commentRepository.save(comment);

        // Update counts
        if (parentComment != null) {
            // Update parent comment reply count
            parentComment.setReplyCount(parentComment.getReplyCount() + 1);
            commentRepository.save(parentComment);
            log.info("Reply added to comment {}. New reply count: {}", parentComment.getId(), parentComment.getReplyCount());
        } else {
            // Update post comment count (only for top-level comments)
            post.setCommentCount(post.getCommentCount() + 1);
            postRepository.save(post);
            log.info("Comment added to post {}. New comment count: {}", postId, post.getCommentCount());
        }

        log.info("Comment created successfully: {}", comment.getId());
        return convertToDto(comment, author, false);
    }

    /**
     * Get comments for a post (top-level only, with replies nested)
     */
    public Page<CommentDto> getPostComments(String postId, String currentUserId, int page, int size) {
        log.info("Fetching comments for post: {} (page: {}, size: {})", postId, page, size);

        // Verify post exists
        postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        Pageable pageable = PageRequest.of(page, size);
        Page<Comment> comments = commentRepository.findByPostIdAndParentCommentIdIsNullOrderByCreatedAtDesc(postId, pageable);

        return comments.map(comment -> {
            User author = userRepository.findById(comment.getAuthorId()).orElse(null);
            CommentDto dto = convertToDto(comment, author, false);
            
            // Load replies for each comment
            List<Comment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(comment.getId());
            if (!replies.isEmpty()) {
                dto.setReplies(replies.stream()
                        .map(reply -> {
                            User replyAuthor = userRepository.findById(reply.getAuthorId()).orElse(null);
                            return convertToDto(reply, replyAuthor, false);
                        })
                        .collect(Collectors.toList()));
            }
            
            return dto;
        });
    }

    /**
     * Delete a comment
     */
    @Transactional
    public void deleteComment(String commentId, String userId) {
        log.info("Deleting comment {} by user {}", commentId, userId);

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        // Check ownership
        if (!comment.getAuthorId().equals(userId)) {
            throw new ValidationException("You can only delete your own comments");
        }

        // Update counts
        if (comment.getParentCommentId() != null) {
            // Update parent comment reply count
            commentRepository.findById(comment.getParentCommentId()).ifPresent(parent -> {
                parent.setReplyCount(Math.max(0, parent.getReplyCount() - 1));
                commentRepository.save(parent);
            });
        } else {
            // Update post comment count (only for top-level comments)
            postRepository.findById(comment.getPostId()).ifPresent(post -> {
                long newCount = Math.max(0, post.getCommentCount() - 1);
                post.setCommentCount(newCount);
                postRepository.save(post);
            });
        }

        // Delete all replies if it's a top-level comment
        if (comment.getParentCommentId() == null) {
            commentRepository.deleteByParentCommentId(commentId);
            log.info("Deleted {} replies for comment {}", comment.getReplyCount(), commentId);
        }

        // Delete the comment
        commentRepository.delete(comment);
        log.info("Comment deleted successfully: {}", commentId);
    }

    /**
     * Convert Comment to CommentDto
     */
    private CommentDto convertToDto(Comment comment, User author, boolean loadReplies) {
        CommentDto.CommentDtoBuilder builder = CommentDto.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .authorId(comment.getAuthorId())
                .content(comment.getContent())
                .parentCommentId(comment.getParentCommentId())
                .likeCount(comment.getLikeCount())
                .replyCount(comment.getReplyCount())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt());

        // Add author information if available
        if (author != null) {
            builder.authorUsername(author.getUsername())
                    .authorDisplayName(author.getDisplayName())
                    .authorAvatarUrl(author.getAvatarUrl());
        }

        return builder.build();
    }
}
