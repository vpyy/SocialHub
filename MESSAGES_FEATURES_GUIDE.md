# Messages.jsx - Hướng Dẫn Toàn Bộ Tính Năng

## 📋 Tổng Quan

File `Messages.jsx` đã được cập nhật với **8 tính năng chính** và giữ lại tất cả chức năng cũ. Dưới đây là chi tiết từng tính năng:

---

## 🎯 Các Tính Năng Được Thêm

### 1️⃣ **Edit/Delete Tin Nhắn** ✏️🗑️

#### Cách Hoạt Động:
- Hover vào một tin nhắn của bạn → Hiển thị nút **Edit** và **Delete**
- Nút **Edit**: Chỉnh sửa nội dung tin nhắn
- Nút **Delete**: Xóa tin nhắn (yêu cầu xác nhận)

#### State:
```javascript
const [editingMessageId, setEditingMessageId] = useState(null)
const [editContent, setEditContent] = useState('')
const [editLoading, setEditLoading] = useState(false)
```

#### Hàm Xử Lý:
- `handleEditMessage(msg)` - Bắt đầu chỉnh sửa
- `handleSaveEdit()` - Lưu thay đổi
- `handleCancelEdit()` - Hủy chỉnh sửa
- `handleDeleteMessage(messageId)` - Xóa tin nhắn

#### UI:
- Thanh chỉnh sửa xuất hiện ở dưới phần tin nhắn khi đang chỉnh sửa
- Nút Edit/Delete nằm trên tin nhắn khi hover

---

### 2️⃣ **Tìm Kiếm Tin Nhắn (Search)** 🔍

#### Cách Hoạt Động:
- Nhấn nút **Search** ở header chat
- Nhập từ khóa tìm kiếm
- Danh sách kết quả được hiển thị
- Chọn một kết quả để xem

#### State:
```javascript
const [messageSearch, setMessageSearch] = useState({ 
  query: '', 
  results: [], 
  show: false, 
  searching: false 
})
```

#### Hàm Xử Lý:
- `handleSearchMessages()` - Thực hiện tìm kiếm
- `handleSelectSearchResult(msg)` - Chọn kết quả

#### API:
```javascript
chatService.searchMessages(conversationId, query, page, size)
```

---

### 3️⃣ **Reactions/Emoji** 😊👍❤️

#### Cách Hoạt Động:
- Hover vào tin nhắn → Nút **Add Reaction**
- Chọn emoji từ danh sách 10 emoji phổ biến
- Reactions được hiển thị dưới tin nhắn
- Click vào reaction để thêm/bỏ

#### Emoji List:
```javascript
['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '✨']
```

#### State:
```javascript
const [reactionsModal, setReactionsModal] = useState({ 
  show: false, 
  messageId: null 
})
```

#### Hàm Xử Lý:
- `handleAddReaction(emoji)` - Thêm reaction

#### UI:
- Modal hiển thị grid emoji
- Reactions hiển thị với số lượng và tooltip tên người dùng

---

### 4️⃣ **Cập Nhật Thông Tin Nhóm** 👥📝

#### Cách Hoạt Động (Chỉ cho Group Chat):
- Nhấn nút **Group** ở header chat
- Modal mở với các tùy chọn:
  - **Đổi tên nhóm**
  - **Xem danh sách thành viên**
  - **Xóa thành viên** (bấm X cạnh tên)
- Nhấn **Cập nhật** để lưu thay đổi

#### State:
```javascript
const [groupManageModal, setGroupManageModal] = useState({ 
  show: false, 
  conversationId: null, 
  loading: false, 
  groupData: {} 
})
```

#### Hàm Xử Lý:
- `handleUpdateGroupInfo()` - Cập nhật thông tin nhóm

#### API:
```javascript
chatService.updateGroup(conversationId, groupData)
```

---

### 5️⃣ **Thoát Nhóm (Leave Group)** 🚪

#### Cách Hoạt Động:
- Mở modal **Quản lý nhóm**
- Nhấn nút **Thoát nhóm** (màu đỏ)
- Xác nhận thoát
- Bị xóa khỏi danh sách conversation

#### Hàm Xử Lý:
- `handleLeaveGroup()` - Thoát nhóm

#### API:
```javascript
chatService.leaveGroup(conversationId)
```

---

### 6️⃣ **Gọi Thoại (Voice Calls)** ☎️📞

#### Cách Hoạt Động:
- Nhấn nút **Call** (☎️) ở header chat
- Modal hiển thị với:
  - Avatar của người nhận
  - Tên và username
  - Nút xác nhận gọi
- Khởi tạo cuộc gọi thoại

#### State:
```javascript
const [callModal, setCallModal] = useState({ 
  show: false, 
  calleeId: null, 
  callType: 'VOICE', 
  loading: false 
})
const [ongoingCall, setOngoingCall] = useState(null)
```

#### Hàm Xử Lý:
- `handleInitiateCall(callType)` - Khởi tạo cuộc gọi
- `handleEndCall(callId)` - Kết thúc cuộc gọi

#### API:
```javascript
chatService.initiateCall(conversationId, calleeId, callType)
chatService.updateCallStatus(callId, 'ENDED')
```

#### Call Type:
- `'VOICE'` - Gọi thoại
- `'VIDEO'` - Gọi video (nút cạnh)

---

### 7️⃣ **Typing Indicator** ⌨️

#### Cách Hoạt Động:
- Khi bạn gõ tin nhắn → gửi "typing" event
- Header hiển thị "Người dùng đang nhập..."
- Có animation 3 chấm động

#### State:
```javascript
const [typingUsers, setTypingUsers] = useState([])
```

#### Hàm Xử Lý:
- `handleTyping()` - Gửi typing indicator
- Tự động xóa sau 3 giây

#### UI:
- Text + animation chấm ở header
- "Người dùng X đang nhập..."

---

### 8️⃣ **Voice Messages** 🎤

#### Cách Hoạt Động:
- Gửi tin nhắn loại `'VOICE'`
- Hiển thị icon **Mic** + player audio
- Click play để nghe

#### Loại Tin Nhắn:
```javascript
// messageType có thể là:
'TEXT'    // Tin nhắn văn bản
'IMAGE'   // Ảnh
'VOICE'   // Tin nhắn thoại
'POST'    // Bài viết chia sẻ
```

#### UI:
- Component hiển thị `<audio controls>`
- Thẻ hiển thị icon mic và player

---

## 🏗️ Cấu Trúc Code

### State Management
```javascript
// Tin nhắn
const [messages, setMessages] = useState([])
const [editingMessageId, setEditingMessageId] = useState(null)

// Tìm kiếm
const [searchQ, setSearchQ] = useState('')
const [messageSearch, setMessageSearch] = useState({...})

// Reactions
const [reactionsModal, setReactionsModal] = useState({...})

// Gọi
const [callModal, setCallModal] = useState({...})
const [ongoingCall, setOngoingCall] = useState(null)

// Nhóm
const [groupManageModal, setGroupManageModal] = useState({...})

// Typing
const [typingUsers, setTypingUsers] = useState([])
```

### Component Chính
```javascript
<Messages>
  ├── ConvItem (Danh sách conversation)
  ├── MessageBubble (Hiển thị tin nhắn với actions)
  └── Modals
      ├── NicknameModal
      ├── GroupChatModal
      ├── ReactionsModal
      ├── CallModal
      └── GroupManageModal
```

---

## 📱 UI/UX Improvements

### Message Bubble Actions
- **Hover** trên tin nhắn của bạn để thấy nút Edit, Delete, Add Reaction
- **Nút Edit** (✏️) - Chỉnh sửa
- **Nút Delete** (🗑️) - Xóa
- **Nút Add Reaction** (😊) - Thêm emoji

### Header Controls
- **☎️ Call** - Gọi thoại
- **📹 Videocam** - Gọi video
- **🔍 Search** - Tìm kiếm tin nhắn
- **👥 Group** - Quản lý nhóm (chỉ show khi group chat)

### Edit Bar
- Hiển thị khi chỉnh sửa tin nhắn
- Nền xanh nhạt để phân biệt
- Nút Lưu/Hủy

### Search Bar
- Thanh tìm kiếm ở giữa messages
- Hiển thị khi click nút Search
- Hỗ trợ Enter để search

---

## 🔌 API Integration

### Các Endpoint Được Sử Dụng

```javascript
// Edit/Delete
chatService.editMessage(conversationId, messageId, content)
chatService.deleteMessage(conversationId, messageId)

// Search
chatService.searchMessages(conversationId, query, page, size)

// Reactions
chatService.addReaction(conversationId, messageId, emoji)

// Group Management
chatService.updateGroup(conversationId, groupData)
chatService.leaveGroup(conversationId)

// Calls
chatService.initiateCall(conversationId, calleeId, callType)
chatService.updateCallStatus(callId, status)
```

---

## 🎨 Styling

Tất cả components sử dụng **Tailwind CSS** với dark mode support:
- `dark:` prefix cho dark mode
- Consistent indigo color scheme (indigo-600)
- Responsive design
- Smooth transitions

---

## 💡 Tips & Best Practices

### Typing Indicator
```javascript
// Auto-cleanup sau 3 giây
typingTimeoutRef.current = setTimeout(() => {
  setTypingUsers([])
}, 3000)
```

### Message Scroll
```javascript
// Chỉ auto-scroll khi user ở dưới cùng
if (isUserAtBottom.current) {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}
```

### Edit Mode
- Hiển thị thanh edit riêng biệt
- Không block UI chính
- Dễ dàng hủy hoặc lưu

---

## 🐛 Error Handling

Tất cả API calls đều có:
- Try/catch blocks
- Loading states
- User alerts
- Error logging (console)

```javascript
try {
  // API call
} catch (e) {
  console.error('Error:', e)
  alert('Thông báo lỗi cho user')
} finally {
  // Cleanup loading state
}
```

---

## 📝 Notes

1. **Giữ lại tất cả chức năng cũ**:
   - Tạo conversation mới
   - Gửi tin nhắn
   - Unread count
   - Avatar click → Profile
   - Block user
   - Set nickname
   - Create group chat

2. **Emoji List**: Có thể customize bằng cách thay đổi `EMOJI_LIST` constant

3. **Dark Mode**: Toàn bộ UI hỗ trợ dark mode

4. **Mobile Responsive**: Conversation list ẩn trên mobile (hidden md:flex)

---

## ✅ Checklist Tính Năng

- [x] Edit tin nhắn
- [x] Delete tin nhắn
- [x] Search tin nhắn
- [x] Reactions/Emoji
- [x] Update group info
- [x] Leave group
- [x] Voice calls
- [x] Typing indicator
- [x] Voice messages
- [x] Giữ lại tất cả chức năng cũ

---

## 📞 Support

Nếu có issue hoặc câu hỏi:
1. Kiểm tra console logs
2. Verify API endpoints hoạt động
3. Check service files có implementation

---

**Last Updated**: $(date)**  
**Version**: 2.0 (Full Featured)
