package com.socialhub.post.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.post.document.Post;
import com.socialhub.post.dto.CreatePostRequest;
import com.socialhub.post.dto.PostDto;
import com.socialhub.post.dto.UpdatePostRequest;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Post management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    
    private static final List<String> VALID_VISIBILITIES = Arrays.asList("PUBLIC", "FOLLOWERS", "PRIVATE");
    private static final int MAX_MEDIA_COUNT = 10;

    /**
     * Create a new post
     */
    @Transactional
    public PostDto createPost(String authorId, CreatePostRequest request) {
        log.info("Creating post for author: {}", authorId);

        // Validate author exists
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + authorId));

        // Validate visibility
        if (!VALID_VISIBILITIES.contains(request.getVisibility())) {
            throw new ValidationException("Invalid visibility: " + request.getVisibility());
        }

        // Validate media count
        if (request.getMedia() != null && request.getMedia().size() > MAX_MEDIA_COUNT) {
            throw new ValidationException("Maximum " + MAX_MEDIA_COUNT + " media items allowed");
        }

        // Build media list
        List<Post.MediaItem> mediaItems = new ArrayList<>();
        if (request.getMedia() != null) {
            mediaItems = request.getMedia().stream()
                    .map(dto -> Post.MediaItem.builder()
                            .type(dto.getType())
                            .url(dto.getUrl())
                            .build())
                    .collect(Collectors.toList());
        }

        // Extract and clean hashtags
        List<String> hashtags = extractAndCleanHashtags(request.getContent(), request.getHashtags());

        // Create post
        Post post = Post.builder()
                .authorId(authorId)
                .content(request.getContent())
                .media(mediaItems)
                .hashtags(hashtags)
                .visibility(request.getVisibility())
                .likeCount(0)
                .commentCount(0)
                .shareCount(0)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        post = postRepository.save(post);
        log.info("Post created successfully with id: {}", post.getId());

        return convertToDto(post, author);
    }

    /**
     * Get post by ID
     */
    public PostDto getPostById(String postId, String currentUserId) {
        log.info("Fetching post: {} for user: {}", postId, currentUserId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Check visibility permissions
        if (!canViewPost(post, currentUserId)) {
            throw new ValidationException("You don't have permission to view this post");
        }

        User author = userRepository.findById(post.getAuthorId())
                .orElse(null);

        return convertToDto(post, author);
    }

    /**
     * Update post
     */
    @Transactional
    public PostDto updatePost(String postId, String authorId, UpdatePostRequest request) {
        log.info("Updating post: {} by author: {}", postId, authorId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Check ownership
        if (!post.getAuthorId().equals(authorId)) {
            throw new ValidationException("You can only edit your own posts");
        }

        // Update fields if provided
        boolean updated = false;

        if (request.getContent() != null && !request.getContent().isBlank()) {
            post.setContent(request.getContent());
            updated = true;
        }

        if (request.getMedia() != null) {
            List<Post.MediaItem> mediaItems = request.getMedia().stream()
                    .map(dto -> Post.MediaItem.builder()
                            .type(dto.getType())
                            .url(dto.getUrl())
                            .build())
                    .collect(Collectors.toList());
            post.setMedia(mediaItems);
            updated = true;
        }

        if (request.getHashtags() != null) {
            List<String> hashtags = extractAndCleanHashtags(post.getContent(), request.getHashtags());
            post.setHashtags(hashtags);
            updated = true;
        }

        if (request.getVisibility() != null) {
            if (!VALID_VISIBILITIES.contains(request.getVisibility())) {
                throw new ValidationException("Invalid visibility: " + request.getVisibility());
            }
            post.setVisibility(request.getVisibility());
            updated = true;
        }

        if (updated) {
            post.setUpdatedAt(Instant.now());
            post = postRepository.save(post);
            log.info("Post updated successfully: {}", postId);
        }

        User author = userRepository.findById(authorId).orElse(null);
        return convertToDto(post, author);
    }

    /**
     * Delete post
     */
    @Transactional
    public void deletePost(String postId, String authorId) {
        log.info("Deleting post: {} by author: {}", postId, authorId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        // Check ownership
        if (!post.getAuthorId().equals(authorId)) {
            throw new ValidationException("You can only delete your own posts");
        }

        postRepository.delete(post);
        log.info("Post deleted successfully: {}", postId);
    }

    /**
     * Get user's posts
     */
    public Page<PostDto> getUserPosts(String userId, String currentUserId, int page, int size) {
        log.info("Fetching posts for user: {} (page: {}, size: {})", userId, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable);

        User author = userRepository.findById(userId).orElse(null);

        return posts.map(post -> {
            // Filter by visibility
            if (canViewPost(post, currentUserId)) {
                return convertToDto(post, author);
            }
            return null;
        }).map(dto -> dto); // Remove nulls handled by Spring
    }

    /**
     * Get personalized feed for user
     * Shows posts from followed users and public posts
     * TODO: Implement following logic when Social feature is ready
     */
    public Page<PostDto> getFeed(String currentUserId, int page, int size) {
        log.info("Fetching feed for user: {} (page: {}, size: {})", currentUserId, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Get current user
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        // TODO: Get list of followed user IDs when Social feature is implemented
        // For now, show user's own posts and all public posts
        List<String> followingIds = new ArrayList<>();
        followingIds.add(currentUserId); // Add current user to see their own posts

        // Fetch posts from followed users and public posts
        List<String> visibilities = Arrays.asList("PUBLIC", "FOLLOWERS");
        Page<Post> posts = postRepository.findByAuthorIdInAndVisibilityInOrderByCreatedAtDesc(
                followingIds, visibilities, pageable);

        // Convert to DTOs with author information
        return posts.map(post -> {
            User author = userRepository.findById(post.getAuthorId()).orElse(null);
            return convertToDto(post, author);
        });
    }

    /**
     * Search posts by keyword in content (public only)
     */
    public Page<PostDto> searchPosts(String keyword, int page, int size) {
        log.info("Searching posts with keyword: '{}' (page: {}, size: {})", keyword, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        List<String> visibilities = Arrays.asList("PUBLIC");
        Page<Post> posts = postRepository.searchByContentAndVisibilities(keyword, visibilities, pageable);

        return posts.map(post -> {
            User author = userRepository.findById(post.getAuthorId()).orElse(null);
            return convertToDto(post, author);
        });
    }

    /**
     * Get public feed (for non-authenticated users or explore page)
     */
    public Page<PostDto> getPublicFeed(int page, int size) {
        log.info("Fetching public feed (page: {}, size: {})", page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> posts = postRepository.findByVisibilityOrderByCreatedAtDesc("PUBLIC", pageable);

        return posts.map(post -> {
            User author = userRepository.findById(post.getAuthorId()).orElse(null);
            return convertToDto(post, author);
        });
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    /**
     * Check if user can view a post based on visibility settings
     */
    private boolean canViewPost(Post post, String currentUserId) {
        if ("PUBLIC".equals(post.getVisibility())) {
            return true;
        }

        if (currentUserId == null) {
            return false;
        }

        // Owner can always view their own posts
        if (post.getAuthorId().equals(currentUserId)) {
            return true;
        }

        if ("FOLLOWERS".equals(post.getVisibility())) {
            // TODO: Check if current user follows the author when Social feature is implemented
            // For now, allow viewing FOLLOWERS posts
            return true;
        }

        // PRIVATE posts can only be seen by author
        return false;
    }

    /**
     * Extract hashtags from content and merge with provided hashtags
     */
    private List<String> extractAndCleanHashtags(String content, List<String> providedHashtags) {
        List<String> hashtags = new ArrayList<>();

        // Extract hashtags from content (words starting with #)
        if (content != null) {
            String[] words = content.split("\\s+");
            for (String word : words) {
                if (word.startsWith("#") && word.length() > 1) {
                    String tag = word.substring(1).replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();
                    if (!tag.isEmpty() && !hashtags.contains(tag)) {
                        hashtags.add(tag);
                    }
                }
            }
        }

        // Add provided hashtags
        if (providedHashtags != null) {
            for (String tag : providedHashtags) {
                String cleanTag = tag.replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();
                if (!cleanTag.isEmpty() && !hashtags.contains(cleanTag)) {
                    hashtags.add(cleanTag);
                }
            }
        }

        return hashtags;
    }

    /**
     * Convert Post entity to PostDto
     */
    private PostDto convertToDto(Post post, User author) {
        PostDto.PostDtoBuilder builder = PostDto.builder()
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

        // Add author information if available
        if (author != null) {
            builder.authorUsername(author.getUsername())
                    .authorDisplayName(author.getDisplayName())
                    .authorAvatarUrl(author.getAvatarUrl());
        }

        // Convert media items
        if (post.getMedia() != null) {
            List<PostDto.MediaItemDto> mediaDtos = post.getMedia().stream()
                    .map(item -> PostDto.MediaItemDto.builder()
                            .type(item.getType())
                            .url(item.getUrl())
                            .build())
                    .collect(Collectors.toList());
            builder.media(mediaDtos);
        }

        return builder.build();
    }
}
