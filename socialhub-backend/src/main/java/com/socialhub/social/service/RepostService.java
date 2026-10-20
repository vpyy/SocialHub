package com.socialhub.social.service;

import com.socialhub.post.document.Post;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Repost;
import com.socialhub.social.repository.RepostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Service for Repost operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RepostService {

    private final RepostRepository repostRepository;
    private final PostRepository postRepository;

    /**
     * Toggle repost on a post.
     * Returns the new reposted state (true = reposted, false = unreposted).
     */
    public Map<String, Object> toggleRepost(String userId, String postId) {
        // Validate post exists
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        Optional<Repost> existing = repostRepository.findByUserIdAndPostId(userId, postId);
        boolean nowReposted;

        if (existing.isPresent()) {
            repostRepository.delete(existing.get());
            nowReposted = false;
            log.info("Post {} unreposted by user {}", postId, userId);
        } else {
            repostRepository.save(Repost.builder()
                    .userId(userId)
                    .postId(postId)
                    .createdAt(Instant.now())
                    .build());
            nowReposted = true;
            log.info("Post {} reposted by user {}", postId, userId);
        }

        // Update share count
        long trueCount = repostRepository.countByPostId(postId);
        post.setShareCount(trueCount);
        postRepository.save(post);
        log.info("Post {} shareCount synced to {}", postId, trueCount);

        return Map.of("reposted", nowReposted, "shareCount", trueCount);
    }

    /**
     * Check if user reposted a post
     */
    public boolean isPostRepostedByUser(String postId, String userId) {
        return repostRepository.existsByUserIdAndPostId(userId, postId);
    }
}
