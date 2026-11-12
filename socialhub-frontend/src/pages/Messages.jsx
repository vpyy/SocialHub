import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import chatService from '../services/chatService'
import userService from '../services/userService'
import groupChatService from '../services/groupChatService'
import websocketService from '../services/websocketService'
import CallStateManager, { CALL_STATES, CALL_EVENTS } from '../utils/callStateMachine'
import { CallControls, PermissionsHandler, NetworkRecovery, AudioFocusManager } from '../utils/callControls'
import AdvancedCallModal from '../components/AdvancedCallModal'

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '✨']

// Create Group Modal
function CreateGroupModal({ onClose, onCreated, allUsers, currentUserId, conversations }) {
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [followingUsers, setFollowingUsers] = useState([])

  // Fetch following list on mount
  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const res = await userService.getFollowing(currentUserId)
        const following = res?.data ?? res ?? []
        setFollowingUsers(Array.isArray(following) ? following : [])
      } catch (e) {
        console.error('Failed to load following list:', e)
        setFollowingUsers([])
      }
    }
    fetchFollowing()
  }, [currentUserId])

  // Get suggested user IDs: chat partners + following
  const getSuggestedUserIds = () => {
    const suggestedIds = new Set()

    // Add chat partners (people you've had 1-1 conversations with)
    conversations.forEach(conv => {
      if (!conv.isGroup) {
        const partner = conv.participants?.find(p => p.userId !== currentUserId)
        if (partner) suggestedIds.add(partner.userId)
      }
    })

    // Add following users
    followingUsers.forEach(u => {
      if (u.id) suggestedIds.add(u.id)
      if (u.userId) suggestedIds.add(u.userId)
      if (u.followingId) suggestedIds.add(u.followingId)
    })

    return suggestedIds
  }

  const suggestedIds = getSuggestedUserIds()

  // Suggested users from allUsers, filtered by chat partners + following
  const suggestedUsers = allUsers.filter(u =>
    u.id !== currentUserId &&
    suggestedIds.has(u.id) &&
    !selectedMembers.includes(u.id)
  )

  // Filtered users based on search
  const filteredUsers = (() => {
    let users = suggestedUsers

    if (searchTerm.trim()) {
      users = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return users
  })()

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert('Tên nhóm không được để trống')
      return
    }
    if (selectedMembers.length < 1) {
      alert('Cần ít nhất 1 thành viên khác (bạn + 1)')
      return
    }

    setLoading(true)
    try {
      const res = await chatService.createGroup({
        groupName: groupName.trim(),
        memberIds: selectedMembers
      })
      const newConv = res.data ?? res
      onCreated?.(newConv)
      onClose?.()
    } catch (e) {
      console.error(e)
      alert('Không thể tạo nhóm: ' + (e?.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 dark:text-white">Tạo nhóm chat</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Tên nhóm</label>
            <input
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              Chọn thành viên ({selectedMembers.length})
              <span className="ml-1 text-gray-400 font-normal">· {suggestedUsers.length} người có thể thêm</span>
            </label>
            
            <div className="relative mb-3">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-sm">search</span>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm trong những người đã chat / đang follow..."
                className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {searchTerm.trim()
                    ? 'Không tìm thấy người dùng phù hợp'
                    : 'Chưa có ai để thêm. Hãy chat hoặc follow thêm người dùng.'}
                </p>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      selectedMembers.includes(user.id)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.id)}
                      onChange={() => {}}
                      className="w-4 h-4"
                    />
                    <Avatar src={user.avatarUrl} name={user.displayName} size="xs" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex gap-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 font-medium"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selectedMembers.length < 1}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {loading ? '...' : 'Tạo nhóm'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Group Management Modal
function GroupManagementModal({ conversation, currentUserId, onClose, onUpdate, onDelete, onLeave }) {
  const [tab, setTab] = useState('members')
  const [loading, setLoading] = useState(false)
  const [groupName, setGroupName] = useState(conversation?.groupName || '')
  const [members, setMembers] = useState(conversation?.participants || [])
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const searchDebounce = useRef(null)
  const isAdmin = members.find(m => m.userId === currentUserId)?.role === 'ADMIN'

  const handleSearchUsers = (val) => {
    setSearchUser(val)
    clearTimeout(searchDebounce.current)
    if (!val.trim()) {
      setSearchResults([])
      return
    }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await userService.searchUsers(val)
        const allUsers = Array.isArray(res) ? res : (res?.data ?? [])
        const alreadyInGroup = members.map(m => m.userId)
        setSearchResults(allUsers.filter(u => !alreadyInGroup.includes(u.id)))
      } catch (e) { console.error(e) }
      finally { setSearching(false) }
    }, 400)
  }

  const handleAddMember = async (userId) => {
    setLoading(true)
    try {
      const updatedConv = await chatService.updateConversation(conversation.id, {
        ...conversation,
        participants: [...members.map(m => m.userId), userId]
      })
      setMembers(updatedConv.participants || conversation.participants)
      setSearchUser('')
      setSearchResults([])
      onUpdate?.(updatedConv)
    } catch (e) {
      console.error(e)
      alert('Không thể thêm thành viên')
    } finally { setLoading(false) }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Loại bỏ thành viên khỏi nhóm?')) return
    setLoading(true)
    try {
      const updatedMembers = members.filter(m => m.userId !== userId)
      const updatedConv = await chatService.updateConversation(conversation.id, {
        ...conversation,
        participants: updatedMembers.map(m => m.userId)
      })
      setMembers(updatedConv.participants || updatedMembers)
      onUpdate?.(updatedConv)
    } catch (e) {
      console.error(e)
      alert('Không thể loại bỏ thành viên')
    } finally { setLoading(false) }
  }

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) {
      alert('Tên nhóm không được để trống')
      return
    }
    setLoading(true)
    try {
      const updatedConv = await chatService.updateConversation(conversation.id, {
        ...conversation,
        groupName: groupName.trim()
      })
      onUpdate?.(updatedConv)
      alert('Cập nhật tên nhóm thành công')
    } catch (e) {
      console.error(e)
      alert('Không thể cập nhật tên nhóm')
    } finally { setLoading(false) }
  }

  const handleDeleteGroup = async () => {
    if (!window.confirm('Xóa nhóm này vĩnh viễn? Hành động này không thể hoàn tác!')) return
    setLoading(true)
    try {
      await chatService.deleteConversation(conversation.id)
      onDelete?.()
      onClose?.()
    } catch (e) {
      console.error(e)
      alert('Không thể xóa nhóm')
    } finally { setLoading(false) }
  }

  const handleLeaveGroup = async () => {
    if (!window.confirm('Rời nhóm này?')) return
    setLoading(true)
    try {
      await chatService.leaveConversation(conversation.id)
      onLeave?.()
      onClose?.()
    } catch (e) {
      console.error(e)
      alert('Không thể rời nhóm')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 dark:text-white">{conversation?.groupName}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">close</span>
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setTab('members')} className={`flex-1 py-3 text-center font-medium ${tab === 'members' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 dark:text-gray-400'}`}>
            Thành viên ({members.length})
          </button>
          <button onClick={() => setTab('settings')} className={`flex-1 py-3 text-center font-medium ${tab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600 dark:text-gray-400'}`}>
            Cài đặt
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'members' && (
            <div className="space-y-3">
              {isAdmin && (
                <div className="relative mb-4">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-sm">search</span>
                  <input
                    value={searchUser}
                    onChange={e => handleSearchUsers(e.target.value)}
                    placeholder="Thêm thành viên..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              )}

              {searchUser && searchResults.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user.id)}
                      disabled={loading}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors mb-1"
                    >
                      <Avatar src={user.avatarUrl} name={user.displayName} size="xs" />
                      <span className="text-sm text-gray-900 dark:text-white flex-1 text-left">{user.displayName}</span>
                      <span className="material-symbols-outlined text-green-600 text-sm">add_circle</span>
                    </button>
                  ))}
                </div>
              )}

              {members.map(member => (
                <div key={member.userId} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar src={member.avatarUrl} name={member.displayName} size="xs" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{member.displayName}</p>
                      {member.userId === currentUserId && <p className="text-xs text-gray-500">(Bạn)</p>}
                      {member.role === 'ADMIN' && <p className="text-xs text-indigo-600">Admin</p>}
                    </div>
                  </div>
                  {isAdmin && member.userId !== currentUserId && (
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={loading}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-red-600 text-sm">remove_circle</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-4">
              {isAdmin && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Tên nhóm</label>
                  <div className="flex gap-2">
                    <input
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleUpdateGroupName}
                      disabled={loading}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 font-medium"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleLeaveGroup}
                disabled={loading}
                className="w-full px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-200 dark:hover:bg-yellow-900/50 disabled:opacity-50 transition-colors"
              >
                Rời nhóm
              </button>

              {isAdmin && (
                <button
                  onClick={handleDeleteGroup}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                >
                  Xóa nhóm
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'Vừa xong'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000) return d.toLocaleDateString('vi-VN', { weekday: 'short' })
  return d.toLocaleDateString('vi-VN')
}

function Avatar({ src, name, size = 'md', online = false }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const sizeMap = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-14 h-14', '2xl': 'w-20 h-20' }
  const sizeClass = sizeMap[size] || 'w-10 h-10'
  
  return (
    <div className="relative">
      {src ? (
        <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover`} />
      ) : (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 text-white flex items-center justify-center font-bold text-sm`}>
          {initials}
        </div>
      )}
      {online && size !== 'xs' && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </div>
  )
}

// Conversation Item - WITH MENU
function ConversationItem({ conv, currentUserId, isActive, onClick, online, onAction }) {
  const other = conv.participants?.find(p => p.userId !== currentUserId)
  const displayName = conv.isGroup ? conv.groupName : (other?.displayName || 'User')
  const avatar = conv.isGroup ? conv.groupAvatarUrl : other?.avatarUrl
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [showMenu])

  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
      <button onClick={onClick} className="flex-1 flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <Avatar src={avatar} name={displayName} size="md" online={online && !conv.isGroup} />
          {conv.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-start">
          <div className="flex items-center justify-between gap-2 w-full">
            <p className={`font-medium truncate ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {displayName}
            </p>
            <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">{formatTime(conv.lastMessageAt)}</span>
          </div>
          <p className={`text-sm truncate text-left w-full ${conv.unreadCount > 0 ? 'text-gray-900 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
            {(conv.lastMessage || 'Bắt đầu cuộc trò chuyện').replace(/\n/g, ' ')}
          </p>
        </div>
      </button>

      {/* Menu 3 chấm */}
      <div className="relative" ref={menuRef}>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">more_vert</span>
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] z-50">
            {/* Pin/Unpin */}
            <button 
              onClick={() => { onAction?.('pin', conv.id); setShowMenu(false) }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <span className="material-symbols-outlined text-sm">push_pin</span>
              {conv.isPinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện'}
            </button>

            {/* Mute/Unmute */}
            <button 
              onClick={() => { onAction?.('mute', conv.id); setShowMenu(false) }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <span className="material-symbols-outlined text-sm">{conv.isMuted ? 'notifications_active' : 'notifications_off'}</span>
              {conv.isMuted ? 'Bật thông báo' : 'Tắt thông báo'}
            </button>

            {/* Mark as unread */}
            <button 
              onClick={() => { onAction?.('unread', conv.id); setShowMenu(false) }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
            >
              <span className="material-symbols-outlined text-sm">mail</span>
              Đánh dấu chưa đọc
            </button>

            {/* Block user (if 1-1 chat) */}
            {!conv.isGroup && (
              <button 
                onClick={() => { onAction?.('block', conv.id); setShowMenu(false) }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <span className="material-symbols-outlined text-sm">block</span>
                Chặn người dùng
              </button>
            )}

            {/* Delete/Archive */}
            <button 
              onClick={() => { onAction?.('delete', conv.id); setShowMenu(false) }}
              className="w-full px-4 py-2 text-sm text-left hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-2 text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Xóa đoạn chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Messages Component
export default function Messages() {
  const navigate = useNavigate()
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  })()

  // ── State ─────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  // Attachments (multi-file, max 10)
  const [attachments, setAttachments] = useState([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef(null)

  // Typing indicator
  const [typingUsers, setTypingUsers] = useState([])
  const typingTimeouts = useRef({})
  const typingDebounce = useRef(null)
  const isTypingRef = useRef(false)

  // Presence
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [lastSeenMap, setLastSeenMap] = useState({})

  // UI
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [reactionsModal, setReactionsModal] = useState({ show: false, messageId: null })
  const [groupManageModal, setGroupManageModal] = useState(false)
  const [createGroupModal, setCreateGroupModal] = useState(false)
  const [allUsers, setAllUsers] = useState([])

  // Call
  const [callState, setCallState] = useState({ active: false, type: null, otherUser: null, status: 'idle', callId: null })
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)

  const searchDebounce = useRef(null)
  const isUserAtBottom = useRef(true)
  const messagesEndRef = useRef(null)
  const lastMessageIdRef = useRef(null)
  const callManagerRef = useRef(new CallStateManager())
  const callControlsRef = useRef(new CallControls())
  const networkRecoveryRef = useRef(new NetworkRecovery())
  const audioFocusRef = useRef(new AudioFocusManager())
  const permissionsRef = useRef(PermissionsHandler)
  const activeConvIdRef = useRef(null)

  // keep ref in sync so WS handlers can read latest value
  useEffect(() => { activeConvIdRef.current = activeConvId }, [activeConvId])

  // ── WebSocket handlers ────────────────────────────────────────────────

  const handleChatEvent = (event) => {
    if (!event || !event.type) return
    const { type, message, messageId, conversationId, data } = event
    const relevantConvId = conversationId || message?.conversationId

    switch (type) {
      case 'message:new': {
        if (!message) return
        setMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev
          lastMessageIdRef.current = message.id
          return [...prev, message]
        })
        setConversations(prev => {
          const updated = prev.map(c =>
            c.id === relevantConvId
              ? { ...c, lastMessage: message.content || '📎', lastMessageAt: message.createdAt,
                  unreadCount: relevantConvId === activeConvIdRef.current ? 0 : (c.unreadCount || 0) + 1 }
              : c
          )
          const i = updated.findIndex(c => c.id === relevantConvId)
          if (i > 0) { const [moved] = updated.splice(i, 1); updated.unshift(moved) }
          return updated
        })
        if (relevantConvId === activeConvIdRef.current) {
          chatService.markRead(relevantConvId).catch(() => {})
        }
        break
      }
      case 'edited': {
        if (message) setMessages(prev => prev.map(m => m.id === message.id ? message : m))
        break
      }
      case 'deleted': {
        const id = messageId || message?.id
        if (id) setMessages(prev => prev.filter(m => m.id !== id))
        break
      }
      case 'unsent': {
        const id = messageId || message?.id
        if (id) setMessages(prev => prev.map(m => m.id === id
          ? { ...m, isDeletedForEveryone: true, content: 'Tin nhắn đã được thu hồi', attachments: [] }
          : m))
        break
      }
      case 'reaction': {
        if (message) setMessages(prev => prev.map(m => m.id === message.id ? { ...m, reactions: message.reactions } : m))
        break
      }
      case 'pinned': {
        if (message) setMessages(prev => prev.map(m => m.id === message.id ? message : m))
        break
      }
      case 'read': {
        if (data?.userId && relevantConvId === activeConvIdRef.current) {
          setMessages(prev => prev.map(m => ({
            ...m,
            readBy: { ...(m.readBy || {}), [data.userId]: data.readAt }
          })))
        }
        break
      }
      default: break
    }

    if (isUserAtBottom.current) {
      requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }))
    }
  }

  const handlePresenceEvent = (event) => {
    if (!event?.userId) return
    const { userId, online, lastSeenAt } = event
    setOnlineUsers(prev => { const next = new Set(prev); online ? next.add(userId) : next.delete(userId); return next })
    if (!online && lastSeenAt) setLastSeenMap(prev => ({ ...prev, [userId]: lastSeenAt }))
  }

  const handleTypingEvent = (event) => {
    if (!event?.userId || event.userId === currentUser.id) return
    const { userId, typing } = event
    if (typing) {
      setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId])
      clearTimeout(typingTimeouts.current[userId])
      typingTimeouts.current[userId] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(id => id !== userId))
      }, 3000)
    } else {
      setTypingUsers(prev => prev.filter(id => id !== userId))
      clearTimeout(typingTimeouts.current[userId])
    }
  }

  const handleReconnect = async () => {
    if (!activeConvIdRef.current || !lastMessageIdRef.current) return
    try {
      const res = await chatService.getMessagesAfter(activeConvIdRef.current, lastMessageIdRef.current)
      const missed = res?.content ?? res?.data?.content ?? []
      if (missed.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMsgs = missed.filter(m => !existingIds.has(m.id))
          if (newMsgs.length === 0) return prev
          const updated = [...prev, ...newMsgs]
          lastMessageIdRef.current = updated[updated.length - 1]?.id
          return updated
        })
      }
    } catch (e) { console.error('[Messages] sync missed messages failed:', e) }
  }

  const handleCallEvent = async (notification) => {
    if (notification.type === 'call:incoming') {
      setCallState({ active: true, type: notification.callData?.type || 'VOICE',
        otherUser: { userId: notification.callData?.initiator, displayName: notification.callData?.initiatorName, avatarUrl: notification.callData?.initiatorAvatar },
        status: 'incoming', callId: notification.callData?.id })
      try { callManagerRef.current?.receiveCall(notification.callData?.id, notification.callData?.type, notification.callData?.initiator, notification.callData?.receiver || currentUser.id) } catch {}
      return
    }
    if (notification.type === 'call:accepted') {
      setCallState(prev => ({ ...prev, status: 'connecting' }))
      try {
        const callId = notification.callId
        const callType = callControlsRef.current?._callType || 'VOICE'
        let stream = callControlsRef.current?.localStream
        if (!stream) { stream = await callControlsRef.current?.initializeStream({ audio: true, video: callType === 'VIDEO' }); setLocalStream(stream) }
        await callControlsRef.current?.initializePeerConnection()
        callControlsRef.current?.on('ice:candidate', c => websocketService.sendMessage('/app/call/' + callId + '/ice-candidate', { candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }))
        callControlsRef.current?.on('track:received', e => setRemoteStream(e.streams?.[0] || new MediaStream([e.track])))
        callControlsRef.current?.on('connection:state_changed', ({ state }) => {
          if (state === 'connected') { setCallState(prev => ({ ...prev, status: 'connected' })); try { callManagerRef.current?.setConnected() } catch {} }
          else if (state === 'failed' || state === 'disconnected') setCallState(prev => ({ ...prev, status: 'failed' }))
        })
        const offer = await callControlsRef.current?.createOffer()
        websocketService.sendMessage('/app/call/' + callId + '/offer', { type: offer.type, sdp: offer.sdp })
      } catch (e) { console.error('[Call] create offer error:', e) }
      return
    }
    if (notification.type === 'offer') {
      try {
        const callId = notification.callId
        if (!callControlsRef.current?.peerConnection) {
          const callType = callState.type || 'VOICE'
          const stream = await callControlsRef.current?.initializeStream({ audio: true, video: callType === 'VIDEO' })
          setLocalStream(stream)
          await callControlsRef.current?.initializePeerConnection()
          callControlsRef.current?.on('ice:candidate', c => websocketService.sendMessage('/app/call/' + callId + '/ice-candidate', { candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }))
          callControlsRef.current?.on('track:received', e => setRemoteStream(e.streams?.[0] || new MediaStream([e.track])))
          callControlsRef.current?.on('connection:state_changed', ({ state }) => {
            if (state === 'connected') { setCallState(prev => ({ ...prev, status: 'connected' })); try { callManagerRef.current?.setConnected() } catch {} }
            else if (state === 'failed' || state === 'disconnected') setCallState(prev => ({ ...prev, status: 'failed' }))
          })
        }
        await callControlsRef.current?.setRemoteDescription({ type: notification.sdp.type, sdp: notification.sdp.sdp })
        const answer = await callControlsRef.current?.createAnswer()
        websocketService.sendMessage('/app/call/' + callId + '/answer', { type: answer.type, sdp: answer.sdp })
        setCallState(prev => ({ ...prev, status: 'connecting' }))
      } catch (e) { console.error('[Call] handle offer error:', e) }
      return
    }
    if (notification.type === 'answer') {
      try { await callControlsRef.current?.setRemoteDescription({ type: notification.sdp.type, sdp: notification.sdp.sdp }) } catch {}
      return
    }
    if (notification.type === 'ice-candidate') {
      try { if (notification.candidate?.candidate) await callControlsRef.current?.addIceCandidate(notification.candidate) } catch {}
      return
    }
    if (notification.type === 'call:rejected') { cleanupCall(); return }
    if (notification.type === 'call:ended') { cleanupCall() }
  }

  // ── WebSocket setup ───────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser?.id) return
    websocketService.connect(currentUser.id)
    websocketService.addListener('message', handleChatEvent)
    websocketService.addListener('presence', handlePresenceEvent)
    websocketService.addListener('call', handleCallEvent)
    websocketService.addListener('notification', handleCallEvent)
    const removeReconnect = websocketService.onReconnect(handleReconnect)
    return () => {
      websocketService.removeListener('message', handleChatEvent)
      websocketService.removeListener('presence', handlePresenceEvent)
      websocketService.removeListener('call', handleCallEvent)
      websocketService.removeListener('notification', handleCallEvent)
      removeReconnect()
      try { callManagerRef.current?.removeAllListeners(); callControlsRef.current?.close() } catch {}
    }
  }, [currentUser?.id]) // eslint-disable-line

  // Typing subscription per conversation
  useEffect(() => {
    if (!activeConvId) return
    websocketService.subscribeTyping(activeConvId, handleTypingEvent)
    return () => websocketService.unsubscribeTyping(activeConvId)
  }, [activeConvId]) // eslint-disable-line

  // ── Init ──────────────────────────────────────────────────────────────

  useEffect(() => { loadConversations(); loadAllUsers() }, [])

  useEffect(() => {
    if (isUserAtBottom.current) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages.length])

  // ── Data loaders ──────────────────────────────────────────────────────

  const loadAllUsers = async () => {
    try {
      const res = await userService.getAllUsers(0, 100)
      setAllUsers(res?.content ?? res?.data ?? res ?? [])
    } catch {}
  }

  const loadConversations = async () => {
    setLoadingConvs(true)
    try {
      const res = await chatService.getConversations(0, 50)
      const convList = res?.data?.content ?? res?.content ?? []
      setConversations(convList)
      // Fetch initial presence
      const userIds = [...new Set(convList.flatMap(c => c.participants?.map(p => p.userId) ?? []).filter(id => id !== currentUser.id))]
      if (userIds.length > 0) {
        try {
          const presence = await chatService.getPresence(userIds)
          const list = presence?.data ?? presence ?? []
          const nextOnline = new Set()
          const nextSeen = {}
          list.forEach(p => { if (p.online) nextOnline.add(p.userId); if (p.lastSeenAt) nextSeen[p.userId] = p.lastSeenAt })
          setOnlineUsers(nextOnline); setLastSeenMap(nextSeen)
        } catch {}
      }
    } catch (e) { console.error(e) }
    finally { setLoadingConvs(false) }
  }

  const openConversation = async (convId) => {
    setActiveConvId(convId); setMessages([]); setTypingUsers([]); setAttachments([])
    setLoadingMsgs(true); isUserAtBottom.current = true
    try {
      const res = await chatService.getMessages(convId, 0, 100)
      const msgs = res?.data?.content ?? res?.content ?? []
      setMessages(msgs)
      if (msgs.length > 0) lastMessageIdRef.current = msgs[msgs.length - 1].id
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
      await chatService.markRead(convId)
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c))
    } catch (e) { console.error(e) }
    finally { setLoadingMsgs(false) }
  }

  // ── Attachments ───────────────────────────────────────────────────────

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 10 - attachments.filter(a => !a.uploading).length
    if (remaining <= 0) { alert('Tối đa 10 file đính kèm'); return }
    const toUpload = files.slice(0, remaining)
    const placeholders = toUpload.map(f => ({ id: null, fileName: f.name, fileSize: f.size, type: f.type, url: null, uploading: true, _tempId: Math.random().toString(36).slice(2) }))
    setAttachments(prev => [...prev, ...placeholders])
    setUploadingFile(true)
    const results = await Promise.allSettled(
      toUpload.map(async (file, i) => {
        const res = await chatService.uploadAttachment(file)
        const data = res?.data ?? res
        return { ...placeholders[i], ...data, uploading: false }
      })
    )
    setAttachments(prev => {
      const tempIds = new Set(placeholders.map(p => p._tempId))
      const without = prev.filter(a => !tempIds.has(a._tempId))
      const uploaded = results.filter(r => r.status === 'fulfilled').map(r => r.value)
      return [...without, ...uploaded]
    })
    setUploadingFile(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx))

  // ── Send message ──────────────────────────────────────────────────────

  const handleSend = async (e) => {
    e?.preventDefault()
    const hasContent = input.trim()
    const readyAtts = attachments.filter(a => !a.uploading)
    if ((!hasContent && readyAtts.length === 0) || !activeConvId || sending) return
    setSending(true)
    const text = input.trim()
    setInput(''); setAttachments([])
    if (isTypingRef.current) { websocketService.sendTyping(activeConvId, false); isTypingRef.current = false }
    try {
      const payload = {
        messageType: 'TEXT', content: text || null,
        attachments: readyAtts.map(a => ({ id: a.id, type: a.type, url: a.url, fileName: a.fileName, fileSize: a.fileSize, thumbnailUrl: a.thumbnailUrl || null }))
      }
      const res = await chatService.sendMessage(activeConvId, payload)
      const msg = res?.data ?? res
      setMessages(prev => { if (prev.find(m => m.id === msg.id)) return prev; lastMessageIdRef.current = msg.id; return [...prev, msg] })
      setConversations(prev => {
        const updated = prev.map(c => c.id === activeConvId ? { ...c, lastMessage: text || '📎 File đính kèm', lastMessageAt: new Date().toISOString() } : c)
        const i = updated.findIndex(c => c.id === activeConvId)
        if (i > 0) { const [moved] = updated.splice(i, 1); updated.unshift(moved) }
        return updated
      })
    } catch (e) { console.error(e); setInput(text); setAttachments(readyAtts) }
    finally { setSending(false) }
  }

  // ── Typing ────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!activeConvId) return
    if (!isTypingRef.current) { websocketService.sendTyping(activeConvId, true); isTypingRef.current = true }
    clearTimeout(typingDebounce.current)
    typingDebounce.current = setTimeout(() => { websocketService.sendTyping(activeConvId, false); isTypingRef.current = false }, 3000)
  }

  // ── Reactions ─────────────────────────────────────────────────────────

  const handleAddReaction = async (emoji) => {
    if (!reactionsModal.messageId) return
    try {
      const res = await chatService.addReaction(activeConvId, reactionsModal.messageId, emoji)
      const updated = res?.data ?? res
      setMessages(prev => prev.map(m => m.id === reactionsModal.messageId ? { ...m, reactions: updated.reactions } : m))
      setReactionsModal({ show: false, messageId: null })
    } catch (e) { console.error(e) }
  }

  const handleRemoveReaction = async (messageId) => {
    try {
      const res = await chatService.removeReaction(activeConvId, messageId)
      const updated = res?.data ?? res
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updated.reactions } : m))
    } catch (e) { console.error(e) }
  }

  // ── Edit & Delete ─────────────────────────────────────────────────────

  const handleEditMessage = (msg) => { setEditingMessageId(msg.id); setEditContent(msg.content) }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !activeConvId) return
    setEditLoading(true)
    try {
      const res = await chatService.editMessage(activeConvId, editingMessageId, editContent)
      setMessages(prev => prev.map(m => m.id === editingMessageId ? (res?.data ?? res) : m))
      setEditingMessageId(null); setEditContent('')
    } catch { alert('Không thể sửa') }
    finally { setEditLoading(false) }
  }

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Xóa tin nhắn?')) return
    try { await chatService.deleteMessage(activeConvId, messageId); setMessages(prev => prev.filter(m => m.id !== messageId)) }
    catch { alert('Không thể xóa') }
  }

  // ── Clear conversation (soft delete per-user) ─────────────────────────

  const handleClearConversation = async (convId) => {
    if (!window.confirm('Xóa toàn bộ tin nhắn ở phía bạn? Người kia vẫn thấy lịch sử.')) return
    try {
      await chatService.deleteConversation(convId)
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeConvId === convId) { setActiveConvId(null); setMessages([]) }
    } catch (e) { console.error(e); alert('Có lỗi xảy ra') }
  }

  // ── Search ────────────────────────────────────────────────────────────

  const handleSearchChange = (val) => {
    setSearchQ(val)
    clearTimeout(searchDebounce.current)
    if (!val.trim()) { setSearchResults([]); return }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try { const res = await userService.searchUsers(val); setSearchResults(Array.isArray(res) ? res : (res?.data ?? [])) }
      catch {}
      finally { setSearching(false) }
    }, 400)
  }

  const startChat = async (uid) => {
    setSearchQ(''); setSearchResults([])
    try {
      const res = await chatService.startConversation(uid)
      const conv = res?.data ?? res
      setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)])
      openConversation(conv.id)
    } catch (e) { console.error(e) }
  }

  // ── Conversation actions ──────────────────────────────────────────────

  const handleConversationAction = async (action, convId) => {
    try {
      switch (action) {
        case 'pin': { const c = conversations.find(x => x.id === convId); if (c?.isPinned) await chatService.unpinConversation(convId); else await chatService.pinConversation(convId); loadConversations(); break }
        case 'mute': { const c = conversations.find(x => x.id === convId); if (c?.isMuted) await chatService.unmuteConversation(convId); else await chatService.muteConversation(convId); loadConversations(); break }
        case 'unread': await chatService.markAsUnread(convId); setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 1 } : c)); break
        case 'block': { const c = conversations.find(x => x.id === convId); const other = c?.participants?.find(p => p.userId !== currentUser.id); if (other && window.confirm('Chặn ' + other.displayName + '?')) { await chatService.blockUser(other.userId); setConversations(prev => prev.filter(c => c.id !== convId)); if (activeConvId === convId) setActiveConvId(null) } break }
        case 'delete': await handleClearConversation(convId); break
        default: break
      }
    } catch (e) { console.error(e); alert('Có lỗi xảy ra') }
  }

  // ── Call ──────────────────────────────────────────────────────────────

  const cleanupCall = () => {
    try { callManagerRef.current?.endCall() } catch {}
    callControlsRef.current?.close()
    setLocalStream(null); setRemoteStream(null)
    setCallState({ active: false, type: null, otherUser: null, status: 'idle', callId: null })
  }

  const handleInitiateCall = async (callType = 'VOICE') => {
    try {
      if (!otherUser || !activeConvId) return
      const response = await chatService.initiateCall(activeConvId, otherUser.userId, callType)
      const callData = response?.data?.data || {}
      callControlsRef.current._callType = callType
      try { const stream = await callControlsRef.current?.initializeStream({ audio: true, video: callType === 'VIDEO' }); setLocalStream(stream) } catch {}
      callManagerRef.current?.initiateCall(callData.id || 'call_' + Date.now(), callType, currentUser.id, otherUser.userId)
      setCallState({ active: true, type: callType, otherUser: { userId: otherUser.userId, displayName: otherUser.displayName, avatarUrl: otherUser.avatarUrl }, status: 'calling', callId: callData.id })
    } catch (error) { alert('Không thể thực hiện cuộc gọi: ' + (error?.response?.data?.message || error.message)) }
  }

  const handleAcceptCall = async () => {
    try {
      if (!callState.callId) return
      const callType = callState.type || 'VOICE'
      const stream = await callControlsRef.current?.initializeStream({ audio: true, video: callType === 'VIDEO' })
      setLocalStream(stream)
      await callControlsRef.current?.initializePeerConnection()
      callControlsRef.current?.on('ice:candidate', c => websocketService.sendMessage('/app/call/' + callState.callId + '/ice-candidate', { candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }))
      callControlsRef.current?.on('track:received', e => setRemoteStream(e.streams?.[0] || new MediaStream([e.track])))
      callControlsRef.current?.on('connection:state_changed', ({ state }) => {
        if (state === 'connected') { setCallState(prev => ({ ...prev, status: 'connected' })); try { callManagerRef.current?.setConnected() } catch {} }
        else if (state === 'failed' || state === 'disconnected') setCallState(prev => ({ ...prev, status: 'failed' }))
      })
      callControlsRef.current._callType = callType
      await chatService.updateCallStatus(callState.callId, 'ACCEPTED')
      callManagerRef.current?.acceptCall()
      setCallState(prev => ({ ...prev, status: 'accepted' }))
    } catch (error) { console.error('Failed to accept call:', error) }
  }

  const handleDeclineCall = async () => { try { if (callState.callId) await chatService.updateCallStatus(callState.callId, 'DECLINED') } catch {}; cleanupCall() }
  const handleEndCall = async () => { try { if (callState.callId) await chatService.updateCallStatus(callState.callId, 'ENDED') } catch {}; cleanupCall() }
  const handleMuteToggle = async () => { try { await callControlsRef.current?.toggleMute(); return callControlsRef.current?.isMuted || false } catch { return false } }
  const handleVideoToggle = async () => { try { await callControlsRef.current?.toggleVideo(); return callControlsRef.current?.isVideoEnabled || false } catch { return false } }
  const handleSwitchCamera = async () => { try { await callControlsRef.current?.switchCamera() } catch {} }
  const handleSpeakerToggle = async () => { try { await callControlsRef.current?.toggleSpeaker(); return callControlsRef.current?.isSpeakerOn || false } catch { return false } }
  const handlePiPToggle = async (videoElement) => { try { await callControlsRef.current?.enablePictureInPicture(videoElement) } catch {} }

  // ── Derived values ────────────────────────────────────────────────────

  const activeConv = conversations.find(c => c.id === activeConvId)
  const otherUser  = activeConv?.participants?.find(p => p.userId !== currentUser.id)
  const isOnline   = onlineUsers.has(otherUser?.userId)
  const otherLastSeen = lastSeenMap[otherUser?.userId]

  const filteredConversations = searchQ.trim()
    ? conversations.filter(c => { const o = c.participants?.find(p => p.userId !== currentUser.id); const name = c.isGroup ? c.groupName : (o?.displayName || 'User'); return name.toLowerCase().includes(searchQ.toLowerCase()) })
    : conversations

  // "Đã xem" under last sent message
  const myMessages = messages.filter(m => m.senderId === currentUser.id)
  const lastMyMsg  = myMessages[myMessages.length - 1]
  const isLastMsgRead = lastMyMsg?.readBy ? Object.keys(lastMyMsg.readBy).some(uid => uid !== currentUser.id) : false

  const getPresenceLabel = () => {
    if (activeConv?.isGroup) return (activeConv.participants?.length || 0) + ' thành viên'
    if (isOnline) return '🟢 Đang hoạt động'
    if (otherLastSeen) {
      const diff = Date.now() - new Date(otherLastSeen)
      if (diff < 60000) return 'Hoạt động vừa xong'
      if (diff < 3600000) return 'Hoạt động ' + Math.floor(diff / 60000) + ' phút trước'
      if (diff < 86400000) return 'Hoạt động ' + Math.floor(diff / 3600000) + ' giờ trước'
      return 'Hoạt động ' + Math.floor(diff / 86400000) + ' ngày trước'
    }
    return '⚫ Không hoạt động'
  }

  // ── Attachment renderers ──────────────────────────────────────────────

  const renderAttachmentPreview = (att) => {
    const type = (att.type || '').toLowerCase()
    if (type.startsWith('image/') || type === 'image') {
      return <img src={att.url} alt={att.fileName} className="max-h-24 max-w-[96px] rounded object-cover" />
    }
    const icon = type.includes('pdf') ? '📄' : type.includes('video') ? '🎬' : type.includes('zip') || type.includes('rar') ? '🗜️' : type.includes('doc') ? '📝' : '📎'
    return (
      <div className="flex flex-col items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate max-w-full mt-0.5">{att.fileName}</span>
      </div>
    )
  }

  const renderMessageAttachments = (msg) => {
    if (!msg.attachments || msg.attachments.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {msg.attachments.map((a, i) => {
          const type = (a.type || '').toLowerCase()
          if (type.startsWith('image/') || type === 'image') {
            return <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt={a.fileName} className="max-h-48 max-w-xs rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity" /></a>
          }
          const icon = type.includes('pdf') ? '📄' : type.includes('video') ? '🎬' : type.includes('zip') ? '🗜️' : type.includes('doc') ? '📝' : '📎'
          return (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
              <span className="text-lg">{icon}</span>
              <span className="text-xs truncate max-w-[120px]">{a.fileName}</span>
            </a>
          )
        })}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">

      {/* Sidebar */}
      <div className="w-72 lg:w-80 border-r border-gray-200 dark:border-gray-800 flex-col bg-white dark:bg-gray-900 hidden md:flex shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tin nhắn</h1>
            <button onClick={() => setCreateGroupModal(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Tạo nhóm">
              <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">add_circle</span>
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-sm">search</span>
            <input value={searchQ} onChange={e => handleSearchChange(e.target.value)} placeholder="Tìm kiếm hoặc bắt đầu chat..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
          </div>
        </div>

        {searchQ.trim() && searchResults.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 px-4 py-2">NGƯỜI DÙNG</p>
            {searchResults.map(u => (
              <button key={u.id} onClick={() => startChat(u.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{u.displayName}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loadingConvs && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" /></div>}
          {!loadingConvs && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">forum</span>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chưa có tin nhắn. Bắt đầu chat ngay!</p>
            </div>
          )}
          {filteredConversations.map(c => (
            <ConversationItem key={c.id} conv={c} currentUserId={currentUser.id}
              isActive={c.id === activeConvId}
              onClick={() => openConversation(c.id)}
              online={!c.isGroup && onlineUsers.has(c.participants?.find(p => p.userId !== currentUser.id)?.userId)}
              onAction={handleConversationAction} />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <span className="material-symbols-outlined text-9xl text-gray-200 dark:text-gray-700 mb-6">forum</span>
            <h2 className="text-4xl font-bold text-gray-700 dark:text-gray-300 mb-4">Chọn cuộc trò chuyện</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Chọn từ danh sách hoặc bắt đầu cuộc trò chuyện mới</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar src={activeConv?.isGroup ? activeConv?.groupAvatarUrl : otherUser?.avatarUrl} name={activeConv?.isGroup ? activeConv?.groupName : otherUser?.displayName} size="md" online={isOnline && !activeConv?.isGroup} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{activeConv?.isGroup ? activeConv?.groupName : (otherUser?.displayName || 'User')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{getPresenceLabel()}</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleInitiateCall('VOICE')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Gọi thoại"><span className="material-symbols-outlined text-gray-700 dark:text-gray-300">call</span></button>
                <button onClick={() => handleInitiateCall('VIDEO')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Gọi video"><span className="material-symbols-outlined text-gray-700 dark:text-gray-300">videocam</span></button>
                {activeConv?.isGroup && <button onClick={() => setGroupManageModal(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined text-gray-700 dark:text-gray-300">info</span></button>}
              </div>
            </div>

            {/* Messages scroll area */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 space-y-1" onScroll={e => { const el = e.target; isUserAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120 }}>
              {loadingMsgs && <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}
              {!loadingMsgs && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-16">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">waving_hand</span>
                  <p className="text-gray-500 dark:text-gray-400">Bắt đầu cuộc trò chuyện</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id
                const prevMsg = messages[idx - 1]
                const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId || (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) > 60000)
                const isDeleted = msg.isDeletedForEveryone
                const isLastOwn = isMe && lastMyMsg?.id === msg.id
                const senderInfo = activeConv?.participants?.find(p => p.userId === msg.senderId)

                return (
                  <div key={msg.id} className={'flex gap-2 ' + (isMe ? 'flex-row-reverse' : 'flex-row') + ' items-end'}>
                    <div className="flex-shrink-0 w-8">
                      {!isMe && (showAvatar
                        ? <Avatar src={senderInfo?.avatarUrl || otherUser?.avatarUrl} name={senderInfo?.displayName || otherUser?.displayName} size="sm" />
                        : <div className="w-8" />
                      )}
                    </div>

                    <div className={'flex flex-col ' + (isMe ? 'items-end' : 'items-start') + ' max-w-[70%]'}>
                      {!isMe && activeConv?.isGroup && showAvatar && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 ml-1">{senderInfo?.displayName || 'User'}</p>
                      )}

                      {editingMessageId === msg.id ? (
                        <div className="flex gap-2 items-center">
                          <input value={editContent} onChange={e => setEditContent(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-indigo-400 text-sm outline-none dark:bg-gray-800 dark:text-white min-w-[200px]"
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingMessageId(null) }} autoFocus />
                          <button onClick={handleSaveEdit} disabled={editLoading} className="text-indigo-600 text-sm font-medium hover:text-indigo-700">Lưu</button>
                          <button onClick={() => setEditingMessageId(null)} className="text-gray-500 text-sm hover:text-gray-700">Hủy</button>
                        </div>
                      ) : (
                        <div className={'group relative px-3.5 py-2.5 rounded-2xl ' + (isMe ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm') + (isDeleted ? ' opacity-60' : '')}>
                          {msg.content && <p className={'text-sm break-words whitespace-pre-wrap' + (isDeleted ? ' italic text-opacity-70' : '')}>{msg.content}</p>}
                          {renderMessageAttachments(msg)}
                          {msg.editedAt && !isDeleted && <span className={'text-[10px] mt-0.5 block ' + (isMe ? 'text-indigo-200' : 'text-gray-400')}>đã chỉnh sửa</span>}

                          {/* Reactions display */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {Object.entries(Object.values(msg.reactions).reduce((acc, e) => { acc[e] = (acc[e] || 0) + 1; return acc }, {})).map(([emoji, count]) => (
                                <button key={emoji} onClick={() => { const myR = msg.reactions?.[currentUser.id]; if (myR === emoji) handleRemoveReaction(msg.id); else setReactionsModal({ show: true, messageId: msg.id }) }}
                                  className={'text-xs px-1.5 py-0.5 rounded-full border transition-colors ' + (msg.reactions?.[currentUser.id] === emoji ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-medium' : 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500')}>
                                  {emoji}{count > 1 ? ' ' + count : ''}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Hover actions */}
                          {!isDeleted && (
                            <div className={'absolute ' + (isMe ? 'right-full mr-1.5' : 'left-full ml-1.5') + ' top-0 hidden group-hover:flex gap-0.5 items-center'}>
                              <button onClick={() => setReactionsModal({ show: true, messageId: msg.id })} className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 text-xs hover:scale-110 transition-transform" title="Thêm reaction">😊</button>
                              {isMe && <button onClick={() => handleEditMessage(msg)} className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform" title="Chỉnh sửa"><span className="material-symbols-outlined text-gray-600 dark:text-gray-300" style={{fontSize:'14px'}}>edit</span></button>}
                              {isMe && <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform" title="Xóa"><span className="material-symbols-outlined text-red-500" style={{fontSize:'14px'}}>delete</span></button>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timestamp + read receipt */}
                      <div className={'flex items-center gap-1 mt-0.5 ' + (isMe ? 'flex-row-reverse' : 'flex-row')}>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isLastOwn && isLastMsgRead && (
                          <span className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium">Đã xem</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 lg:px-8 pb-1 shrink-0">
                <div className="flex items-center gap-2">
                  <Avatar src={activeConv?.participants?.find(p => p.userId === typingUsers[0])?.avatarUrl} name={activeConv?.participants?.find(p => p.userId === typingUsers[0])?.displayName} size="xs" />
                  <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-full px-3 py-2 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              </div>
            )}

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="px-4 lg:px-8 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-500">{attachments.filter(a => !a.uploading).length}/10 file</span>
                  {attachments.map((att, i) => (
                    <div key={att._tempId || i} className="relative">
                      {att.uploading
                        ? <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"><div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full" /></div>
                        : renderAttachmentPreview(att)
                      }
                      {!att.uploading && (
                        <button onClick={() => removeAttachment(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 shadow">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input bar */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 lg:px-8 py-3 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile || attachments.length >= 10}
                  className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 disabled:opacity-40 shrink-0 transition-colors" title="Đính kèm file (max 10)">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.docx,.doc,.zip,.rar" className="hidden" onChange={handleFileSelect} />

                <input value={input} onChange={handleInputChange} placeholder="Aa" disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 dark:text-white transition-all"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }} />

                <button type="submit" disabled={(!input.trim() && attachments.filter(a => !a.uploading).length === 0) || sending || uploadingFile}
                  className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 shrink-0 transition-colors">
                  {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined">send</span>}
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Reaction picker modal */}
      {reactionsModal.show && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-28" onClick={() => setReactionsModal({ show: false, messageId: null })}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-3 flex gap-2 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            {EMOJI_LIST.map(emoji => (
              <button key={emoji} onClick={() => handleAddReaction(emoji)} className="text-2xl hover:scale-125 transition-transform p-1">{emoji}</button>
            ))}
          </div>
        </div>
      )}

      {/* Group Management Modal */}
      {groupManageModal && activeConv?.isGroup && (
        <GroupManagementModal conversation={activeConv} currentUserId={currentUser.id}
          onClose={() => setGroupManageModal(false)}
          onUpdate={updatedConv => setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c))}
          onDelete={() => { setActiveConvId(null); loadConversations() }}
          onLeave={() => { setActiveConvId(null); loadConversations() }} />
      )}

      {/* Create Group Modal */}
      {createGroupModal && (
        <CreateGroupModal onClose={() => setCreateGroupModal(false)}
          onCreated={newConv => { setConversations(prev => [newConv, ...prev]); openConversation(newConv.id) }}
          allUsers={allUsers.filter(u => u.id !== currentUser.id)}
          currentUserId={currentUser.id} conversations={conversations} />
      )}

      {/* Call Modal */}
      {callState.active && (
        <AdvancedCallModal callState={callState} stateManager={callManagerRef.current} controls={callControlsRef.current}
          onDecline={handleDeclineCall} onAccept={handleAcceptCall} onEnd={handleEndCall}
          onMuteToggle={handleMuteToggle} onVideoToggle={handleVideoToggle} onSwitchCamera={handleSwitchCamera}
          onSpeakerToggle={handleSpeakerToggle} onPiPToggle={handlePiPToggle}
          otherUser={callState.otherUser} localStream={localStream} remoteStream={remoteStream} />
      )}
    </div>
  )
}
