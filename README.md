# SocialHub — Mạng Xã Hội Full-Stack

SocialHub là một ứng dụng mạng xã hội full-stack gồm backend (Spring Boot + MongoDB) và frontend (React + Vite + Tailwind CSS), hỗ trợ đăng bài, theo dõi, nhắn tin realtime, gọi thoại/video, thông báo WebSocket, và nhiều tính năng khác.

---

## 📑 Mục Lục

- [Tổng Quan Công Nghệ](#-tổng-quan-công-nghệ)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Tính Năng Chính](#-tính-năng-chính)
- [Cài Đặt & Chạy](#-cài-đặt--chạy)
- [API Endpoints](#-api-endpoints)
- [WebSocket & Realtime](#-websocket--realtime)
- [Frontend Chi Tiết](#-frontend-chi-tiết)
- [Backend Chi Tiết](#-backend-chi-tiết)
- [Biến Môi Trường](#-biến-môi-trường)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tổng Quan Công Nghệ

| Layer | Công nghệ | Phiên bản |
|-------|-----------|-----------|
| **Backend** | Spring Boot | 3.5.1 |
| | Java | 17 LTS |
| | Spring Security | 6.x (JWT) |
| | Spring Data MongoDB | — |
| | Spring WebSocket (STOMP) | — |
| | MongoDB | 7.x+ |
| | JWT (jjwt) | 0.12.3 |
| | Swagger/OpenAPI | 2.5.0 |
| | Lombok | — |
| **Frontend** | React | 18.2 |
| | Vite | 5.4 |
| | Tailwind CSS | 3.4 |
| | React Router | 6.x |
| | Axios | 1.6 |
| | STOMP.js + SockJS | — |
| | i18next (đa ngôn ngữ) | — |

---

## 📁 Cấu Trúc Dự Án

```
SocialHub/
├── socialhub-backend/          # Spring Boot REST API + WebSocket
│   ├── src/main/java/com/socialhub/
│   │   ├── SocialHubApplication.java        # Entry point
│   │   ├── auth/                             # Đăng ký, đăng nhập, JWT
│   │   │   ├── controller/AuthController
│   │   │   ├── filter/JwtAuthenticationFilter
│   │   │   ├── model/AuthUser
│   │   │   └── util/JwtTokenProvider
│   │   ├── user/                             # Hồ sơ người dùng, follow, block, nickname
│   │   │   ├── controller/UserController
│   │   │   ├── service/UserService
│   │   │   ├── repository/UserRepository
│   │   │   └── document/User
│   │   ├── post/                             # Bài viết, feed, like, comment, share, repost
│   │   │   ├── controller/PostController
│   │   │   ├── service/PostService
│   │   │   ├── repository/PostRepository
│   │   │   └── document/Post
│   │   ├── social/                           # Follow system
│   │   │   ├── document/Follow
│   │   │   ├── repository/FollowRepository
│   │   │   └── service/FollowService
│   │   ├── chat/                             # Chat 1-1, nhóm, tin nhắn, gọi
│   │   │   ├── controller/ChatController
│   │   │   ├── service/ChatService
│   │   │   ├── repository/ConversationRepository, MessageRepository
│   │   │   ├── document/Conversation, Message
│   │   │   └── dto/ (ConversationDto, MessageDto, SendMessageRequest, ...)
│   │   ├── notification/                     # Thông báo realtime
│   │   │   ├── controller/NotificationController
│   │   │   ├── service/NotificationService   # Gửi call:incoming qua WebSocket
│   │   │   ├── document/Notification
│   │   │   └── repository/NotificationRepository
│   │   ├── websocket/                        # STOMP WebSocket config
│   │   │   └── config/WebSocketConfig         # Endpoint /ws + JWT auth
│   │   ├── recommendation/                    # Gợi ý bài viết, người dùng
│   │   ├── search/                            # Tìm kiếm users, posts, hashtags
│   │   ├── common/                            # ApiResponse, exceptions, error handling
│   │   ├── config/                           # SecurityConfig, FileUploadConfig
│   │   ├── dev/                               # DataInitializer, DevSeedController
│   │   └── health/                            # Health check endpoints
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── application-local.yml
│   ├── pom.xml
│   ├── .env.example
│   └── README.md
│
├── socialhub-frontend/         # React SPA
│   ├── src/
│   │   ├── App.jsx                            # Router chính
│   │   ├── main.jsx                           # Entry point
│   │   ├── pages/                             # 11 trang
│   │   │   ├── Login.jsx, Register.jsx        # Auth
│   │   │   ├── Feed.jsx                        # Trang chủ (feed)
│   │   │   ├── Discover.jsx                    # Khám phá (bài viết nổi bật)
│   │   │   ├── Profile.jsx                     # Hồ sơ người dùng
│   │   │   ├── PostDetail.jsx                  # Chi tiết bài viết + comments
│   │   │   ├── Search.jsx                      # Tìm kiếm
│   │   │   ├── Messages.jsx                   # Chat (1-1, nhóm, gọi, reactions)
│   │   │   ├── Notifications.jsx              # Thông báo
│   │   │   ├── Bookmarks.jsx                  # Bài viết đã lưu
│   │   │   └── Settings.jsx                    # Cài đặt
│   │   ├── components/                        # Component dùng chung
│   │   │   ├── PostCard.jsx                   # Hiển thị bài viết
│   │   │   ├── CommentItem.jsx                # Bình luận
│   │   │   ├── CreatePostBar.jsx              # Tạo bài viết
│   │   │   ├── AdvancedCallModal.jsx          # Modal gọi thoại/video
│   │   │   ├── common/Sidebar.jsx             # Thanh điều hướng
│   │   │   ├── ThemeToggle.jsx                # Dark/light mode
│   │   │   ├── LanguageSwitcher.jsx           # Chuyển ngôn ngữ
│   │   │   ├── EngagementModal.jsx            # Danh sách like/repost
│   │   │   ├── RepostButton.jsx, ShareButton.jsx
│   │   ├── services/                          # API service layer
│   │   │   ├── api.js                         # Axios client + JWT interceptor
│   │   │   ├── chatService.js                 # Chat API
│   │   │   ├── postService.js                 # Post API
│   │   │   ├── userService.js                 # User API
│   │   │   ├── websocketService.js            # STOMP WebSocket connection
│   │   │   ├── notificationService.js
│   │   │   ├── commentService.js, likeService.js
│   │   │   ├── bookmarkService.js, blockService.js
│   │   │   ├── callService.js, nicknameService.js
│   │   │   └── groupChatService.js
│   │   ├── utils/
│   │   │   ├── callStateMachine.js            # CallStateManager (10 trạng thái)
│   │   │   └── callControls.js                # CallControls, Permissions, NetworkRecovery
│   │   ├── context/ThemeContext.jsx           # Dark/light mode context
│   │   ├── hooks/useTheme.js, useInfiniteScroll.js
│   │   ├── i18n/config.js                    # Việt-Anh
│   │   └── layouts/MainLayout.jsx            # Layout bảo vệ route
│   ├── vite.config.js                         # Vite + proxy API/WebSocket
│   ├── tailwind.config.js
│   └── package.json
│
├── MESSAGES_FEATURES_GUIDE.md                 # Hướng dẫn tính năng chat
└── README.md                                  # File này
```

---

## ✨ Tính Năng Chính

### Auth & User
- **Đăng ký / Đăng nhập** với JWT (access token 24h)
- **Hồ sơ người dùng**: avatar, cover, bio, display name
- **Đổi mật khẩu**
- **Follow / Unfollow** (toggle)
- **Block / Unblock** người dùng
- **Nickname** cho từng người dùng trong chat

### Post System
- **Tạo bài viết** với text, ảnh, video, hashtags
- **Feed**: Following feed, Public feed, cá nhân hóa
- **Like / Unlike** bài viết
- **Comment** (có nested replies)
- **Share** bài viết
- **Repost** (chia sẻ lại)
- **Bookmark** bài viết
- **Edit / Delete** bài viết của mình
- **Visibility**: public / followers only

### Chat (Messages.jsx)
- **Chat 1-1**: tạo conversation tự động
- **Group chat**: tạo nhóm, thêm/xóa thành viên, đổi tên nhóm, set admin
- **Gửi tin nhắn**: text, ảnh, video, voice, chia sẻ bài viết
- **Edit / Delete tin nhắn** (chỉ tin nhắn của mình)
- **Unsend** (xóa cho tất cả)
- **Reactions / Emoji** (10 emoji)
- **Reply tin nhắn**
- **Pin / Unpin tin nhắn**
- **Tìm kiếm tin nhắn** trong conversation
- **Typing indicator** (đang nhập...)
- **Conversation settings**: archive, mute, pin
- **Block user** trong chat
- **Tạo nhóm chat**: chỉ hiện người đã chat hoặc đang follow

### Voice / Video Calls
- **Call State Machine**: 10 trạng thái (IDLE → CALLING → RINGING → CONNECTING → CONNECTED → ENDED/REJECTED/BUSY/MISSED/FAILED)
- **WebSocket signaling**: gửi `call:incoming` notification qua STOMP
- **Incoming call modal**: hiển thị người gọi, avatar, Accept/Decline
- **Call controls**: mute, video toggle, switch camera, speaker, PiP
- **Auto-timeout** 30s cho missed calls
- **Permissions handler**, Network recovery, Audio focus manager

### Notifications
- **Realtime qua WebSocket** (STOMP `/topic/notifications/{userId}`)
- **Loại thông báo**: LIKE, COMMENT, FOLLOW, MESSAGE, CALL
- **Unread count**
- **Mark all read / mark one read**

### Search & Discover
- **Tìm kiếm**: users, posts, hashtags
- **Discover**: bài viết nổi bật, người dùng gợi ý
- **Recommendations**: popular posts, suggested users

### UI/UX
- **Dark mode** (toggle)
- **Đa ngôn ngữ** (Tiếng Việt / English)
- **Responsive** (mobile-friendly)
- **Infinite scroll** cho feed
- **HMR** (Hot Module Replacement) trong dev

---

## 🚀 Cài Đặt & Chạy

### Yêu cầu

- **Java 17 LTS**
- **Node.js 18+**
- **MongoDB 7.x+** (chạy trên `localhost:27017`)
- **Maven** (hoặc dùng `mvnw` có sẵn)

### 1. Clone & cài đặt MongoDB

```bash
# Cài MongoDB Community Edition
# Windows: tải MSI từ https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: theo docs MongoDB

# Khởi động MongoDB
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
```

### 2. Chạy Backend

```bash
cd socialhub-backend

# Tạo file .env
cp .env.example .env
# (mặc định: mongodb://localhost:27017/socialhub, port 8080)

# Compile
./mvnw clean compile          # Windows: mvnw.cmd clean compile

# Chạy
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

Backend chạy tại `http://localhost:8080`

### 3. Chạy Frontend

```bash
cd socialhub-frontend

# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Frontend chạy tại `http://localhost:5173` (hoặc 5174 nếu 5173 đang dùng)

### 4. Seed data (dev only)

```bash
# Tạo dữ liệu mẫu (users, posts, follows)
curl -X POST http://localhost:8080/api/dev/seed?users=50
```

### 5. Tài khoản test

Sau khi seed data, đăng nhập bằng:
- **Username**: `nhu` hoặc `tran-van-phuc` (hoặc các user được seed)
- **Password**: `123456`

---

## 📡 API Endpoints

Base URL: `http://localhost:8080/api`

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/register` | Đăng ký |
| POST | `/auth/login` | Đăng nhập (trả JWT) |
| POST | `/auth/logout` | Đăng xuất |

### Users
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/users` | Danh sách user (phân trang) |
| GET | `/users/{username}` | Profile công khai |
| PUT | `/users/me` | Cập nhật profile |
| PUT | `/users/me/password` | Đổi mật khẩu |
| PUT | `/users/me/avatar` | Cập nhật avatar |
| PUT | `/users/me/cover` | Cập nhật cover |
| POST | `/users/{id}/follow` | Toggle follow/unfollow |
| GET | `/users/{id}/followers` | Danh sách followers |
| GET | `/users/{id}/following` | Danh sách following |
| POST | `/users/{id}/block` | Block user |
| DELETE | `/users/{id}/block` | Unblock user |
| GET | `/users/me/blocked` | Danh sách đã block |
| POST | `/users/{id}/nickname` | Set nickname |
| GET | `/users/{id}/nickname` | Get nickname |
| GET | `/users/{id}/reposts` | Bài viết đã repost |
| GET | `/users/{id}/liked-posts` | Bài viết đã like |
| GET | `/users/search?q=` | Tìm kiếm user |

### Posts
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/posts` | Tạo bài viết |
| GET | `/posts/feed` | Feed cá nhân hóa |
| GET | `/posts/public` | Feed công khai |
| GET | `/posts/following` | Feed từ người đang follow |
| GET | `/posts/{id}` | Chi tiết bài viết |
| PUT | `/posts/{id}` | Sửa bài viết |
| DELETE | `/posts/{id}` | Xóa bài viết |
| POST | `/posts/{id}/like` | Like/unlike |
| POST | `/posts/{id}/repost` | Repost |
| POST | `/posts/{id}/bookmark` | Bookmark |
| GET | `/posts/bookmarks` | Danh sách bookmark |

### Comments
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/posts/{id}/comments` | Tạo bình luận |
| GET | `/posts/{id}/comments` | Danh sách bình luận |
| DELETE | `/comments/{id}` | Xóa bình luận |

### Chat
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/conversations` | Tạo/lấy conversation 1-1 |
| POST | `/conversations/group` | Tạo group chat |
| GET | `/conversations` | Danh sách conversation |
| GET | `/conversations/{id}/messages` | Tin nhắn (phân trang) |
| POST | `/conversations/{id}/messages` | Gửi tin nhắn |
| PUT | `/conversations/{id}/messages/read` | Đánh dấu đã đọc |
| DELETE | `/conversations/{id}/messages/{msgId}` | Xóa tin nhắn |
| PUT | `/conversations/{id}/messages/{msgId}` | Sửa tin nhắn |
| POST | `/conversations/{id}/messages/{msgId}/reply` | Reply tin nhắn |
| DELETE | `/conversations/{id}/messages/{msgId}/unsend` | Unsend |
| POST | `/conversations/{id}/messages/{msgId}/pin` | Pin tin nhắn |
| DELETE | `/conversations/{id}/messages/{msgId}/pin` | Unpin |
| GET | `/conversations/{id}/messages/search` | Tìm kiếm tin nhắn |
| POST | `/conversations/{id}/messages/{msgId}/reactions` | Thêm reaction |
| PUT | `/conversations/{id}` | Cập nhật group (tên, thành viên) |
| DELETE | `/conversations/{id}/leave` | Rời nhóm |
| POST | `/conversations/{id}/typing` | Typing indicator |
| POST | `/conversations/{id}/calls` | Khởi tạo cuộc gọi |
| PUT | `/conversations/calls/{callId}` | Cập nhật trạng thái gọi |

### Notifications
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/notifications` | Danh sách thông báo |
| GET | `/notifications/unread-count` | Số thông báo chưa đọc |
| PUT | `/notifications/read-all` | Đánh dấu tất cả đã đọc |
| PUT | `/notifications/{id}/read` | Đánh dấu 1 cái đã đọc |

### Search
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/search/users?q=` | Tìm user |
| GET | `/search/posts?q=` | Tìm bài viết |
| GET | `/search/hashtags?tag=` | Tìm theo hashtag |

### Recommendations
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/recommendations/popular-posts` | Bài viết nổi bật |
| GET | `/recommendations/suggested-users` | Người dùng gợi ý |

### Dev
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/dev/seed?users=50` | Tạo dữ liệu mẫu |
| DELETE | `/dev/seed/reset` | Xóa & tạo lại data |

### Health
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/health` | Trạng thái server |
| GET | `/health/detailed` | Chi tiết |
| GET | `/health/db` | Kiểm tra MongoDB |

### Docs
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/api-docs`

---

## 🔌 WebSocket & Realtime

### Cấu hình

Backend đăng ký STOMP endpoint tại `/ws` với SockJS fallback. WebSocket broker dùng simple in-memory broker trên prefix `/topic` và `/queue`.

### Authentication

- SockJS handshake: endpoint `/ws/**` được `permitAll` trong SecurityConfig (không cần JWT cho handshake)
- STOMP CONNECT: client gửi header `Authorization: Bearer <token>`, `WebSocketConfig` validate JWT qua `JwtTokenProvider`

### Topics

| Topic | Mô tả |
|-------|-------|
| `/topic/notifications/{userId}` | Thông báo realtime (like, comment, follow, call:incoming) |

### Notification Types

```json
// Incoming call
{
  "type": "call:incoming",
  "callData": {
    "id": "call_xxx",
    "type": "VOICE",
    "initiator": "userId",
    "initiatorName": "Nguyễn Văn A",
    "initiatorAvatar": "url"
  },
  "timestamp": 1234567890
}

// Call accepted
{ "type": "call:accepted", "callId": "call_xxx" }

// Call rejected
{ "type": "call:rejected", "callId": "call_xxx" }

// Call ended
{ "type": "call:ended", "callId": "call_xxx" }
```

### Frontend WebSocket Service

`websocketService.js` quản lý kết nối:
- `connect(userId, onNotification)` — kết nối STOMP với JWT
- `disconnect()` — ngắt kết nối
- Auto-reconnect sau 5s nếu mất kết nối

---

## 🖥 Frontend Chi Tiết

### Routing (App.jsx)

```
/login          → Login (public)
/register        → Register (public)
/               → Feed (protected, MainLayout)
/discover       → Discover
/post/:id       → PostDetail
/profile/:username → Profile
/search         → Search
/notifications  → Notifications
/bookmarks      → Bookmarks
/messages       → Messages (chat)
/settings       → Settings
```

### API Client (api.js)

- Base URL: `http://localhost:8080/api` (config qua `VITE_API_BASE_URL`)
- Request interceptor: thêm `Authorization: Bearer <token>` và `X-User-Id`
- Response interceptor: trả `response.data` trực tiếp
- Timeout: 30s

### Vite Proxy

```js
proxy: {
  '/api': { target: 'http://localhost:8080', changeOrigin: true },
  '/ws':  { target: 'http://localhost:8080', changeOrigin: true, ws: true }
}
```

### Call System

**CallStateManager** (`utils/callStateMachine.js`):
- 10 states: IDLE, CALLING, RINGING, CONNECTING, CONNECTED, ENDED, REJECTED, BUSY, MISSED, FAILED
- State validation (chỉ cho phép transition hợp lệ)
- 30s timeout cho missed calls
- Event listener system

**CallControls** (`utils/callControls.js`):
- `CallControls`: mute, video toggle, camera switch, speaker
- `PermissionsHandler`: xin quyền mic/camera
- `NetworkRecovery`: auto-reconnect khi mất mạng
- `AudioFocusManager`: quản lý audio focus

**AdvancedCallModal** (`components/AdvancedCallModal.jsx`):
- Incoming call: hiện avatar, tên, Accept/Decline
- Outgoing call: hiện trạng thái "Đang gọi..."
- Connected: hiện timer, mute/video/camera/speaker controls
- Ringtone + vibration (mobile)

---

## ⚙️ Backend Chi Tiết

### Security (SecurityConfig.java)

- **JWT Filter**: `JwtAuthenticationFilter` extract token từ `Authorization` header, validate qua `JwtTokenProvider`
- **Public endpoints**: `/api/auth/**`, `/api/health/**`, `/api/posts/public`, `/api/posts/following`, `/api/users/*` (GET), `/ws/**`
- **CORS**: cho phép `localhost:5173`, `localhost:5174`, `localhost:3000`
- **Password**: BCrypt

### JWT (JwtTokenProvider.java)

- **JWT Secret**: Đọc từ biến môi trường `JWT_SECRET` (không có giá trị mặc định). Tạo mới bằng `openssl rand -base64 64` và đặt trong file `.env` (không commit).

### MongoDB Collections

| Collection | Document | Mô tả |
|-----------|----------|-------|
| `users` | `User` | Thông tin người dùng |
| `posts` | `Post` | Bài viết |
| `conversations` | `Conversation` | Chat 1-1 & group (field `isGroup` phân biệt) |
| `messages` | `Message` | Tin nhắn |
| `follows` | `Follow` | Quan hệ follow |
| `notifications` | `Notification` | Thông báo |
| `user_conversation_settings` | `UserConversationSettings` | Archive, mute, pin per user |

### Architecture Pattern

```
Controller → Service → Repository → MongoDB
                ↓
           Document (entity)
```

- **Controller**: nhận HTTP request, trả `ApiResponse<T>` wrapper
- **Service**: business logic, validation
- **Repository**: Spring Data MongoDB interface
- **Document**: MongoDB entity annotation `@Document`
- **DTO**: request/response objects (Lombok `@Data`)

### ApiResponse Wrapper

```json
{
  "success": true,
  "data": { ... },
  "message": "OK"
}
```

Error:
```json
{
  "success": false,
  "error": { "code": 404, "message": "Not found" }
}
```

---

## 🔧 Biến Môi Trường

### Backend (.env)

```env
MONGODB_URI=mongodb://localhost:27017/socialhub
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=local
JWT_SECRET=<generate-with: openssl rand -base64 64>
JWT_EXPIRATION_MS=86400000
```

### Frontend

```env
# Tạo file .env trong socialhub-frontend/ (tùy chọn)
VITE_API_BASE_URL=http://localhost:8080/api
```

Mặc định frontend gọi tới `http://localhost:8080/api` nếu không set `VITE_API_BASE_URL`.

---

## 🐛 Troubleshooting

### Backend không khởi động

| Lỗi | Nguyên nhân | Khắc phục |
|------|-------------|-----------|
| `Connection refused 27017` | MongoDB chưa chạy | `net start MongoDB` (Windows) |
| `Port 8080 already in use` | Port bị chiếm | `netstat -ano \| findstr :8080` rồi `taskkill /PID <pid> /F` |
| `Bean conflict` | Duplicate config | Kiểm tra trùng `@Configuration` class |
| `401 on /ws/info` | SecurityConfig chặn SockJS | Đảm bảo `.requestMatchers("/ws", "/ws/**").permitAll()` |

### Frontend lỗi

| Lỗi | Nguyên nhân | Khắc phục |
|------|-------------|-----------|
| `global is not defined` | sockjs-client cần polyfill | Đã fix: `define: { global: 'window' }` trong vite.config.js |
| `CORS blocked` | Backend không cho phép origin | Thêm port frontend vào `allowedOrigins` trong SecurityConfig |
| `ERR_CONNECTION_REFUSED` | Backend chưa chạy | Khởi động backend trước |
| `401 on WebSocket` | JWT không gửi trong STOMP header | Kiểm tra `connectHeaders` có `Authorization: Bearer <token>` |

### Chat / Call không hoạt động

1. **Receiver không nhận incoming call**: Kiểm tra WebSocket đã connect chưa (console log `[WebSocket] Connecting`)
2. **401 trên /ws/info**: SecurityConfig phải `permitAll` cho `/ws/**`
3. **STOMP không subscribe**: Kiểm tra `websocketService.connect()` được gọi trong `useEffect`

---

## 📝 Ghi Chú

- Backend chạy port **8080**, frontend port **5173** (hoặc **5174** nếu 5173 bị chiếm)
- MongoDB mặc định `localhost:27017`, database `socialhub`
- JWT token lưu trong `localStorage` key `token`, user info trong key `user`
- API client gửi cả `Authorization: Bearer` header và `X-User-Id` header (fallback)
- Chat 1-1 và group dùng cùng collection `conversations`, phân biệt bằng field `isGroup`
- Tạo group chat chỉ hiện người đã chat hoặc đang follow (không hiện tất cả user)
