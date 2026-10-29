import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  
  // Map size numbers to actual px/rem values
  const sizeMap = {
    7: 'w-7 h-7',   // 28px
    8: 'w-8 h-8',   // 32px
    9: 'w-9 h-9',   // 36px
    10: 'w-10 h-10', // 40px
    11: 'w-11 h-11', // 44px
    12: 'w-12 h-12', // 48px
    28: 'w-28 h-28', // 112px
    32: 'w-32 h-32', // 128px
  }
  
  const sizeClass = sizeMap[size] || 'w-9 h-9'
  
  return src
    ? <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} />
    : <div className={`${sizeClass} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0`}>{initials}</div>
}

// ─── Conversation List Item ──────────────────────────────────────────────────

function ConvItem({ conv, currentUserId, isActive, onClick }) {
  const navigate = useNavigate()
  const other = conv.participants?.find(p => p.userId !== currentUserId) || conv.participants?.[0]

  const handleAvatarClick = (e) => {
    e.stopPropagation()
    if (other?.username) {
      navigate(`/profile/${other.username}`)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 border-b border-gray-50 dark:border-slate-800 ${isActive ? 'bg-indigo-50 dark:bg-slate-800' : ''}`}
    >
      <div className="relative cursor-pointer hover:opacity-80" onClick={handleAvatarClick}>
        <Avatar src={other?.avatarUrl} name={other?.displayName} size={11} />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 dark:bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-slate-50 font-semibold' : 'text-gray-700 dark:text-slate-400'}`}>
            {other?.displayName || other?.username || 'User'}
          </p>
          <span className="text-xs text-gray-400 dark:text-slate-500 shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 dark:text-slate-300 font-medium' : 'text-gray-400 dark:text-slate-500'}`}>
          {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
        </p>
      </div>
    </div>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg, isMe, navigate }) {
  const handleAvatarClick = () => {
    if (!isMe && msg.senderUsername && navigate) {
      navigate(`/profile/${msg.senderUsername}`)
    }
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && (
        <div className="cursor-pointer hover:opacity-80" onClick={handleAvatarClick}>
          <Avatar src={msg.senderAvatarUrl} name={msg.senderDisplayName} size={7} />
        </div>
      )}
      <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {msg.messageType === 'IMAGE' && msg.mediaUrl && (
          <img src={msg.mediaUrl} alt="media" className="rounded-2xl max-h-56 object-cover border border-gray-100 dark:border-slate-700" />
        )}
        {msg.messageType === 'POST' && msg.sharedPost && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-sm shadow-sm max-w-[260px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[14px] text-indigo-400 dark:text-indigo-500">article</span>
              <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">Bài viết được chia sẻ</span>
            </div>
            <p className="text-gray-700 dark:text-slate-300 line-clamp-3 text-xs leading-relaxed">{msg.sharedPost.content}</p>
          </div>
        )}
        {(msg.content) && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMe
              ? 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-bl-sm'
          }`}>
            {msg.content}
          </div>
        )}
        <span className={`text-[10px] text-gray-400 dark:text-slate-500 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
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
  const navigate = useNavigate()
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

  // Auto-refresh messages every 3 seconds when conversation is open
  useEffect(() => {
    if (!activeConvId) return
    
    const interval = setInterval(async () => {
      try {
        const res = await chatService.getMessages(activeConvId, 0, 100)
        const data = res?.data ?? res
        const msgs = data?.content ?? []
        setMessages(msgs)
      } catch (e) { console.error('Refresh messages error:', e) }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [activeConvId])

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
    <section className="flex-1 border-r border-gray-100 dark:border-slate-700 flex min-h-screen" style={{ maxWidth: 900 }}>

      {/* ── Conversation list ── */}
      <div className="w-72 shrink-0 border-r border-gray-100 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900">
        {/* List header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-slate-50">Tin nhắn</h1>
          <button
            onClick={() => setShowSearch(s => !s)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Tạo cuộc trò chuyện mới"
          >
            <span className="material-symbols-outlined text-[22px]">edit</span>
          </button>
        </div>

        {/* Search new user */}
        {showSearch && (
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-slate-500 text-[18px]">search</span>
              <input
                autoFocus
                value={searchQ}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Tìm người dùng…"
                className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-full text-sm text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              />
            </div>
            {searching && <p className="text-xs text-gray-400 dark:text-slate-500 px-2 py-1">Đang tìm…</p>}
            {searchResults.map(u => (
              <div
                key={u.id}
                onClick={() => startChat(u.id)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer mt-1 transition-colors"
              >
                <Avatar src={u.avatarUrl} name={u.displayName} size={8} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{u.displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 dark:border-indigo-400" />
            </div>
          )}
          {!loadingConvs && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <span className="material-symbols-outlined text-5xl text-gray-200 dark:text-slate-700 mb-2">chat_bubble</span>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Chưa có cuộc trò chuyện</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Nhấn ✏️ để bắt đầu chat với ai đó</p>
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
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-950">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <span className="material-symbols-outlined text-7xl text-gray-200 dark:text-slate-700 mb-4">forum</span>
            <h2 className="text-xl font-bold text-gray-600 dark:text-slate-400 mb-2">Chọn cuộc trò chuyện</h2>
            <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs">Chọn một cuộc trò chuyện từ danh sách hoặc tạo mới để bắt đầu nhắn tin.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
              <Avatar src={otherUser?.avatarUrl} name={otherUser?.displayName} size={9} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-slate-50 text-sm">{otherUser?.displayName || 'User'}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500">@{otherUser?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-slate-950">
              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 dark:border-indigo-500" />
                </div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-5xl text-gray-200 dark:text-slate-700 mb-2">waving_hand</span>
                  <p className="text-sm text-gray-400 dark:text-slate-500">Bắt đầu cuộc trò chuyện với một tin nhắn!</p>
                </div>
              )}
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.senderId === currentUser.id}
                  navigate={navigate}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Nhập tin nhắn…"
                disabled={sending}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-full text-sm text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-700 text-white flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
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
