package com.socialhub;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.socialhub.auth.util.JwtTokenProvider;
import com.socialhub.social.document.Follow;
import com.socialhub.social.repository.FollowRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.dto.UpdateProfileDto;
import com.socialhub.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ProfileAndFollowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        followRepository.deleteAll();
        userRepository.deleteAll();

        Instant now = Instant.now();
        userA = userRepository.save(User.builder()
                .username("usera")
                .email("usera@example.com")
                .displayName("User Alpha")
                .bio("Bio of User A")
                .avatarUrl("https://example.com/avatarA.png")
                .coverUrl("https://example.com/coverA.png")
                .role("USER")
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build());

        userB = userRepository.save(User.builder()
                .username("userb")
                .email("userb@example.com")
                .displayName("User Beta")
                .bio("Bio of User B")
                .avatarUrl("https://example.com/avatarB.png")
                .coverUrl("https://example.com/coverB.png")
                .role("USER")
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build());

        tokenA = jwtTokenProvider.generateToken(userA.getId(), userA.getUsername());
        tokenB = jwtTokenProvider.generateToken(userB.getId(), userB.getUsername());
    }

    @AfterEach
    void tearDown() {
        followRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ──────────────────────────────────────────────────────
    // 1. GET /api/users/{username}
    // ──────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/users/{username} — Public profile when unauthenticated")
    void testGetPublicProfileUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/users/" + userA.getUsername()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(userA.getId())))
                .andExpect(jsonPath("$.data.username", is("usera")))
                .andExpect(jsonPath("$.data.displayName", is("User Alpha")))
                .andExpect(jsonPath("$.data.bio", is("Bio of User A")))
                .andExpect(jsonPath("$.data.avatarUrl", is("https://example.com/avatarA.png")))
                .andExpect(jsonPath("$.data.avatar", is("https://example.com/avatarA.png")))
                .andExpect(jsonPath("$.data.coverUrl", is("https://example.com/coverA.png")))
                .andExpect(jsonPath("$.data.cover", is("https://example.com/coverA.png")))
                .andExpect(jsonPath("$.data.followersCount", is(0)))
                .andExpect(jsonPath("$.data.followingCount", is(0)))
                .andExpect(jsonPath("$.data.isFollowing", is(false)))
                .andExpect(jsonPath("$.data.isSelf", is(false)));
    }

    @Test
    @DisplayName("GET /api/users/{username} — Profile with follow state when authenticated")
    void testGetProfileWithFollowStatus() throws Exception {
        // A follows B
        followRepository.save(Follow.builder()
                .followerId(userA.getId())
                .followingId(userB.getId())
                .createdAt(Instant.now())
                .build());

        // A views B's profile
        mockMvc.perform(get("/api/users/" + userB.getUsername())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("userb")))
                .andExpect(jsonPath("$.data.followersCount", is(1)))
                .andExpect(jsonPath("$.data.isFollowing", is(true)))
                .andExpect(jsonPath("$.data.isSelf", is(false)));

        // A views own profile
        mockMvc.perform(get("/api/users/" + userA.getUsername())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isSelf", is(true)))
                .andExpect(jsonPath("$.data.isFollowing", is(false)))
                .andExpect(jsonPath("$.data.followingCount", is(1)));
    }

    @Test
    @DisplayName("GET /api/users/{username} — Returns 404 when user does not exist")
    void testGetProfileNotFound() throws Exception {
        mockMvc.perform(get("/api/users/nonexistentuser999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode", is("RESOURCE_NOT_FOUND")));
    }

    // ──────────────────────────────────────────────────────
    // 2. PUT /api/users/me
    // ──────────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/users/me — Update profile successfully for authenticated user")
    void testUpdateProfileSuccess() throws Exception {
        UpdateProfileDto dto = UpdateProfileDto.builder()
                .displayName("Alpha Updated")
                .bio("New bio for Alpha")
                .avatarUrl("https://example.com/new-avatar.png")
                .coverUrl("https://example.com/new-cover.png")
                .build();

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.displayName", is("Alpha Updated")))
                .andExpect(jsonPath("$.data.bio", is("New bio for Alpha")))
                .andExpect(jsonPath("$.data.avatarUrl", is("https://example.com/new-avatar.png")))
                .andExpect(jsonPath("$.data.coverUrl", is("https://example.com/new-cover.png")));

        // Verify in database
        User updated = userRepository.findById(userA.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Alpha Updated", updated.getDisplayName());
        org.junit.jupiter.api.Assertions.assertEquals("New bio for Alpha", updated.getBio());
    }

    @Test
    @DisplayName("PUT /api/users/me — Returns 401 when unauthenticated")
    void testUpdateProfileUnauthorized() throws Exception {
        UpdateProfileDto dto = UpdateProfileDto.builder()
                .bio("Unauthorized update attempt")
                .build();

        mockMvc.perform(put("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/users/me — Returns 400 when validation fails (bio > 500 chars)")
    void testUpdateProfileValidationFailure() throws Exception {
        String longBio = "A".repeat(501);
        UpdateProfileDto dto = UpdateProfileDto.builder()
                .bio(longBio)
                .build();

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_FAILED")));
    }

    // ──────────────────────────────────────────────────────
    // 3. POST /api/users/{id}/follow
    // ──────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/users/{id}/follow — Follow then Unfollow toggle flow")
    void testToggleFollowFlow() throws Exception {
        // 1. A follows B
        mockMvc.perform(post("/api/users/" + userB.getId() + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.following", is(true)))
                .andExpect(jsonPath("$.data.followersCount", is(1)));

        assertTrue(followRepository.existsByFollowerIdAndFollowingId(userA.getId(), userB.getId()));

        // 2. A unfollows B (toggle)
        mockMvc.perform(post("/api/users/" + userB.getId() + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.following", is(false)))
                .andExpect(jsonPath("$.data.followersCount", is(0)));

        assertFalse(followRepository.existsByFollowerIdAndFollowingId(userA.getId(), userB.getId()));
    }

    @Test
    @DisplayName("POST /api/users/{id}/follow — Cannot follow oneself (returns 400)")
    void testSelfFollowFails() throws Exception {
        mockMvc.perform(post("/api/users/" + userA.getId() + "/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode", is("VALIDATION_ERROR")));
    }

    @Test
    @DisplayName("POST /api/users/{id}/follow — Returns 401 when unauthenticated")
    void testFollowUnauthorized() throws Exception {
        mockMvc.perform(post("/api/users/" + userB.getId() + "/follow"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/users/{id}/follow — Returns 404 when target user does not exist")
    void testFollowNonExistentUser() throws Exception {
        mockMvc.perform(post("/api/users/60d0fe4f5311236168a109ca/follow")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode", is("RESOURCE_NOT_FOUND")));
    }

    // ──────────────────────────────────────────────────────
    // 4. GET /api/users/{id}/followers
    // ──────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/users/{id}/followers — Returns list of followers")
    void testGetFollowers() throws Exception {
        // A follows B
        followRepository.save(Follow.builder()
                .followerId(userA.getId())
                .followingId(userB.getId())
                .createdAt(Instant.now())
                .build());

        mockMvc.perform(get("/api/users/" + userB.getId() + "/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(userA.getId())))
                .andExpect(jsonPath("$.data[0].username", is("usera")))
                .andExpect(jsonPath("$.data[0].displayName", is("User Alpha")));
    }

    @Test
    @DisplayName("GET /api/users/{id}/followers — 404 when target user does not exist")
    void testGetFollowersUserNotFound() throws Exception {
        mockMvc.perform(get("/api/users/nonexistentid/followers"))
                .andExpect(status().isNotFound());
    }

    // ──────────────────────────────────────────────────────
    // 5. GET /api/users/{id}/following
    // ──────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/users/{id}/following — Returns list of followed users")
    void testGetFollowing() throws Exception {
        // A follows B
        followRepository.save(Follow.builder()
                .followerId(userA.getId())
                .followingId(userB.getId())
                .createdAt(Instant.now())
                .build());

        mockMvc.perform(get("/api/users/" + userA.getId() + "/following"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(userB.getId())))
                .andExpect(jsonPath("$.data[0].username", is("userb")))
                .andExpect(jsonPath("$.data[0].displayName", is("User Beta")));
    }

    @Test
    @DisplayName("GET /api/users/{id}/following — 404 when target user does not exist")
    void testGetFollowingUserNotFound() throws Exception {
        mockMvc.perform(get("/api/users/nonexistentid/following"))
                .andExpect(status().isNotFound());
    }
}
