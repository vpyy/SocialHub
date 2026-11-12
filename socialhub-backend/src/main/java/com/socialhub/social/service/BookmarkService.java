package com.socialhub.social.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.post.document.Post;
import com.socialhub.post.dto.PostDto;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Bookmark;
import com.socialhub.social.dto.BookmarkDto;
import com.socialhub.social.repository.BookmarkRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final PostRepository     postRepository;
    private final UserRepository     userRepository;

    // ── Toggle ────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> toggleBookmark(String postId, String userId) {
        postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + postId));

        Optional<Bookmark> existing = bookmarkRepository.findByUserIdAndPostId(userId, postId);
        boolean nowBookmarked;

        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            nowBookmarked = false;
            log.info("Post {} un-bookmarked by user {}", postId, userId);
        } else {
            bookmarkRepository.save(Bookmark.builder()
                    .userId(userId)
                    .postId(postId)
                    .createdAt(Instant.now())
                    .build());
            nowBookmarked = true;
            log.info("Post {} bookmarked by user {}", postId, userId);
        }

        return Map.of("bookmarked", nowBookmarked);
    }

    // ── List ──────────────────────────────────────────────────────────────

    public Page<BookmarkDto> getUserBookmarks(String userId, int page, int size) {
        return bookmarkRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(b -> {
                    Post post = postRepository.findById(b.getPostId()).orElse(null);
                    User author = (post != null)
                            ? userRepository.findById(post.getAuthorId()).orElse(null)
                            : null;
                    return BookmarkDto.builder()
                            .id(b.getId())
                            .userId(b.getUserId())
                            .postId(b.getPostId())
                            .post(buildPostDto(post, author))
                            .createdAt(b.getCreatedAt())
                            .build();
                });
    }

    // ── Check ─────────────────────────────────────────────────────────────

    public boolean isBookmarked(String postId, String userId) {
        return bookmarkRepository.existsByUserIdAndPostId(userId, postId);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private PostDto buildPostDto(Post post, User author) {
        if (post == null) return null;
        PostDto.PostDtoBuilder b = PostDto.builder()
                .id(post.getId())
                .authorId(post.getAuthorId())
                .content(post.getContent())
                .hashtags(post.getHashtags())
                .visibility(post.getVisibility())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .shareCount(post.getShareCount())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt());
        if (author != null) {
            b.authorUsername(author.getUsername())
             .authorDisplayName(author.getDisplayName())
             .authorAvatarUrl(author.getAvatarUrl());
        }
        if (post.getMedia() != null) {
            b.media(post.getMedia().stream()
                    .map(m -> PostDto.MediaItemDto.builder()
                            .type(m.getType()).url(m.getUrl()).build())
                    .toList());
        }
        return b.build();
    }
}
