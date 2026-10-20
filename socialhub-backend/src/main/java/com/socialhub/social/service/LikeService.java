package com.socialhub.social.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.post.document.Post;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Like;
import com.socialhub.social.dto.LikeDto;
import com.socialhub.social.repository.LikeRepository;
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
import java.util.Optional;

/**
 * Service for Like operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    /**
     * Toggle like on a post
     * If user already liked → unlike
     * If user hasn't liked → like
     */
    @Transactional
    public boolean toggleLike(String postId, String userId) {
        log.info("Toggling like on post {} by user {}", postId, userId);

        // Verify post exists
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Check if already liked
        Optional<Like> existingLike = likeRepository.findByUserIdAndPostId(userId, postId);

        if (existingLike.isPresent()) {
            // Unlike
            likeRepository.delete(existingLike.get());
            
            // Update post like count
            long newCount = Math.max(0, post.getLikeCount() - 1);
            post.setLikeCount(newCount);
            postRepository.save(post);
            
            log.info("Post {} unliked by user {}. New count: {}", postId, userId, newCount);
            return false; // unliked
        } else {
            // Like
            Like like = Like.builder()
                    .userId(userId)
                    .postId(postId)
                    .createdAt(Instant.now())
                    .build();
            
            likeRepository.save(like);
            
            // Update post like count
            long newCount = post.getLikeCount() + 1;
            post.setLikeCount(newCount);
            postRepository.save(post);
            
            log.info("Post {} liked by user {}. New count: {}", postId, userId, newCount);
            return true; // liked
        }
    }

    /**
     * Get users who liked a post
     */
    public Page<LikeDto> getPostLikes(String postId, int page, int size) {
        log.info("Fetching likes for post: {} (page: {}, size: {})", postId, page, size);

        // Verify post exists
        postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        Pageable pageable = PageRequest.of(page, size);
        Page<Like> likes = likeRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);

        return likes.map(this::convertToDto);
    }

    /**
     * Check if user liked a post
     */
    public boolean isPostLikedByUser(String postId, String userId) {
        return likeRepository.existsByUserIdAndPostId(userId, postId);
    }

    /**
     * Convert Like to LikeDto
     */
    private LikeDto convertToDto(Like like) {
        LikeDto.LikeDtoBuilder builder = LikeDto.builder()
                .id(like.getId())
                .userId(like.getUserId())
                .postId(like.getPostId())
                .createdAt(like.getCreatedAt());

        // Add user information if available
        userRepository.findById(like.getUserId()).ifPresent(user -> {
            builder.username(user.getUsername())
                    .displayName(user.getDisplayName())
                    .avatarUrl(user.getAvatarUrl());
        });

        return builder.build();
    }
}
