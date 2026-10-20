# SocialHub Frontend

React + Vite + Tailwind CSS frontend cho SocialHub - Creator Network

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm hoặc yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
socialhub-frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── Sidebar.jsx
│   │   ├── CommentItem.jsx
│   │   ├── PostCard.jsx
│   │   └── CreatePostBar.jsx
│   ├── pages/
│   │   ├── Feed.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Profile.jsx
│   │   ├── Search.jsx
│   │   ├── Notifications.jsx
│   │   ├── Bookmarks.jsx
│   │   ├── Messages.jsx
│   │   └── Settings.jsx
│   ├── layouts/
│   │   └── MainLayout.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── postService.js
│   │   ├── commentService.js
│   │   └── likeService.js
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── App.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 🎨 Design System

Sử dụng Material Design System với:

- **Fonts**: Inter (body), Plus Jakarta Sans (headlines)
- **Icons**: Material Symbols Outlined
- **Colors**: Custom Material Design palette (định nghĩa trong tailwind.config.js)
- **Styling**: Tailwind CSS + Custom components

## 🔌 API Integration

Frontend giao tiếp với backend Spring Boot qua Axios (`src/services/api.js`).

- Vite dev server proxy `/api/**` → `http://localhost:8080`
- Request interceptor tự động gắn `Authorization: Bearer <token>` từ localStorage
- Response interceptor tự redirect về `/login` khi nhận 401

## 📖 Available Scripts

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — Build for production
- `npm run preview` — Preview production build locally

## 🎯 Features

- ✅ Authentication (Login / Register)
- ✅ Protected routes (redirect về /login nếu chưa đăng nhập)
- ✅ Feed với tab For You / Following + phân trang
- ✅ Tạo bài viết (text + ảnh/video)
- ✅ Like bài viết (optimistic update)
- ✅ Comment + nested reply
- ✅ Chỉnh sửa / xóa bài viết của bản thân
- ✅ Upload ảnh qua Imgur
- ⏳ Profile page
- ⏳ Search
- ⏳ Notifications
- ⏳ Messages (WebSocket)
- ⏳ Bookmarks

## 📱 Responsive Design

- Desktop: Full layout (1400px max-width)
- Tablet: Sidebar + Feed
- Mobile: Stack layout (Todo)

## 🔗 Backend Integration

Backend chạy tại `http://localhost:8080`
Frontend dev server: `http://localhost:5173`

Proxy được cấu hình trong `vite.config.js` cho tất cả request `/api/**`.

## 🛠️ Technology Stack

- React 18.2
- Vite 5.0
- React Router 6.20
- Tailwind CSS 3.4
- Axios 1.6

---

**Status**: Đang phát triển — auth + feed + post CRUD + like + comment hoạt động end-to-end
