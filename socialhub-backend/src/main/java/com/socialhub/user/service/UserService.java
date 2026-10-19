package com.socialhub.user.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.post.document.Post;
import com.socialhub.post.dto.PostResponseDto;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.repository.FollowRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.CreateUserDto;
import com.socialhub.user.dto.UpdateProfileDto;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.dto.UserProfileDto;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;
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

    public List<UserDto> searchUsers(String keyword) {
        return userRepository.searchByKeyword(keyword)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsernameIgnoreCase(username);
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
        if (displayName != null) user.setDisplayName(displayName);
        if (bio != null)         user.setBio(bio);
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
        if (displayName == null || displayName.isBlank()) return "user";

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
}
