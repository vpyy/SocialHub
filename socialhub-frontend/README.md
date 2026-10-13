# SocialHub Frontend

React + Vite + Tailwind CSS frontend cho SocialHub - Creator Network

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
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
│   │   ├── PostCard.jsx
│   │   └── CreatePostBar.jsx
│   ├── pages/
│   │   ├── Feed.jsx
│   │   ├── Profile.jsx
│   │   ├── Search.jsx
│   │   ├── Notifications.jsx
│   │   ├── Bookmarks.jsx
│   │   ├── Messages.jsx
│   │   └── Settings.jsx
│   ├── layouts/
│   │   └── MainLayout.jsx
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

Frontend hiện đang dùng mock data. Để kết nối với backend:

1. Cập nhật `vite.config.js` proxy nếu cần
2. Tạo API service layer (`src/services/api.js`)
3. Replace mock data bằng API calls

## 📖 Available Scripts

- `npm run dev` - Start Vite dev server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🎯 Features (In Development)

- ✅ Responsive Layout (Sidebar + Feed + Right Panel)
- ✅ Post Card Component
- ✅ Mock Post Data
- ✅ Routing (React Router)
- ✅ Tailwind CSS Theme
- ⏳ Authentication (Todo)
- ⏳ Real API Integration (Todo)
- ⏳ WebSocket for Chat (Todo)

## 📱 Responsive Design

- Desktop: Full layout (1400px max-width)
- Tablet: Sidebar + Feed
- Mobile: Stack layout (Todo)

## 🔗 Backend Integration

Backend runs on `http://localhost:8080`
Frontend dev server: `http://localhost:5173`

Proxy configured in vite.config.js cho /api requests

## 🛠️ Technology Stack

- React 18.2
- Vite 5.0
- React Router 6.20
- Tailwind CSS 3.4
- Axios 1.6

---

**Status**: Giai đoạn 2 - Frontend Development đang tiến hành
