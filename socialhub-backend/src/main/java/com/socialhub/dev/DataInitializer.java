package com.socialhub.dev;

import com.socialhub.post.document.Post;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Like;
import com.socialhub.social.repository.LikeRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

/**
 * Data initializer for development.
 *
 * On every startup:
 *  1. Creates seed user if not present.
 *  2. Removes duplicate like documents (same userId+postId) left from before
 *     the unique index was enabled.
 *  3. Re-syncs likeCount on every post to match the actual likes collection.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final String SEED_EMAIL    = "test@socialhub.com";
    private static final String SEED_USERNAME = "testuser";
    private static final String SEED_PASSWORD = "Test@1234";

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LikeRepository  likeRepository;
    private final PostRepository  postRepository;

    @Override
    public void run(String... args) {
        createSeedUserIfNotExists();
        deduplicateLikes();
        resyncAllLikeCounts();
    }

    // ── 1. Seed user ────────────────────────────────────────────────────────

    private void createSeedUserIfNotExists() {
        if (userRepository.existsByEmailIgnoreCase(SEED_EMAIL)) {
            log.info("✅ Seed user already exists (email: {})", SEED_EMAIL);
            return;
        }
        Instant now = Instant.now();
        User saved = userRepository.save(User.builder()
                .username(SEED_USERNAME)
                .email(SEED_EMAIL)
                .passwordHash(passwordEncoder.encode(SEED_PASSWORD))
                .displayName("Test User")
                .avatarUrl("https://ui-avatars.com/api/?name=Test+User&background=4648d4&color=fff")
                .bio("Seed account for development")
                .role("USER")
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build());
        log.info("✅ Seed user created — id: {}, username: {}, password: {}",
                saved.getId(), saved.getUsername(), SEED_PASSWORD);
    }

    // ── 2. Remove duplicate likes ────────────────────────────────────────────
    // Before the compound unique index was enabled, a user could like a post
    // multiple times. Keep only the earliest like per (userId, postId) pair.

    private void deduplicateLikes() {
        List<Like> all = likeRepository.findAll();
        if (all.isEmpty()) return;

        // Group by "userId|postId"
        Map<String, List<Like>> grouped = new LinkedHashMap<>();
        for (Like l : all) {
            String key = l.getUserId() + "|" + l.getPostId();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(l);
        }

        int removed = 0;
        for (List<Like> group : grouped.values()) {
            if (group.size() <= 1) continue;
            // Keep the one with the earliest createdAt, delete the rest
            group.sort(Comparator.comparing(l -> l.getCreatedAt() != null ? l.getCreatedAt() : Instant.MIN));
            for (int i = 1; i < group.size(); i++) {
                likeRepository.deleteById(group.get(i).getId());
                removed++;
            }
        }
        if (removed > 0) {
            log.info("🧹 Removed {} duplicate like document(s)", removed);
        } else {
            log.info("✅ No duplicate likes found");
        }
    }

    // ── 3. Re-sync likeCount on all posts ───────────────────────────────────

    private void resyncAllLikeCounts() {
        List<Post> posts = postRepository.findAll();
        int synced = 0;
        for (Post post : posts) {
            long trueCount = likeRepository.countByPostId(post.getId());
            if (post.getLikeCount() != trueCount) {
                post.setLikeCount(trueCount);
                postRepository.save(post);
                synced++;
            }
        }
        log.info("✅ likeCount synced for {} post(s)", synced);
    }
}
