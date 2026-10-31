package com.socialhub.user.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.post.document.Post;
import com.socialhub.post.dto.PostResponseDto;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Like;
import com.socialhub.social.document.Repost;
import com.socialhub.social.repository.FollowRepository;
import com.socialhub.social.repository.LikeRepository;
import com.socialhub.social.repository.RepostRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.CreateUserDto;
import com.socialhub.user.dto.UpdateProfileDto;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.dto.UserProfileDto;
import com.socialhub.user.document.Block;
import com.socialhub.user.document.Nickname;
import com.socialhub.user.dto.BlockedUserDto;
import com.socialhub.user.dto.SetNicknameRequest;
import com.socialhub.user.repository.BlockRepository;
import com.socialhub.user.repository.NicknameRepository;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BlockRepository blockRepository;
    private final NicknameRepository nicknameRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final RepostRepository repostRepository;
    private final PasswordEncoder passwordEncoder;

    // ──────────────────────────────────────────────────────
    // Registration
    // ──────────────────────────────────────────────────────

    public UserDto createUser(CreateUserDto dto) {
        log.info("Registering user with email: {}", dto.getEmail());

        if (userRepository.existsByEmailIgnoreCase(dto.getEmail())) {
            throw new ValidationException("Email already exists");
        }

        String baseUsername = generateUsernameFromDisplayName(dto.getDisplayName());
        String username = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsernameIgnoreCase(username)) {
            username = baseUsername + counter++;
        }

        Instant now = Instant.now();
        User user = User.builder()
                .username(username)
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .displayName(dto.getDisplayName())
                .bio(dto.getBio() != null ? dto.getBio() : "")
                .role("USER")
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        User saved = userRepository.save(user);
        log.info("User created — id: {}, username: {}", saved.getId(), saved.getUsername());
        return toDto(saved);
    }

    // ──────────────────────────────────────────────────────
    // Lookups
    // ──────────────────────────────────────────────────────

    public UserDto getUserById(String id) {
        return toDto(findUserById(id));
    }

    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return toDto(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    public List<UserDto> searchUsers(String keyword, String currentUserId) {
        List<User> allResults = userRepository.searchByKeyword(keyword);
        
        // If not authenticated, return all results
        if (currentUserId == null) {
            return allResults.stream()
                    .map(this::toDto)
                    .toList();
        }
        
        // Get current user's blocked users
        Set<String> blockedByMe = blockRepository.findByUserId(currentUserId).stream()
                .map(Block::getBlockedUserId)
                .collect(Collectors.toSet());
        
        // Get users who blocked current user
        Set<String> blockedMeUsers = blockRepository.findByBlockedUserId(currentUserId).stream()
                .map(Block::getUserId)
                .collect(Collectors.toSet());
        
        // Filter results: exclude blocked users and users who blocked current user
        return allResults.stream()
                .filter(user -> !blockedByMe.contains(user.getId()) && !blockedMeUsers.contains(user.getId()))
                .map(this::toDto)
                .toList();
    }

    public List<UserDto> searchUsers(String keyword) {
        return userRepository.searchByKeyword(keyword)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Used by AuthController — accepts email or username.
     */
    public User findByUsernameOrEmail(String identifier) {
        return userRepository.findByEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByUsernameIgnoreCase(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("User", "email/username", identifier));
    }

    // ──────────────────────────────────────────────────────
    // Profile features (GET /api/users/{username}, PUT /api/users/me)
    // ──────────────────────────────────────────────────────

    public UserProfileDto getUserProfile(String usernameOrId, String currentUserId) {
        User user = userRepository.findByUsernameIgnoreCase(usernameOrId)
                .or(() -> userRepository.findById(usernameOrId))
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", usernameOrId));

        return toProfileDto(user, currentUserId);
    }

    public UserProfileDto updateMyProfile(String currentUserId, UpdateProfileDto dto) {
        User user = findUserById(currentUserId);

        if (dto.getBio() != null) {
            user.setBio(dto.getBio());
        }
        if (dto.getResolvedAvatarUrl() != null) {
            user.setAvatarUrl(dto.getResolvedAvatarUrl());
        }
        if (dto.getResolvedCoverUrl() != null) {
            user.setCoverUrl(dto.getResolvedCoverUrl());
        }
        if (dto.getDisplayName() != null && !dto.getDisplayName().isBlank()) {
            user.setDisplayName(dto.getDisplayName().trim());
        }

        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        log.info("Updated profile for user: {}", saved.getUsername());

        return toProfileDto(saved, currentUserId);
    }

    public UserProfileDto toProfileDto(User user, String currentUserId) {
        long followersCount = followRepository.countByFollowingId(user.getId());
        long followingCount = followRepository.countByFollowerId(user.getId());
        long postsCount = postRepository.countByAuthorId(user.getId());

        boolean isSelf = currentUserId != null && currentUserId.equals(user.getId());
        boolean isFollowing = !isSelf && currentUserId != null
                && followRepository.existsByFollowerIdAndFollowingId(currentUserId, user.getId());

        // Fetch recent posts
        List<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(0, 30))
                .getContent();

        List<Object> postDtos = new ArrayList<>();
        for (Post p : posts) {
            // Filter posts based on visibility and viewer
            boolean canView = false;
            
            if (isSelf) {
                // User can see all their own posts
                canView = true;
            } else if ("PUBLIC".equals(p.getVisibility())) {
                // Everyone can see public posts
                canView = true;
            } else if ("FOLLOWERS".equals(p.getVisibility()) && isFollowing) {
                // Only followers can see FOLLOWERS posts
                canView = true;
            } else if ("ONLY_ME".equals(p.getVisibility())) {
                // Only author can see ONLY_ME posts
                canView = false;
            }
            
            // Skip if current user cannot view this post
            if (!canView) {
                continue;
            }

            String imageUrl = (p.getMedia() != null && !p.getMedia().isEmpty()) ? p.getMedia().get(0).getUrl() : null;
            postDtos.add(PostResponseDto.builder()
                    .id(p.getId())
                    .author(PostResponseDto.AuthorDto.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .displayName(user.getDisplayName())
                            .avatarUrl(user.getAvatarUrl())
                            .isVerified(false)
                            .build())
                    .content(p.getContent())
                    .media(p.getMedia())
                    .imageUrl(imageUrl)
                    .hashtags(p.getHashtags())
                    .visibility(p.getVisibility())
                    .likes(p.getLikeCount())
                    .comments(p.getCommentCount())
                    .shares(p.getShareCount())
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .build());
        }

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(isSelf ? user.getEmail() : null)
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .bio(user.getBio())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .followersCount(followersCount)
                .followingCount(followingCount)
                .postsCount(postsCount)
                .isFollowing(isFollowing)
                .isSelf(isSelf)
                .posts(postDtos)
                .build();
    }

    // ──────────────────────────────────────────────────────
    // Profile updates
    // ──────────────────────────────────────────────────────

    public UserDto updateProfile(String userId, String displayName, String bio) {
        User user = findUserById(userId);
        if (displayName != null)
            user.setDisplayName(displayName);
        if (bio != null)
            user.setBio(bio);
        user.setUpdatedAt(Instant.now());
        return toDto(userRepository.save(user));
    }

    public UserDto updateAvatar(String userId, String avatarUrl) {
        User user = findUserById(userId);
        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(Instant.now());
        return toDto(userRepository.save(user));
    }

    public UserDto updateCover(String userId, String coverUrl) {
        User user = findUserById(userId);
        user.setCoverUrl(coverUrl);
        user.setUpdatedAt(Instant.now());
        return toDto(userRepository.save(user));
    }

    /**
     * Change password — validate current password, encode new one
     */
    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = findUserById(userId);

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ValidationException("Mật khẩu hiện tại không chính xác");
        }

        // Encode and set new password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Password changed for user: {}", userId);
    }

    // ──────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────

    private User findUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    /**
     * Convert User document → UserDto (safe, no passwordHash).
     */
    public UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .coverUrl(user.getCoverUrl())
                .bio(user.getBio())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * "Hoàng Minh" → "hoang-minh"
     * Handles Vietnamese diacritics + đ→d.
     */
    private String generateUsernameFromDisplayName(String displayName) {
        if (displayName == null || displayName.isBlank())
            return "user";

        // Unicode normalize → strip diacritics
        String normalized = Normalizer.normalize(displayName, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        return normalized
                .toLowerCase()
                .replaceAll("[đĐ]", "d")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .substring(0, Math.min(40, normalized.length()));
    }

    // ──────────────────────────────────────────────────────
    // User Posts: Reposts & Liked Posts
    // ──────────────────────────────────────────────────────

    /**
     * Get posts that user has reposted
     * GET /api/users/{id}/reposts
     */
    public List<PostResponseDto> getUserReposts(String userId, String currentUserId) {
        log.info("Fetching reposts for user: {}", userId);

        // Get all reposts by user (ordered by most recent)
        List<Repost> reposts = repostRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Extract post IDs
        List<String> postIds = reposts.stream()
                .map(Repost::getPostId)
                .collect(Collectors.toList());

        if (postIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Fetch all posts
        List<Post> posts = postRepository.findAllById(postIds);

        // Convert to DTOs and maintain order
        return posts.stream()
                .map(post -> convertPostToResponseDto(post, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * Get posts that user has liked
     * GET /api/users/{id}/liked-posts
     */
    public List<PostResponseDto> getUserLikedPosts(String userId, String currentUserId) {
        log.info("Fetching liked posts for user: {}", userId);

        // Get all likes by user (ordered by most recent)
        List<Like> likes = likeRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // Extract post IDs
        List<String> postIds = likes.stream()
                .map(Like::getPostId)
                .collect(Collectors.toList());

        if (postIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Fetch all posts
        List<Post> posts = postRepository.findAllById(postIds);

        // Convert to DTOs and maintain order
        return posts.stream()
                .map(post -> convertPostToResponseDto(post, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * Helper method to convert Post to PostResponseDto
     */
    private PostResponseDto convertPostToResponseDto(Post post, String currentUserId) {
        // Fetch author info
        User author = userRepository.findById(post.getAuthorId()).orElse(null);

        if (author == null) {
            log.warn("Author not found for post: {}", post.getId());
            return null;
        }

        String imageUrl = (post.getMedia() != null && !post.getMedia().isEmpty())
                ? post.getMedia().get(0).getUrl()
                : null;

        // Check if current user liked, reposted, or bookmarked
        boolean isLiked = currentUserId != null && likeRepository.existsByUserIdAndPostId(currentUserId, post.getId());
        boolean isReposted = currentUserId != null
                && repostRepository.existsByUserIdAndPostId(currentUserId, post.getId());

        return PostResponseDto.builder()
                .id(post.getId())
                .author(PostResponseDto.AuthorDto.builder()
                        .id(author.getId())
                        .username(author.getUsername())
                        .displayName(author.getDisplayName())
                        .avatarUrl(author.getAvatarUrl())
                        .isVerified(false)
                        .build())
                .content(post.getContent())
                .media(post.getMedia())
                .imageUrl(imageUrl)
                .hashtags(post.getHashtags())
                .visibility(post.getVisibility())
                .likes(post.getLikeCount())
                .comments(post.getCommentCount())
                .shares(post.getShareCount())
                .isLiked(isLiked)
                .isReposted(isReposted)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    // ──────────────────────────────────────────────────────
    // Block/Unblock users
    // ──────────────────────────────────────────────────────

    /**
     * Block a user
     */
    public void blockUser(String currentUserId, String blockedUserId) {
        if (currentUserId.equals(blockedUserId)) {
            throw new ValidationException("Không thể chặn chính mình");
        }

        // Check user exists
        findUserById(blockedUserId);

        // Check if already blocked
        if (blockRepository.existsByUserIdAndBlockedUserId(currentUserId, blockedUserId)) {
            log.warn("User {} already blocked {}", currentUserId, blockedUserId);
            return;
        }

        Block block = Block.builder()
                .userId(currentUserId)
                .blockedUserId(blockedUserId)
                .createdAt(Instant.now())
                .build();
        blockRepository.save(block);
        log.info("User {} blocked {}", currentUserId, blockedUserId);
    }

    /**
     * Unblock a user
     */
    public void unblockUser(String currentUserId, String blockedUserId) {
        blockRepository.deleteByUserIdAndBlockedUserId(currentUserId, blockedUserId);
        log.info("User {} unblocked {}", currentUserId, blockedUserId);
    }

    /**
     * Get all blocked users
     */
    public List<BlockedUserDto> getBlockedUsers(String currentUserId) {
        List<Block> blocks = blockRepository.findByUserId(currentUserId);
        return blocks.stream()
                .map(b -> {
                    User blockedUser = userRepository.findById(b.getBlockedUserId()).orElse(null);
                    if (blockedUser == null) return null;
                    return BlockedUserDto.builder()
                            .id(blockedUser.getId())
                            .username(blockedUser.getUsername())
                            .displayName(blockedUser.getDisplayName())
                            .avatarUrl(blockedUser.getAvatarUrl())
                            .blockedAt(b.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Check if user is blocked
     */
    public boolean isBlocked(String currentUserId, String targetUserId) {
        return blockRepository.existsByUserIdAndBlockedUserId(currentUserId, targetUserId);
    }

    // ──────────────────────────────────────────────────────
    // Nicknames
    // ──────────────────────────────────────────────────────

    /**
     * Set nickname for a user
     */
    public void setNickname(String currentUserId, String targetUserId, String nickname) {
        if (currentUserId.equals(targetUserId)) {
            throw new ValidationException("Không thể đặt biệt danh cho chính mình");
        }

        // Check target user exists
        findUserById(targetUserId);

        if (nickname == null || nickname.trim().isEmpty()) {
            // Remove nickname
            nicknameRepository.deleteByUserIdAndTargetUserId(currentUserId, targetUserId);
            log.info("Nickname removed for user {} by {}", targetUserId, currentUserId);
            return;
        }

        // Trim and validate
        String trimmedNickname = nickname.trim();
        if (trimmedNickname.length() > 50) {
            throw new ValidationException("Biệt danh không được quá 50 ký tự");
        }

        // Find existing or create new
        Nickname nick = nicknameRepository.findByUserIdAndTargetUserId(currentUserId, targetUserId)
                .orElse(Nickname.builder()
                        .userId(currentUserId)
                        .targetUserId(targetUserId)
                        .build());

        nick.setNickname(trimmedNickname);
        nick.setUpdatedAt(Instant.now());
        if (nick.getCreatedAt() == null) {
            nick.setCreatedAt(Instant.now());
        }

        nicknameRepository.save(nick);
        log.info("Nickname set for user {} by {}: {}", targetUserId, currentUserId, trimmedNickname);
    }

    /**
     * Get nickname if exists
     */
    public String getNickname(String currentUserId, String targetUserId) {
        return nicknameRepository.findByUserIdAndTargetUserId(currentUserId, targetUserId)
                .map(Nickname::getNickname)
                .orElse(null);
    }
}
