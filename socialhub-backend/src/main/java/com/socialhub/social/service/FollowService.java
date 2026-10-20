package com.socialhub.social.service;

import com.socialhub.common.exception.ResourceNotFoundException;
import com.socialhub.common.exception.ValidationException;
import com.socialhub.social.document.Follow;
import com.socialhub.social.dto.FollowResponseDto;
import com.socialhub.social.dto.FollowUserDto;
import com.socialhub.social.repository.FollowRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    /**
     * Toggle Follow/Unfollow.
     * Prevents self-follow and duplicate follow relations.
     */
    public FollowResponseDto toggleFollow(String currentUserId, String targetUserId) {
        if (currentUserId == null || currentUserId.isBlank()) {
            throw new ValidationException("User chưa đăng nhập");
        }

        if (currentUserId.equals(targetUserId)) {
            throw new ValidationException("Không thể tự theo dõi chính mình");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        Optional<Follow> existing = followRepository.findByFollowerIdAndFollowingId(currentUserId, targetUserId);

        if (existing.isPresent()) {
            followRepository.delete(existing.get());
            long count = followRepository.countByFollowingId(targetUserId);
            log.info("User {} unfollowed {}", currentUserId, targetUserId);
            return FollowResponseDto.builder()
                    .following(false)
                    .followersCount(count)
                    .message("Đã bỏ theo dõi " + targetUser.getUsername())
                    .build();
        } else {
            Follow newFollow = Follow.builder()
                    .followerId(currentUserId)
                    .followingId(targetUserId)
                    .createdAt(Instant.now())
                    .build();

            try {
                followRepository.save(newFollow);
            } catch (DuplicateKeyException e) {
                log.warn("Follow already exists between {} and {}", currentUserId, targetUserId);
            }

            long count = followRepository.countByFollowingId(targetUserId);
            log.info("User {} followed {}", currentUserId, targetUserId);
            return FollowResponseDto.builder()
                    .following(true)
                    .followersCount(count)
                    .message("Đã theo dõi " + targetUser.getUsername())
                    .build();
        }
    }

    /**
     * Get list of followers for a user.
     */
    public List<FollowUserDto> getFollowers(String targetUserId, String currentUserId) {
        if (!userRepository.existsById(targetUserId)) {
            throw new ResourceNotFoundException("User", "id", targetUserId);
        }

        Page<Follow> follows = followRepository.findByFollowingIdOrderByCreatedAtDesc(
                targetUserId, PageRequest.of(0, 100));

        List<FollowUserDto> result = new ArrayList<>();
        for (Follow f : follows) {
            userRepository.findById(f.getFollowerId()).ifPresent(user -> {
                boolean isFollowing = currentUserId != null
                        && !currentUserId.equals(user.getId())
                        && followRepository.existsByFollowerIdAndFollowingId(currentUserId, user.getId());

                boolean isSelf = currentUserId != null && currentUserId.equals(user.getId());

                result.add(FollowUserDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .displayName(user.getDisplayName())
                        .avatarUrl(user.getAvatarUrl())
                        .bio(user.getBio())
                        .isFollowing(isFollowing)
                        .isSelf(isSelf)
                        .followedAt(f.getCreatedAt())
                        .build());
            });
        }
        return result;
    }

    /**
     * Get list of users that target user is following.
     */
    public List<FollowUserDto> getFollowing(String targetUserId, String currentUserId) {
        if (!userRepository.existsById(targetUserId)) {
            throw new ResourceNotFoundException("User", "id", targetUserId);
        }

        Page<Follow> follows = followRepository.findByFollowerIdOrderByCreatedAtDesc(
                targetUserId, PageRequest.of(0, 100));

        List<FollowUserDto> result = new ArrayList<>();
        for (Follow f : follows) {
            userRepository.findById(f.getFollowingId()).ifPresent(user -> {
                boolean isFollowing = currentUserId != null
                        && !currentUserId.equals(user.getId())
                        && followRepository.existsByFollowerIdAndFollowingId(currentUserId, user.getId());

                boolean isSelf = currentUserId != null && currentUserId.equals(user.getId());

                result.add(FollowUserDto.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .displayName(user.getDisplayName())
                        .avatarUrl(user.getAvatarUrl())
                        .bio(user.getBio())
                        .isFollowing(isFollowing)
                        .isSelf(isSelf)
                        .followedAt(f.getCreatedAt())
                        .build());
            });
        }
        return result;
    }
}
