import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import chatService from '../services/chatService'
import userService from '../services/userService'
import blockService from '../services/blockService'
import nicknameService from '../services/nicknameService'
import groupChatService from '../services/groupChatService'

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

function ConvItem({ conv, currentUserId, isActive, onClick, onMenuOpen, isMenuOpen, onBlockUser, onSetNickname }) {
  const navigate = useNavigate()
  const [showMenuLocal, setShowMenuLocal] = useState(false)
  const other = conv.participants?.find(p => p.userId !== currentUserId) || conv.participants?.[0]

  const handleAvatarClick = (e) => {
    e.stopPropagation()
    if (other?.username) {
      navigate(`/profile/${other.username}`)
    }
  }

  const handleMenuClick = (e) => {
    e.stopPropagation()
    setShowMenuLocal(!showMenuLocal)
    onMenuOpen?.(conv.id)
  }

  return (
    <div
      onClick={onClick}
      data-active={isActive}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 group relative ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
    >
      <div className="relative cursor-pointer hover:opacity-80" onClick={handleAvatarClick}>
        <Avatar src={other?.avatarUrl} name={other?.displayName} size={11} />
        {conv.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>
            {other?.displayName || other?.username || 'User'}
          </p>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-xs text-gray-400 shrink-0">{formatTime(conv.lastMessageAt)}</span>
            <button
              onClick={handleMenuClick}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>
        </div>
        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
          {conv.lastMessage || 'Bắt đầu cuộc trò chuyện'}
        </p>
      </div>

      {/* 3-dot Menu */}
      {showMenuLocal && (
        <div className="absolute right-4 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px]">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSetNickname?.(other?.id)
              setShowMenuLocal(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">label</span>
            Đặt biệt danh
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBlockUser?.(other?.id)
              setShowMenuLocal(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
          >
            <span className="material-symbols-outlined text-[16px]">block</span>
            Chặn người dùng
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setGroupChatModal({ show: true, groupName: '', selectedMembers: [], loading: false })
              setShowMenuLocal(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-200 dark:border-gray-700"
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            Tạo nhóm chat
          </button>
        </div>
      )}
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

  const handleSharedPostClick = () => {
    if (msg.sharedPost?.id && navigate) {
      navigate(`/post/${msg.sharedPost.id}`)
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
          <img src={msg.mediaUrl} alt="media" className="rounded-2xl max-h-56 object-cover border border-gray-100" />
        )}
        {msg.messageType === 'POST' && msg.sharedPost && (
          <div 
            onClick={handleSharedPostClick}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm shadow-sm max-w-[260px] cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[14px] text-indigo-400">article</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Bài viết được chia sẻ</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 line-clamp-3 text-xs leading-relaxed">{msg.sharedPost.content}</p>
          </div>
        )}
        {(msg.content) && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMe
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
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
  const navigate = useNavigate()
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId]   = useState(null)
  const [messages, setMessages]           = useState([])
  const [loadingConvs, setLoadingConvs]   = useState(true)
  const [loadingMsgs, setLoadingMsgs]     = useState(false)
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)

  // Unified search - for both conversations and new users
  const [searchQ, setSearchQ]       = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]   = useState(false)

  // 3-dot menu state for conversations
  const [openMenuConvId, setOpenMenuConvId] = useState(null)

  // Nickname modal state
  const [nicknameModal, setNicknameModal] = useState({ show: false, userId: null, nickname: '', loading: false })

  // Group chat modal state
  const [groupChatModal, setGroupChatModal] = useState({ show: false, groupName: '', selectedMembers: [], loading: false })

  const searchDebounce = useRef(null)
  const isUserAtBottom = useRef(true)
  const messagesEndRef = useRef(null)
  const conversationListRef = useRef(null)

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
    isUserAtBottom.current = true  // Reset to bottom when opening new conversation
    try {
      const res = await chatService.getMessages(convId, 0, 100)
      const data = res?.data ?? res
      const msgs = data?.content ?? []
      setMessages(msgs)
      // Auto scroll to bottom after setting messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      await chatService.markRead(convId)
      // clear unread badge locally
      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, unreadCount: 0 } : c
      ))
    } catch (e) { console.error(e) }
    finally { setLoadingMsgs(false) }
  }

  // Auto-refresh messages every 3 seconds when conversation is open
  // BUT only update if user is at bottom, to avoid interrupting scrolling up
  useEffect(() => {
    if (!activeConvId) return
    
    const interval = setInterval(async () => {
      try {
        const res = await chatService.getMessages(activeConvId, 0, 100)
        const data = res?.data ?? res
        const msgs = data?.content ?? []
        // Only update if user is at bottom
        if (isUserAtBottom.current) {
          setMessages(msgs)
        }
        // Also update conversation list - move to top and smooth scroll
        setConversations(prev => {
          const active = prev.find(c => c.id === activeConvId)
          if (!active) return prev
          const updated = prev.filter(c => c.id !== activeConvId)
          const withNewData = [{...active, lastMessageAt: active.lastMessageAt}, ...updated]
          setTimeout(() => {
            const el = conversationListRef.current?.querySelector('[data-active="true"]')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 50)
          return withNewData
        })
      } catch (e) { console.error('Refresh messages error:', e) }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [activeConvId])

  // Scroll to bottom when messages change - ONLY if user is at bottom
  useEffect(() => {
    if (isUserAtBottom.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 0)
    }
  }, [messages.length])

  // Track if user is at bottom
  const handleMessageScroll = (e) => {
    const el = e.target
    isUserAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 50
  }

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
      // update conversation preview and move to top
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === activeConvId ? { ...c, lastMessage: text, lastMessageAt: msg.createdAt } : c
        )
        // Move active conversation to top with smooth scroll
        const active = updated.find(c => c.id === activeConvId)
        if (active) {
          updated.splice(updated.indexOf(active), 1)
          updated.unshift(active)
          setTimeout(() => {
            const el = conversationListRef.current?.querySelector('[data-active="true"]')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 0)
        }
        return updated
      })
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

  // Filter conversations - both search conversations AND new users show up here
  // If search box is empty, show all conversations
  // If search box has text, show matching conversations AND search results (users) separately
  const filteredConversations = searchQ.trim()
    ? conversations.filter(c => {
        const other = c.participants?.find(p => p.userId !== currentUser.id)
        const displayName = c.isGroup ? c.groupName : (other?.displayName || other?.username || 'User')
        const username = other?.username || ''
        const q = searchQ.toLowerCase()
        return displayName.toLowerCase().includes(q) || username.toLowerCase().includes(q)
      })
    : conversations

  // Block user handler
  const handleBlockUser = async (userId) => {
    if (!userId) return
    try {
      await blockService.blockUser(userId)
      // Remove conversation from list
      setConversations(prev => prev.filter(c => c.id !== activeConvId))
      setActiveConvId(null)
      alert('Đã chặn người dùng')
    } catch (e) {
      console.error('Error blocking user:', e)
      alert('Không thể chặn người dùng')
    }
  }

  // Set nickname handler
  const handleSetNickname = async (userId) => {
    if (!userId) return
    setNicknameModal({ show: true, userId, nickname: '', loading: false })
  }

  // Save nickname handler
  const handleSaveNickname = async () => {
    const { userId, nickname } = nicknameModal
    if (!userId) return

    setNicknameModal(prev => ({ ...prev, loading: true }))
    try {
      await nicknameService.setNickname(userId, nickname)
      setNicknameModal({ show: false, userId: null, nickname: '', loading: false })
      alert('Biệt danh đã được lưu')
    } catch (e) {
      console.error('Error setting nickname:', e)
      alert('Không thể lưu biệt danh')
      setNicknameModal(prev => ({ ...prev, loading: false }))
    }
  }

  // Create group chat handler
  const handleCreateGroupChat = async () => {
    const { groupName, selectedMembers } = groupChatModal
    if (!groupName.trim()) {
      alert('Nhập tên nhóm')
      return
    }
    if (selectedMembers.length === 0) {
      alert('Chọn ít nhất 1 thành viên')
      return
    }

    setGroupChatModal(prev => ({ ...prev, loading: true }))
    try {
      const res = await groupChatService.createGroupChat(groupName, selectedMembers)
      const data = res?.data || res
      setConversations(prev => [data, ...prev])
      openConversation(data.id)
      setGroupChatModal({ show: false, groupName: '', selectedMembers: [], loading: false })
      alert('Nhóm chat đã được tạo')
    } catch (e) {
      console.error('Error creating group chat:', e)
      alert('Không thể tạo nhóm chat')
      setGroupChatModal(prev => ({ ...prev, loading: false }))
    }
  }

  const activeConv = conversations.find(c => c.id === activeConvId)
  const otherUser  = activeConv?.participants?.find(p => p.userId !== currentUser.id)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-700 flex min-h-screen h-screen bg-white dark:bg-gray-950 overflow-hidden" style={{ maxWidth: 'none' }}>

      {/* ── Conversation list ── */}
      <div className="w-72 shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 hidden md:flex h-screen overflow-hidden">
        {/* List header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Tin nhắn</h1>
        </div>

        {/* Unified Search */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
            <input
              value={searchQ}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Tìm đoạn chat hoặc người dùng…"
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-300 dark:text-white"
            />
          </div>
        </div>

        {/* Search results - New users to start chat */}
        {searchQ.trim() && searchResults.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Người dùng</p>
            {searchResults.map(u => (
              <div
                key={u.id}
                onClick={() => startChat(u.id)}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Avatar src={u.avatarUrl} name={u.displayName} size={8} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{u.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto" ref={conversationListRef}>
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
          {filteredConversations.map(c => (
            <ConvItem
              key={c.id}
              conv={c}
              currentUserId={currentUser.id}
              isActive={c.id === activeConvId}
              onClick={() => openConversation(c.id)}
              onBlockUser={handleBlockUser}
              onSetNickname={handleSetNickname}
            />
          ))}
          {searchQ.trim() && filteredConversations.length === 0 && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <span className="material-symbols-outlined text-4xl text-gray-200 mb-2">search_off</span>
              <p className="text-sm text-gray-400">Không tìm thấy kết quả</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 h-screen overflow-hidden">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <span className="material-symbols-outlined text-7xl text-gray-200 dark:text-gray-700 mb-4">forum</span>
            <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">Chọn cuộc trò chuyện</h2>
            <p className="text-sm text-gray-400 max-w-xs">Chọn một cuộc trò chuyện từ danh sách hoặc tạo mới để bắt đầu nhắn tin.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
              <Avatar src={otherUser?.avatarUrl} name={otherUser?.displayName} size={9} />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{otherUser?.displayName || 'User'}</p>
                <p className="text-xs text-gray-400">@{otherUser?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4" onScroll={handleMessageScroll}>
              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400" />
                </div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="material-symbols-outlined text-5xl text-gray-200 dark:text-gray-700 mb-2">waving_hand</span>
                  <p className="text-sm text-gray-400">Bắt đầu cuộc trò chuyện với một tin nhắn!</p>
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Nhập tin nhắn…"
                disabled={sending}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 dark:text-white dark:placeholder-gray-500"
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

      {/* Nickname Modal */}
      {nicknameModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Đặt biệt danh</h2>
            </div>
            <div className="p-6">
              <input
                type="text"
                value={nicknameModal.nickname}
                onChange={e => setNicknameModal(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="Nhập biệt danh (hoặc để trống để xóa)"
                maxLength={50}
                disabled={nicknameModal.loading}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {nicknameModal.nickname.length}/50
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => setNicknameModal({ show: false, userId: null, nickname: '', loading: false })}
                disabled={nicknameModal.loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNickname}
                disabled={nicknameModal.loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
              >
                {nicknameModal.loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {groupChatModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tạo nhóm chat</h2>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={groupChatModal.groupName}
                onChange={e => setGroupChatModal(prev => ({ ...prev, groupName: e.target.value }))}
                placeholder="Tên nhóm"
                maxLength={50}
                disabled={groupChatModal.loading}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Chọn thành viên ({groupChatModal.selectedMembers.length})
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                  {conversations.map(c => {
                    const other = c.participants?.find(p => p.userId !== currentUser.id)
                    if (!other) return null
                    const isSelected = groupChatModal.selectedMembers.includes(other.userId)
                    return (
                      <label key={other.userId} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setGroupChatModal(prev => ({ ...prev, selectedMembers: [...prev.selectedMembers, other.userId] }))
                            } else {
                              setGroupChatModal(prev => ({ ...prev, selectedMembers: prev.selectedMembers.filter(id => id !== other.userId) }))
                            }
                          }}
                          disabled={groupChatModal.loading}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{other.displayName || other.username}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => setGroupChatModal({ show: false, groupName: '', selectedMembers: [], loading: false })}
                disabled={groupChatModal.loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateGroupChat}
                disabled={groupChatModal.loading || !groupChatModal.groupName.trim() || groupChatModal.selectedMembers.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium"
              >
                {groupChatModal.loading ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
