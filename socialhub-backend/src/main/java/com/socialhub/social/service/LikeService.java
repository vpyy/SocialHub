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
import java.util.Map;
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
     * Toggle like on a post.
     * Returns the new liked state (true = liked, false = unliked).
     *
     * likeCount is re-counted from the likes collection after every toggle
     * so it can never drift out of sync, regardless of duplicate likes or
     * any data already in the database.
     */
    @Transactional
    public Map<String, Object> toggleLike(String postId, String userId) {
        log.info("Toggling like on post {} by user {}", postId, userId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        Optional<Like> existing = likeRepository.findByUserIdAndPostId(userId, postId);
        boolean nowLiked;

        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            nowLiked = false;
            log.info("Post {} unliked by user {}", postId, userId);
        } else {
            likeRepository.save(Like.builder()
                    .userId(userId)
                    .postId(postId)
                    .createdAt(Instant.now())
                    .build());
            nowLiked = true;
            log.info("Post {} liked by user {}", postId, userId);
        }

        // Recount from DB — single source of truth, never drifts negative
        long trueCount = likeRepository.countByPostId(postId);
        post.setLikeCount(trueCount);
        postRepository.save(post);
        log.info("Post {} likeCount synced to {}", postId, trueCount);

        return Map.of("liked", nowLiked, "likeCount", trueCount);
    }

    /**
     * One-time utility: recalculate likeCount for a post from the likes collection.
     * Call this if likeCount on existing posts is out of sync.
     */
    public long resyncLikeCount(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        long trueCount = likeRepository.countByPostId(postId);
        post.setLikeCount(trueCount);
        postRepository.save(post);
        log.info("Resynced likeCount for post {} → {}", postId, trueCount);
        return trueCount;
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
