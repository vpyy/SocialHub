import { useState, useEffect, useRef, useCallback } from 'react'
import chatService from '../services/chatService'
import userService from '../services/userService'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Vừa xong'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút`
  if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

function Avatar({ src, name, size = 9 }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return src
    ? <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />
    : <div className={`w-${size} h-${size} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0`}>{initials}</div>
}

// ─── Conversation List Item ──────────────────────────────────────────────────

function ConvItem({ conv, currentUserId, isActive, onClick }) {
  const other = conv.participants?.find(p => p.userId !== currentUserId) || conv.participants?.[0]

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-50 ${isActive ? 'bg-indigo-50' : ''}`}
    >
      <div className="relative">
        <Avatar src={other?.avatarUrl} name={other?.displayName} size={11} />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
            {other?.displayName || other?.username || 'User'}
          </p>
          <span className="text-xs text-gray-400 shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
        </p>
      </div>
    </div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe }) {
  return (
    <div className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && <Avatar src={msg.senderAvatarUrl} name={msg.senderDisplayName} size={7} />}
      <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {msg.messageType === 'IMAGE' && msg.mediaUrl && (
          <img src={msg.mediaUrl} alt="media" className="rounded-2xl max-h-56 object-cover border border-gray-100" />
        )}
        {msg.messageType === 'POST' && msg.sharedPost && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm shadow-sm max-w-[260px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[14px] text-indigo-400">article</span>
              <span className="text-xs text-gray-400 font-medium">Bài viết được chia sẻ</span>
            </div>
            <p className="text-gray-700 line-clamp-3 text-xs leading-relaxed">{msg.sharedPost.content}</p>
          </div>
        )}
        {(msg.content) && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMe
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}>
            {msg.content}
          </div>
        )}
        <span className={`text-[10px] text-gray-400 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
          {formatTime(msg.createdAt)}
          {isMe && (
            <span className="ml-1 material-symbols-outlined text-[11px] align-middle">
              {msg.isRead ? 'done_all' : 'done'}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Messages() {
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId]   = useState(null)
  const [messages, setMessages]           = useState([])
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)

  // New conversation search
  const [showSearch, setShowSearch] = useState(false)
  const [searchQ, setSearchQ]       = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]   = useState(false)

  const bottomRef = useRef(null)
  const searchDebounce = useRef(null)

  // ── Load conversations ────────────────────────────────────────────────────

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setLoadingConvs(true)
    try {
      const res = await chatService.getConversations(0, 30)
      const data = res?.data ?? res
      setConversations(data?.content ?? [])
    } catch (e) { console.error(e) }
    finally { setLoadingConvs(false) }
  }

  // ── Open conversation ─────────────────────────────────────────────────────

  const openConversation = async (convId) => {
    setActiveConvId(convId)
    setMessages([])
    setLoadingMsgs(true)
    try {
      const res = await chatService.getMessages(convId, 0, 100)
      const data = res?.data ?? res
      const msgs = data?.content ?? []
      setMessages(msgs)
      await chatService.markRead(convId)
      // clear unread badge locally
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      ))
    } catch (e) { console.error(e) }
    finally { setLoadingMsgs(false) }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || !activeConvId || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      const res = await chatService.sendMessage(activeConvId, { messageType: 'TEXT', content: text })
      const msg = res?.data ?? res
      setMessages(prev => [...prev, msg])
      // update conversation preview
      setConversations(prev => prev.map(c =>
        c.id === activeConvId ? { ...c, lastMessage: text, lastMessageAt: msg.createdAt } : c
      ))
    } catch (e) {
      console.error(e)
      setInput(text)   // restore on error
    } finally { setSending(false) }
  }

  // ── Search users to start new chat ───────────────────────────────────────

  const handleSearchChange = (val) => {
    setSearchQ(val)
    clearTimeout(searchDebounce.current)
    if (!val.trim()) { setSearchResults([]); return }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await userService.searchUsers(val)
        setSearchResults(Array.isArray(res) ? res : (res?.data ?? []))
      } catch (e) { console.error(e) }
      finally { setSearching(false) }
    }, 400)
  }

  const startChat = async (targetUserId) => {
    setShowSearch(false)
    setSearchQ('')
    setSearchResults([])
    try {
      const res = await chatService.startConversation(targetUserId)
      const conv = res?.data ?? res
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id)
        return exists ? prev : [conv, ...prev]
      })
      openConversation(conv.id)
    } catch (e) { console.error(e) }
  }

  const activeConv = conversations.find(c => c.id === activeConvId)
  const otherUser  = activeConv?.participants?.find(p => p.userId !== currentUser.id)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="flex-1 border-r border-gray-100 flex min-h-screen" style={{ maxWidth: 900 }}>

      {/* ── Conversation list ── */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col bg-white">
        {/* List header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Tin nhắn</h1>
          <button
            onClick={() => setShowSearch(s => !s)}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Tạo cuộc trò chuyện mới"
          >
            <span className="material-symbols-outlined text-[22px]">edit</span>
          </button>
        </div>

        {/* Search new user */}
        {showSearch && (
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
              <input
                autoFocus
                value={searchQ}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Tìm người dùng…"
                className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {searching && <p className="text-xs text-gray-400 px-2 py-1">Đang tìm…</p>}
            {searchResults.map(u => (
              <div
                key={u.id}
                onClick={() => startChat(u.id)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer mt-1"
              >
                <Avatar src={u.avatarUrl} name={u.displayName} size={8} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{u.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
            </div>
          )}
          {!loadingConvs && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <span className="material-symbols-outlined text-5xl text-gray-200 mb-2">chat_bubble</span>
              <p className="text-sm text-gray-500 font-medium">Chưa có cuộc trò chuyện</p>
              <p className="text-xs text-gray-400 mt-1">Nhấn ✏️ để bắt đầu chat với ai đó</p>
            </div>
          )}
          {conversations.map(c => (
            <ConvItem
              key={c.id}
              conv={c}
              currentUserId={currentUser.id}
              isActive={c.id === activeConvId}
              onClick={() => openConversation(c.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col bg-gray-50/50">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <span className="material-symbols-outlined text-7xl text-gray-200 mb-4">forum</span>
            <h2 className="text-xl font-bold text-gray-600 mb-2">Chọn cuộc trò chuyện</h2>
            <p className="text-sm text-gray-400 max-w-xs">Chọn một cuộc trò chuyện từ danh sách hoặc tạo mới để bắt đầu nhắn tin.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
              <Avatar src={otherUser?.avatarUrl} name={otherUser?.displayName} size={9} />
              <div>
                <p className="font-semibold text-gray-900 text-sm">{otherUser?.displayName || 'User'}</p>
                <p className="text-xs text-gray-400">@{otherUser?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400" />
                </div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-5xl text-gray-200 mb-2">waving_hand</span>
                  <p className="text-sm text-gray-400">Bắt đầu cuộc trò chuyện với một tin nhắn!</p>
                </div>
              )}
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.senderId === currentUser.id}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Nhập tin nhắn…"
                disabled={sending}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
