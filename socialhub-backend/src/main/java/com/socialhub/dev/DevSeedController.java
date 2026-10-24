package com.socialhub.dev;

import com.socialhub.chat.document.Conversation;
import com.socialhub.chat.document.Message;
import com.socialhub.chat.repository.ConversationRepository;
import com.socialhub.chat.repository.MessageRepository;
import com.socialhub.common.response.ApiResponse;
import com.socialhub.notification.document.Notification;
import com.socialhub.notification.repository.NotificationRepository;
import com.socialhub.post.document.Post;
import com.socialhub.post.repository.PostRepository;
import com.socialhub.social.document.Bookmark;
import com.socialhub.social.document.Comment;
import com.socialhub.social.document.Follow;
import com.socialhub.social.document.Like;
import com.socialhub.social.repository.BookmarkRepository;
import com.socialhub.social.repository.CommentRepository;
import com.socialhub.social.repository.FollowRepository;
import com.socialhub.social.repository.LikeRepository;
import com.socialhub.user.document.User;
import com.socialhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * DEV-ONLY endpoint to seed a large, realistic dataset into MongoDB.
 *
 * POST /api/dev/seed          — full seed (idempotent)
 * DELETE /api/dev/seed/reset  — wipe everything and re-seed
 *
 * WARNING: Do NOT deploy this in production.
 */
@Slf4j
@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
public class DevSeedController {

    private final UserRepository         userRepository;
    private final PostRepository         postRepository;
    private final CommentRepository      commentRepository;
    private final LikeRepository         likeRepository;
    private final BookmarkRepository     bookmarkRepository;
    private final FollowRepository       followRepository;
    private final NotificationRepository notificationRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository      messageRepository;
    private final PasswordEncoder        passwordEncoder;

    private static final Random RNG = new Random(42);

    // ── Vietnamese content pools ────────────────────────────────────────────

    private static final String[] DISPLAY_NAMES = {
        "Nguyễn Minh Anh", "Trần Bảo Long", "Lê Thị Hoa", "Phạm Quốc Hùng",
        "Hoàng Thanh Tú", "Đặng Văn Khoa", "Bùi Thị Mai", "Vũ Đức Mạnh",
        "Đỗ Thị Lan", "Ngô Hoài Nam", "Lý Thị Hương", "Trương Công Danh",
        "Đinh Thị Thu", "Hà Minh Tuấn", "Mai Thị Phương", "Cao Văn Hải",
        "Lâm Thị Ngọc", "Phan Quốc Bảo", "Tô Thị Linh", "Dương Minh Khải",
    };

    private static final String[] BIOS = {
        "Yêu lập trình và cà phê ☕", "Nhiếp ảnh gia nghiệp dư 📷",
        "Đam mê du lịch khắp nơi 🌍", "Foodie & blogger ẩm thực 🍜",
        "Developer full-stack tại Hà Nội", "Sinh viên CNTT đam mê AI",
        "Thích đọc sách và học điều mới", "Yêu thiên nhiên và leo núi 🏔️",
        "Content creator | 10K followers", "Kỹ sư phần mềm | Startup founder",
    };

    private static final String[] POST_CONTENTS = {
        "Hôm nay mình vừa hoàn thành dự án Spring Boot đầu tiên! Cảm giác tuyệt vời khi thấy API hoạt động trơn tru 🎉 #lập_trình #java #springboot",
        "Mưa Sài Gòn chiều nay đẹp quá, ngồi quán cà phê nhìn mưa rơi mà lòng bình yên lạ 🌧️ #saigon #caphê #mưa",
        "Review phim Inception: Sau bao năm xem lại vẫn thấy xuất sắc. Nolan thật sự là thiên tài! ⭐⭐⭐⭐⭐ #phim #inception #review",
        "Vừa nấu xong tô bún bò Huế chuẩn vị, mời mọi người cùng thưởng thức 🍜 #nấuăn #bunboHue #ẩmthực",
        "Mình vừa đọc xong cuốn 'Clean Code' của Robert Martin. Recommend cho tất cả mọi người làm lập trình! 📚 #sách #cleancode #programming",
        "Chuyến đi Đà Lạt cuối tuần này thật tuyệt. Thời tiết mát mẻ, hoa nở đẹp, con người thân thiện 🌺 #dalat #dulich #travel",
        "Học React 3 tháng mà vẫn confused với useEffect 😅 Ai có tips gì share mình với nhé! #react #javascript #frontend",
        "Sáng nay gym xong uống protein shake, cảm giác khỏe re hẳn 💪 Ai tập cùng mình không? #gym #fitness #healthy",
        "MongoDB vs PostgreSQL: Mình đang phân vân chọn database cho dự án mới. Mọi người dùng cái nào? #database #mongodb #postgresql",
        "Sunset ở Mũi Né đẹp không thể tả được. Nếu chưa đến thì phải đến ngay! 🌅 #muine #sunset #vietnam",
        "Tips học tiếng Anh hiệu quả: Xem phim không sub, đọc sách tiếng Anh mỗi ngày, nói chuyện với người bản ngữ 🗣️ #english #learning",
        "Vừa deploy app lên AWS, mất 3 tiếng vì lỗi SSL certificate 😤 Nhưng cuối cùng cũng xong rồi! #aws #devops #deploy",
        "Cà phê trứng Hà Nội thật sự là best drink ever 😍 Ai chưa thử phải thử ngay! #hanoi #coffee #food",
        "Đang nghiên cứu về Machine Learning, có ai học cùng không? Share tài liệu cho nhau nha! 🤖 #ai #machinelearning #data",
        "Work from home productivity tips: Tắt điện thoại, đeo tai nghe, uống đủ nước, nghỉ 5 phút mỗi giờ ⏰ #wfh #productivity",
        "Vừa xong project freelance sau 2 tháng. Client happy, mình cũng happy 🎊 #freelance #developer #thànhcông",
        "Ai ở Hà Nội recommend quán ăn ngon không? Mình đang tìm quán bún chả ngon 🍖 #hanoi #food #recommendation",
        "TypeScript thật sự giúp code dễ maintain hơn rất nhiều. Từ bỏ JS thuần rồi, không quay lại đâu! #typescript #javascript #coding",
        "Chạy bộ sáng nay 10km trong 55 phút, personal best mới! 🏃‍♂️ #running #marathon #sport",
        "Hôm nay là ngày đầu tiên đi làm ở công ty mới. Nervous nhưng excited! 🙏 #newjob #career #startup",
        "Git conflict lúc 11pm thật sự là nightmare 😭 Nhớ mọi người làm việc theo branch và pull thường xuyên nhé! #git #dev",
        "Phở Hà Nội vs Phở Sài Gòn: Tranh luận muôn thuở. Mình team phở Hà Nội! 🍜 #pho #food #vietnam",
        "Vừa pass technical interview tại một startup unicorn! Cảm ơn mọi người đã support 🙌 #interview #job #success",
        "Docker + Kubernetes đã thay đổi cách mình deploy app hoàn toàn. Game changer! 🐳 #docker #kubernetes #devops",
        "Cuối tuần này mình tổ chức picnic ở công viên, ai muốn join thì DM mình nhé! ☀️ #picnic #weekend #friend",
    };

    private static final String[] COMMENTS = {
        "Hay quá bạn ơi! 👏", "Cảm ơn bạn đã chia sẻ!", "Mình đồng ý với bạn 100%!",
        "Bạn có thể nói thêm về điều này không?", "Thật sự rất hữu ích!",
        "Mình cũng đang gặp vấn đề tương tự 😅", "Bài viết hay lắm, bookmark lại đọc sau!",
        "Haha đúng quá bạn ơi 😄", "Wow impressive!", "Share cho bạn bè xem với!",
        "Cần thêm thông tin về cái này", "Trải nghiệm của bạn thật thú vị!",
        "Chúc mừng bạn nhé 🎉", "Nhớ post tiếp tục nhé!", "Like cái này ngay!",
        "Mình cũng nghĩ vậy, hoàn toàn đồng ý!", "Bạn recommend thêm tài liệu không?",
        "Great post! Keep it up 💪", "Cảm ơn vì đã chia sẻ kinh nghiệm!",
        "Hay thật, mình học được nhiều điều từ bài này!",
    };

    private static final String[] CHAT_MESSAGES = {
        "Hey, bạn khỏe không?", "Ơi lâu không gặp!", "Mình có thể hỏi bạn điều gì không?",
        "Hôm nay bạn có rảnh không?", "Dự án bạn đang làm thế nào rồi?",
        "Bạn có biết cách fix lỗi này không?", "Cảm ơn bạn rất nhiều nhé!",
        "Mình gửi tài liệu này cho bạn tham khảo", "Khi nào bạn rảnh mình nói chuyện nhé",
        "Bạn đang dùng framework gì vậy?", "Cho mình xin số điện thoại với!",
        "OK, mình sẽ xem qua và phản hồi sau", "Bài giải của bạn hay lắm!",
        "Ừ mình đồng ý với cách làm đó", "Hẹn gặp cuối tuần nhé!",
        "Mình vừa đọc bài post của bạn, hay lắm!", "Bạn có thể giải thích thêm không?",
        "Done! Mình đã hoàn thành rồi", "Cần giúp gì không?", "Thanks bạn nhiều lắm! 🙏",
    };

    private static final String[] HASHTAGS = {
        "lập_trình", "java", "springboot", "react", "javascript", "python",
        "ai", "machinelearning", "saigon", "hanoi", "dalat", "dulich",
        "food", "ẩmthực", "coding", "developer", "startup", "career",
        "fitness", "travel", "photography", "lifestyle", "vietnam", "technology",
    };

    private static final String[] AVATAR_COLORS = {
        "4648d4", "e91e63", "9c27b0", "673ab7", "3f51b5",
        "2196f3", "00bcd4", "009688", "4caf50", "ff9800",
        "ff5722", "795548", "607d8b", "f44336", "8bc34a",
    };

    // ── Endpoints ────────────────────────────────────────────────────────────

    /** POST /api/dev/seed */
    @PostMapping("/seed")
    public ResponseEntity<ApiResponse<Map<String, Object>>> seed(
            @RequestParam(defaultValue = "20")  int users,
            @RequestParam(defaultValue = "200") int posts,
            @RequestParam(defaultValue = "5")   int commentsPerPost,
            @RequestParam(defaultValue = "8")   int likesPerPost,
            @RequestParam(defaultValue = "3")   int bookmarksPerPost,
            @RequestParam(defaultValue = "30")  int conversations) {

        log.info("🌱 Starting seed: {} users, {} posts", users, posts);
        long t0 = System.currentTimeMillis();

        // 1. Users
        List<User> savedUsers = seedUsers(users);
        log.info("  ✅ {} users", savedUsers.size());

        // 2. Follow relationships
        int follows = seedFollows(savedUsers);
        log.info("  ✅ {} follows", follows);

        // 3. Posts
        List<Post> savedPosts = seedPosts(savedUsers, posts);
        log.info("  ✅ {} posts", savedPosts.size());

        // 4. Comments
        int commentCount = seedComments(savedUsers, savedPosts, commentsPerPost);
        log.info("  ✅ {} comments", commentCount);

        // 5. Likes
        int likeCount = seedLikes(savedUsers, savedPosts, likesPerPost);
        log.info("  ✅ {} likes", likeCount);

        // 6. Bookmarks
        int bookmarkCount = seedBookmarks(savedUsers, savedPosts, bookmarksPerPost);
        log.info("  ✅ {} bookmarks", bookmarkCount);

        // 7. Notifications
        int notifCount = seedNotifications(savedUsers, savedPosts);
        log.info("  ✅ {} notifications", notifCount);

        // 8. Conversations + messages
        int msgCount = seedChats(savedUsers, conversations);
        log.info("  ✅ {} chat messages in {} conversations", msgCount, conversations);

        long elapsed = System.currentTimeMillis() - t0;
        log.info("🌱 Seed complete in {}ms", elapsed);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("users",         savedUsers.size());
        result.put("follows",       follows);
        result.put("posts",         savedPosts.size());
        result.put("comments",      commentCount);
        result.put("likes",         likeCount);
        result.put("bookmarks",     bookmarkCount);
        result.put("notifications", notifCount);
        result.put("chatMessages",  msgCount);
        result.put("elapsedMs",     elapsed);

        return ResponseEntity.ok(ApiResponse.success(result, "Seed hoàn tất!"));
    }

    /** DELETE /api/dev/seed/reset — xóa hết + seed lại */
    @DeleteMapping("/seed/reset")
    public ResponseEntity<ApiResponse<String>> reset(
            @RequestParam(defaultValue = "20")  int users,
            @RequestParam(defaultValue = "200") int posts) {

        log.warn("⚠️  Resetting ALL collections...");
        notificationRepository.deleteAll();
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        bookmarkRepository.deleteAll();
        likeRepository.deleteAll();
        commentRepository.deleteAll();
        followRepository.deleteAll();
        postRepository.deleteAll();
        // keep the original seed user, remove extra ones
        userRepository.findAll().stream()
                .filter(u -> !u.getEmail().equals("test@socialhub.com"))
                .forEach(u -> userRepository.delete(u));

        log.warn("⚠️  All collections cleared");
        seed(users, posts, 5, 8, 3, 30);
        return ResponseEntity.ok(ApiResponse.success("Reset + reseed done", "OK"));
    }

    // ── Seed methods ─────────────────────────────────────────────────────────

    private List<User> seedUsers(int count) {
        List<User> result = new ArrayList<>();
        // Always include existing users
        result.addAll(userRepository.findAll());
        Set<String> existingEmails = new HashSet<>();
        result.forEach(u -> existingEmails.add(u.getEmail()));

        String encodedPwd = passwordEncoder.encode("Test@1234");
        for (int i = 0; i < count; i++) {
            String name  = DISPLAY_NAMES[i % DISPLAY_NAMES.length];
            String slug  = toSlug(name) + (i > DISPLAY_NAMES.length ? i : "");
            String email = slug.replace("-", "") + i + "@socialhub.com";
            if (existingEmails.contains(email)) continue;

            String color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            String initials = Arrays.stream(name.split(" "))
                    .map(w -> String.valueOf(w.charAt(0)))
                    .reduce("", String::concat)
                    .substring(0, Math.min(2, name.replaceAll("[^A-ZĐ]", "").length()));

            Instant created = Instant.now().minus(RNG.nextInt(365), ChronoUnit.DAYS);
            User u = userRepository.save(User.builder()
                    .username(slug + i)
                    .email(email)
                    .passwordHash(encodedPwd)
                    .displayName(name)
                    .bio(BIOS[i % BIOS.length])
                    .avatarUrl("https://ui-avatars.com/api/?name=" +
                            name.replace(" ", "+") + "&background=" + color + "&color=fff&size=128")
                    .role("USER")
                    .status("ACTIVE")
                    .createdAt(created)
                    .updatedAt(created)
                    .build());
            result.add(u);
            existingEmails.add(email);
        }
        return result;
    }

    private int seedFollows(List<User> users) {
        int count = 0;
        for (User u : users) {
            // Each user follows 3–8 random others
            int n = 3 + RNG.nextInt(6);
            List<User> shuffled = new ArrayList<>(users);
            Collections.shuffle(shuffled, RNG);
            for (int i = 0; i < Math.min(n, shuffled.size()); i++) {
                User target = shuffled.get(i);
                if (target.getId().equals(u.getId())) continue;
                if (followRepository.existsByFollowerIdAndFollowingId(u.getId(), target.getId())) continue;
                followRepository.save(Follow.builder()
                        .followerId(u.getId())
                        .followingId(target.getId())
                        .createdAt(Instant.now().minus(RNG.nextInt(200), ChronoUnit.DAYS))
                        .build());
                count++;
            }
        }
        return count;
    }

    private List<Post> seedPosts(List<User> users, int total) {
        List<Post> result = new ArrayList<>();
        for (int i = 0; i < total; i++) {
            User author = users.get(RNG.nextInt(users.size()));
            String content = POST_CONTENTS[RNG.nextInt(POST_CONTENTS.length)];

            // Extract hashtags from content
            List<String> tags = new ArrayList<>();
            for (String word : content.split("\\s+")) {
                if (word.startsWith("#")) {
                    String tag = word.substring(1).replaceAll("[^a-zA-Z0-9_àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]", "").toLowerCase();
                    if (!tag.isEmpty()) tags.add(tag);
                }
            }
            // Add 1–3 random extra hashtags
            for (int h = 0; h < 1 + RNG.nextInt(3); h++) {
                tags.add(HASHTAGS[RNG.nextInt(HASHTAGS.length)]);
            }

            String[] visibilities = {"PUBLIC", "PUBLIC", "PUBLIC", "FOLLOWERS", "PRIVATE"};
            String visibility = visibilities[RNG.nextInt(visibilities.length)];
            Instant created = Instant.now().minus(RNG.nextInt(180), ChronoUnit.DAYS)
                    .minus(RNG.nextInt(1440), ChronoUnit.MINUTES);

            Post p = postRepository.save(Post.builder()
                    .authorId(author.getId())
                    .content(content)
                    .media(new ArrayList<>())
                    .hashtags(tags)
                    .visibility(visibility)
                    .likeCount(0)
                    .commentCount(0)
                    .shareCount(RNG.nextInt(50))
                    .createdAt(created)
                    .updatedAt(created)
                    .build());
            result.add(p);
        }
        return result;
    }

    private int seedComments(List<User> users, List<Post> posts, int avgPerPost) {
        int count = 0;
        for (Post post : posts) {
            int n = Math.max(0, avgPerPost - 2 + RNG.nextInt(5));
            int addedToPost = 0;
            for (int i = 0; i < n; i++) {
                User commenter = users.get(RNG.nextInt(users.size()));
                Instant created = post.getCreatedAt().plus(RNG.nextInt(60) + 1, ChronoUnit.MINUTES);

                // Save without lambda — no effectively-final issue
                Comment saved = commentRepository.save(Comment.builder()
                        .postId(post.getId())
                        .authorId(commenter.getId())
                        .content(COMMENTS[RNG.nextInt(COMMENTS.length)])
                        .likeCount(RNG.nextInt(10))
                        .replyCount(0)
                        .createdAt(created)
                        .updatedAt(created)
                        .build());
                count++;

                // 50% chance of 1–2 replies
                if (RNG.nextBoolean()) {
                    int replies = 1 + RNG.nextInt(2);
                    int replyCount = 0;
                    for (int r = 0; r < replies; r++) {
                        User replier = users.get(RNG.nextInt(users.size()));
                        commentRepository.save(Comment.builder()
                                .postId(post.getId())
                                .authorId(replier.getId())
                                .content(COMMENTS[RNG.nextInt(COMMENTS.length)])
                                .parentCommentId(saved.getId())
                                .likeCount(RNG.nextInt(5))
                                .replyCount(0)
                                .createdAt(created.plus(r + 1, ChronoUnit.MINUTES))
                                .updatedAt(created.plus(r + 1, ChronoUnit.MINUTES))
                                .build());
                        count++;
                        replyCount++;
                    }
                    // Update parent replyCount without lambda
                    saved.setReplyCount(replyCount);
                    commentRepository.save(saved);
                }

                addedToPost++;
            }
            // Update post commentCount once per post
            post.setCommentCount(post.getCommentCount() + addedToPost);
            postRepository.save(post);
        }
        return count;
    }

    private int seedLikes(List<User> users, List<Post> posts, int avgPerPost) {
        int count = 0;
        for (Post post : posts) {
            int n = Math.max(0, avgPerPost - 3 + RNG.nextInt(7));
            Set<String> liked = new HashSet<>();
            for (int i = 0; i < n && i < users.size(); i++) {
                User liker = users.get(RNG.nextInt(users.size()));
                if (liked.contains(liker.getId())) continue;
                liked.add(liker.getId());
                likeRepository.save(Like.builder()
                        .userId(liker.getId())
                        .postId(post.getId())
                        .createdAt(post.getCreatedAt().plus(RNG.nextInt(120), ChronoUnit.MINUTES))
                        .build());
                count++;
            }
            post.setLikeCount(liked.size());
            postRepository.save(post);
        }
        return count;
    }

    private int seedBookmarks(List<User> users, List<Post> posts, int avgPerPost) {
        int count = 0;
        for (Post post : posts) {
            int n = RNG.nextInt(avgPerPost + 1);
            Set<String> bookmarked = new HashSet<>();
            for (int i = 0; i < n && i < users.size(); i++) {
                User u = users.get(RNG.nextInt(users.size()));
                if (bookmarked.contains(u.getId())) continue;
                bookmarked.add(u.getId());
                try {
                    bookmarkRepository.save(Bookmark.builder()
                            .userId(u.getId())
                            .postId(post.getId())
                            .createdAt(post.getCreatedAt().plus(RNG.nextInt(240), ChronoUnit.MINUTES))
                            .build());
                    count++;
                } catch (Exception ignored) { /* duplicate index */ }
            }
        }
        return count;
    }

    private int seedNotifications(List<User> users, List<Post> posts) {
        int count = 0;
        String[] types = {"LIKE", "COMMENT", "FOLLOW"};
        for (int i = 0; i < Math.min(300, posts.size() * 2); i++) {
            Post post = posts.get(RNG.nextInt(posts.size()));
            User actor = users.get(RNG.nextInt(users.size()));
            String type = types[RNG.nextInt(types.length)];
            if (actor.getId().equals(post.getAuthorId())) continue;

            Notification n = Notification.builder()
                    .recipientId(post.getAuthorId())
                    .actorId(actor.getId())
                    .type(type)
                    .postId("FOLLOW".equals(type) ? null : post.getId())
                    .isRead(RNG.nextBoolean())
                    .createdAt(post.getCreatedAt().plus(RNG.nextInt(48), ChronoUnit.HOURS))
                    .build();
            notificationRepository.save(n);
            count++;
        }
        return count;
    }

    private int seedChats(List<User> users, int convCount) {
        int msgCount = 0;
        Set<String> pairs = new HashSet<>();

        for (int c = 0; c < convCount && c < users.size() * (users.size() - 1) / 2; c++) {
            User a, b;
            String key;
            int attempts = 0;
            do {
                a = users.get(RNG.nextInt(users.size()));
                b = users.get(RNG.nextInt(users.size()));
                key = a.getId().compareTo(b.getId()) < 0
                        ? a.getId() + "|" + b.getId()
                        : b.getId() + "|" + a.getId();
                attempts++;
            } while ((a.getId().equals(b.getId()) || pairs.contains(key)) && attempts < 50);
            if (a.getId().equals(b.getId())) continue;
            pairs.add(key);

            // Check existing conversation
            Conversation conv;
            Optional<Conversation> existing = conversationRepository.findDirectConversation(a.getId(), b.getId());
            if (existing.isPresent()) {
                conv = existing.get();
            } else {
                final String idA = a.getId();
                final String idB = b.getId();
                conv = conversationRepository.save(
                        Conversation.builder()
                                .participantIds(List.of(idA, idB))
                                .createdAt(Instant.now().minus(RNG.nextInt(60), ChronoUnit.DAYS))
                                .build());
            }

            // 5–15 messages per conversation
            int msgs = 5 + RNG.nextInt(11);
            Instant msgTs = conv.getCreatedAt() != null
                    ? conv.getCreatedAt()
                    : Instant.now().minus(30, ChronoUnit.DAYS);
            String lastMsg = "";
            for (int m = 0; m < msgs; m++) {
                User sender = RNG.nextBoolean() ? a : b;
                String text = CHAT_MESSAGES[RNG.nextInt(CHAT_MESSAGES.length)];
                msgTs = msgTs.plus(RNG.nextInt(60) + 1, ChronoUnit.MINUTES);
                messageRepository.save(Message.builder()
                        .conversationId(conv.getId())
                        .senderId(sender.getId())
                        .content(text)
                        .messageType("TEXT")
                        .isRead(m < msgs - 2)
                        .createdAt(msgTs)
                        .build());
                lastMsg = text;
                msgCount++;
            }
            conv.setLastMessage(lastMsg.length() > 60 ? lastMsg.substring(0, 60) + "…" : lastMsg);
            conv.setLastMessageAt(msgTs);
            conversationRepository.save(conv);
        }
        return msgCount;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String toSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[àáâãäå]", "a").replaceAll("[èéêë]", "e")
                .replaceAll("[ìíîï]", "i").replaceAll("[òóôõö]", "o")
                .replaceAll("[ùúûü]", "u").replaceAll("[ýÿ]", "y")
                .replaceAll("đ", "d").replaceAll("ắằẳẵặ", "a").replaceAll("ếềểễệ", "e")
                .replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    }
}
