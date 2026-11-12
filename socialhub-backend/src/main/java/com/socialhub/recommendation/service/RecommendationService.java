package com.socialhub.recommendation.service;

import com.socialhub.post.document.Post;
import com.socialhub.post.dto.PostResponseDto;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.repository.LikeRepository;
import com.socialhub.social.repository.RepostRepository;
import com.socialhub.recommendation.dto.PopularPostDto;
import com.socialhub.recommendation.dto.RecommendedUserDto;
import com.socialhub.social.repository.FollowRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for recommendation engine
 * Provides popular posts and suggested users for discovery
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final LikeRepository likeRepository;
    private final RepostRepository repostRepository;

    // ──────────────────────────────────────────────────────
    // 1. Get Popular Posts (trending + high engagement)
    // Excludes posts from current user (if authenticated)
    // ──────────────────────────────────────────────────────
    public List<PopularPostDto> getPopularPosts(String currentUserId, int limit) {
        // Fetch public posts from last 30 days, sorted by engagement
        Instant thirtyDaysAgo = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        
        // Get posts with high engagement (limit * 3 to have enough after filtering)
        Pageable pageable = PageRequest.of(0, limit * 3);
        
        boolean isAuthenticated = currentUserId != null && !currentUserId.equals("anonymous");
        final String userId = currentUserId;
        
        List<Post> trendingPosts = postRepository
            .findByVisibilityAndCreatedAtAfter("PUBLIC", thirtyDaysAgo, pageable)
            .stream()
            .filter(post -> !isAuthenticated || !post.getAuthorId().equals(userId)) // Exclude current user's posts only if authenticated
            .sorted((p1, p2) -> {
                long engagement1 = p1.getLikeCount() + p1.getCommentCount() + p1.getShareCount();
                long engagement2 = p2.getLikeCount() + p2.getCommentCount() + p2.getShareCount();
                return Long.compare(engagement2, engagement1); // descending
            })
            .limit(limit)
            .collect(Collectors.toList());

        return trendingPosts.stream()
            .map(post -> {
                PostResponseDto postDto = convertPostToResponseDto(post, currentUserId);
                return PopularPostDto.builder()
                    .post(postDto)
                    .totalEngagement(post.getLikeCount() + post.getCommentCount() + post.getShareCount())
                    .trend("trending")
                    .build();
            })
            .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────
    // 2. Get Recommended Users (friends of friends + mutual followers)
    // ──────────────────────────────────────────────────────
    public List<RecommendedUserDto> getRecommendedUsers(String currentUserId, int limit) {
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("User not found: " + currentUserId));

        // Get current user's following list
        List<String> currentUserFollowing = followRepository
            .findByFollowerId(currentUserId)
            .stream()
            .map(follow -> follow.getFollowingId())
            .collect(Collectors.toList());

        // Get current user's followers list
        List<String> currentUserFollowers = followRepository
            .findByFollowingId(currentUserId)
            .stream()
            .map(follow -> follow.getFollowerId())
            .collect(Collectors.toList());

        Map<String, RecommendedUserDto> recommendedMap = new HashMap<>();

        // ─── Strategy 1: Friends of Friends (following of following) ───
        Set<String> friendsOfFriendsIds = new HashSet<>();
        for (String followingUserId : currentUserFollowing) {
            List<String> theirFollowing = followRepository
                .findByFollowerId(followingUserId)
                .stream()
                .map(follow -> follow.getFollowingId())
                .collect(Collectors.toList());
            
            for (String potentialFriendId : theirFollowing) {
                // Skip current user and already following
                if (!potentialFriendId.equals(currentUserId) && 
                    !currentUserFollowing.contains(potentialFriendId)) {
                    friendsOfFriendsIds.add(potentialFriendId);
                    
                    // Calculate mutual followers count
                    int mutualFollowers = calculateMutualFollowers(
                        currentUserId, potentialFriendId, 
                        currentUserFollowers, followRepository
                    );
                    
                    User potentialFriend = userRepository.findById(potentialFriendId).orElse(null);
                    if (potentialFriend != null && potentialFriend.getStatus().equals("ACTIVE")) {
                        recommendedMap.put(potentialFriendId, RecommendedUserDto.builder()
                            .id(potentialFriend.getId())
                            .username(potentialFriend.getUsername())
                            .displayName(potentialFriend.getDisplayName())
                            .avatarUrl(potentialFriend.getAvatarUrl())
                            .bio(potentialFriend.getBio())
                            .isFollowing(false)
                            .mutualFollowersCount(mutualFollowers)
                            .reason("mutual_followers")
                            .build());
                    }
                }
            }
        }

        // ─── Strategy 2: Followed By Friends (followers who follow your followers) ───
        for (String followerUserId : currentUserFollowers) {
            List<String> theirFollowing = followRepository
                .findByFollowerId(followerUserId)
                .stream()
                .map(follow -> follow.getFollowingId())
                .collect(Collectors.toList());
            
            for (String potentialFriendId : theirFollowing) {
                // Skip current user and already following and already recommended
                if (!potentialFriendId.equals(currentUserId) && 
                    !currentUserFollowing.contains(potentialFriendId) &&
                    !recommendedMap.containsKey(potentialFriendId)) {
                    
                    User potentialFriend = userRepository.findById(potentialFriendId).orElse(null);
                    if (potentialFriend != null && potentialFriend.getStatus().equals("ACTIVE")) {
                        int mutualFollowers = calculateMutualFollowers(
                            currentUserId, potentialFriendId,
                            currentUserFollowers, followRepository
                        );
                        
                        recommendedMap.put(potentialFriendId, RecommendedUserDto.builder()
                            .id(potentialFriend.getId())
                            .username(potentialFriend.getUsername())
                            .displayName(potentialFriend.getDisplayName())
                            .avatarUrl(potentialFriend.getAvatarUrl())
                            .bio(potentialFriend.getBio())
                            .isFollowing(false)
                            .mutualFollowersCount(mutualFollowers)
                            .reason("followed_by_friends")
                            .build());
                    }
                }
            }
        }

        // Sort by mutual followers count, then by reason priority
        return recommendedMap.values().stream()
            .sorted((a, b) -> {
                int cmp = Integer.compare(b.getMutualFollowersCount(), a.getMutualFollowersCount());
                if (cmp != 0) return cmp;
                // "mutual_followers" comes before "followed_by_friends"
                return a.getReason().compareTo(b.getReason());
            })
            .limit(limit)
            .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────
    // Helper: Convert Post to PostResponseDto
    // ──────────────────────────────────────────────────────
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

        // Check if current user liked or reposted
        boolean isLiked = currentUserId != null && !currentUserId.equals("anonymous") && 
                          likeRepository.existsByUserIdAndPostId(currentUserId, post.getId());
        boolean isReposted = currentUserId != null && !currentUserId.equals("anonymous") &&
                            repostRepository.existsByUserIdAndPostId(currentUserId, post.getId());

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
    // Helper: Calculate mutual followers between two users
    // ──────────────────────────────────────────────────────
    private int calculateMutualFollowers(String userId1, String userId2, 
                                         List<String> userId1Followers,
                                         FollowRepository followRepository) {
        List<String> userId2Followers = followRepository
            .findByFollowingId(userId2)
            .stream()
            .map(follow -> follow.getFollowerId())
            .collect(Collectors.toList());
        
        int count = 0;
        for (String follower : userId1Followers) {
            if (userId2Followers.contains(follower)) {
                count++;
            }
        }
        return count;
    }
}
