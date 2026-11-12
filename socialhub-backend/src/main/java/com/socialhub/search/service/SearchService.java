package com.socialhub.search.service;

import com.socialhub.post.document.Post;
import com.socialhub.post.dto.PostDto;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.repository.LikeRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.UserDto;
import com.socialhub.user.repository.UserRepository;
import com.socialhub.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Search operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

        private final UserRepository userRepository;
        private final PostRepository postRepository;
        private final LikeRepository likeRepository;
        private final UserService userService;

        /**
         * Search users by keyword (display name or username)
         */
        public List<UserDto> searchUsers(String keyword) {
                log.info("Searching users with keyword: {}", keyword);
                List<User> results = userRepository.searchByKeyword(keyword);
                return results.stream().map(userService::toDto).collect(Collectors.toList());
        }

        /**
         * Search posts by content keyword
         */
        public List<PostDto> searchPosts(String keyword, String currentUserId) {
                log.info("Searching posts with keyword: {}", keyword);
                List<Post> posts = postRepository
                                .searchByContentAndVisibilities(keyword, List.of("PUBLIC"), PageRequest.of(0, 50))
                                .getContent();
                return convertPostsToDto(posts, currentUserId);
        }

        /**
         * Search posts by hashtag
         */
        public List<PostDto> searchByHashtag(String hashtag, String currentUserId) {
                log.info("Searching posts with hashtag: {}", hashtag);
                List<Post> posts = postRepository
                                .findByHashtagAndVisibilities(hashtag, List.of("PUBLIC"), PageRequest.of(0, 50))
                                .getContent();
                return convertPostsToDto(posts, currentUserId);
        }

        /**
         * Helper: convert posts to DTOs
         */
        private List<PostDto> convertPostsToDto(List<Post> posts, String currentUserId) {
                return posts.stream()
                                .map(post -> convertPostToDto(post, currentUserId))
                                .filter(dto -> dto != null)
                                .collect(Collectors.toList());
        }

        /**
         * Helper: convert single post to DTO
         */
        private PostDto convertPostToDto(Post post, String currentUserId) {
                User author = userRepository.findById(post.getAuthorId()).orElse(null);
                if (author == null) {
                        log.warn("Author not found for post: {}", post.getId());
                        return null;
                }

                boolean likedByCurrentUser = currentUserId != null
                                && likeRepository.existsByUserIdAndPostId(currentUserId, post.getId());

                List<PostDto.MediaItemDto> mediaItems = post.getMedia() != null
                                ? post.getMedia().stream()
                                                .map(item -> PostDto.MediaItemDto.builder()
                                                                .type(item.getType())
                                                                .url(item.getUrl())
                                                                .build())
                                                .collect(Collectors.toList())
                                : null;

                return PostDto.builder()
                                .id(post.getId())
                                .authorId(author.getId())
                                .authorUsername(author.getUsername())
                                .authorDisplayName(author.getDisplayName())
                                .authorAvatarUrl(author.getAvatarUrl())
                                .content(post.getContent())
                                .media(mediaItems)
                                .hashtags(post.getHashtags())
                                .visibility(post.getVisibility())
                                .likeCount(post.getLikeCount())
                                .commentCount(post.getCommentCount())
                                .shareCount(post.getShareCount())
                                .likedByCurrentUser(likedByCurrentUser)
                                .createdAt(post.getCreatedAt())
                                .updatedAt(post.getUpdatedAt())
                                .build();
        }
}
