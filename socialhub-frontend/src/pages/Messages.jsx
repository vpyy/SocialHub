import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import chatService from '../services/chatService'
import userService from '../services/userService'
import groupChatService from '../services/groupChatService'

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '✨']

// Create Group Modal
function CreateGroupModal({ onClose, onCreated, allUsers, currentUserId, conversations }) {
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('suggested') // 'suggested' or 'all'

  // Get suggested users (people you've chatted with)
  const getChatPartners = () => {
    const chatPartnerIds = new Set()
    conversations.forEach(conv => {
      if (!conv.isGroup) {
        const partner = conv.participants?.find(p => p.userId !== currentUserId)
        if (partner) chatPartnerIds.add(partner.userId)
      }
    })
    return Array.from(chatPartnerIds)
  }

  const chatPartnerIds = getChatPartners()
  
  // Get suggested users (chat partners + remove already selected)
  const suggestedUsers = allUsers.filter(u => 
    u.id !== currentUserId && 
    chatPartnerIds.includes(u.id) &&
    !selectedMembers.includes(u.id)
  )

  // Filtered users based on search and tab
  const filteredUsers = (() => {
    let users = activeTab === 'suggested' ? suggestedUsers : allUsers
    
    if (searchTerm.trim()) {
      users = users.filter(u => 
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return users.filter(u => u.id !== currentUserId)
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
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Chọn thành viên ({selectedMembers.length})</label>
            
            <div className="relative mb-3">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-sm">search</span>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm người dùng..."
                className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Tab: Suggested vs All */}
            <div className="flex gap-2 mb-3 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('suggested')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'suggested'
                    ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent'
                }`}
              >
                Đã chat ({suggestedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 border-transparent'
                }`}
              >
                Tất cả ({allUsers.length - 1})
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {activeTab === 'suggested' ? 'Chưa chat với ai' : 'Không tìm thấy người dùng'}
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
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} } })()

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

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

  const [typingUsers, setTypingUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  const searchDebounce = useRef(null)
  const isUserAtBottom = useRef(true)
  const messagesEndRef = useRef(null)
  const typingDebounce = useRef(null)

  // Load conversations
  useEffect(() => {
    loadConversations()
    loadAllUsers()
    const interval = setInterval(() => {
      setOnlineUsers(new Set(Math.random() > 0.5 ? [conversations[0]?.participants?.[0]?.userId] : []))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadAllUsers = async () => {
    try {
      const res = await userService.getAllUsers(0, 100)
      setAllUsers(res?.content ?? res?.data ?? res ?? [])
    } catch (e) {
      console.error('Failed to load users:', e)
    }
  }

  const loadConversations = async () => {
    setLoadingConvs(true)
    try {
      const res = await chatService.getConversations(0, 50)
      setConversations(res?.data?.content ?? [])
    } catch (e) { console.error(e) }
    finally { setLoadingConvs(false) }
  }

  const openConversation = async (convId) => {
    setActiveConvId(convId)
    setMessages([])
    setLoadingMsgs(true)
    isUserAtBottom.current = true
    try {
      const res = await chatService.getMessages(convId, 0, 100)
      setMessages(res?.data?.content ?? [])
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
      await chatService.markRead(convId)
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c))
    } catch (e) { console.error(e) }
    finally { setLoadingMsgs(false) }
  }

  // Auto refresh
  useEffect(() => {
    if (!activeConvId) return
    const interval = setInterval(async () => {
      try {
        const res = await chatService.getMessages(activeConvId, 0, 100)
        if (isUserAtBottom.current) setMessages(res?.data?.content ?? [])
      } catch (e) { console.error(e) }
    }, 2000)
    return () => clearInterval(interval)
  }, [activeConvId])

  // Auto scroll
  useEffect(() => {
    if (isUserAtBottom.current) {
      setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 0)
    }
  }, [messages.length])

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault()
    if (!input.trim() || !activeConvId || sending) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      const msg = await chatService.sendMessage(activeConvId, { messageType: 'TEXT', content: text })
      setMessages(prev => [...prev, msg.data ?? msg])
      setConversations(prev => {
        const updated = prev.map(c => c.id === activeConvId ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() } : c)
        const active = updated.find(c => c.id === activeConvId)
        if (active) {
          updated.splice(updated.indexOf(active), 1)
          updated.unshift(active)
        }
        return updated
      })
    } catch (e) {
      console.error(e)
      setInput(text)
    } finally { setSending(false) }
  }

  // Edit message
  const handleEditMessage = (msg) => {
    setEditingMessageId(msg.id)
    setEditContent(msg.content)
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !activeConvId) return
    setEditLoading(true)
    try {
      const res = await chatService.editMessage(activeConvId, editingMessageId, editContent)
      setMessages(prev => prev.map(m => m.id === editingMessageId ? (res.data ?? res) : m))
      setEditingMessageId(null)
      setEditContent('')
    } catch (e) {
      console.error(e)
      alert('Không thể sửa')
    } finally { setEditLoading(false) }
  }

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Xóa tin nhắn?')) return
    try {
      await chatService.deleteMessage(activeConvId, messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch (e) {
      console.error(e)
      alert('Không thể xóa')
    }
  }

  // Search
  const handleSearchChange = (val) => {
    setSearchQ(val)
    clearTimeout(searchDebounce.current)
    if (!val.trim()) {
      setSearchResults([])
      return
    }
    searchDebounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await userService.searchUsers(val)
        setSearchResults(Array.isArray(res) ? res : (res?.data ?? []))
      } catch (e) { console.error(e) }
      finally { setSearching(false) }
    }, 400)
  }

  const startChat = async (userId) => {
    setSearchQ('')
    setSearchResults([])
    try {
      const res = await chatService.startConversation(userId)
      const conv = res.data ?? res
      setConversations(prev => [conv, ...prev])
      openConversation(conv.id)
    } catch (e) { console.error(e) }
  }

  const filteredConversations = searchQ.trim()
    ? conversations.filter(c => {
        const other = c.participants?.find(p => p.userId !== currentUser.id)
        const name = c.isGroup ? c.groupName : (other?.displayName || 'User')
        return name.toLowerCase().includes(searchQ.toLowerCase())
      })
    : conversations

  // Add reaction
  const handleAddReaction = async (emoji) => {
    if (!reactionsModal.messageId) return
    try {
      await chatService.addReaction(activeConvId, reactionsModal.messageId, emoji)
      const res = await chatService.getMessages(activeConvId, 0, 100)
      setMessages(res?.data?.content ?? [])
      setReactionsModal({ show: false, messageId: null })
    } catch (e) {
      console.error(e)
      alert('Không thể thêm phản ứng')
    }
  }

  // Conversation actions handler
  const handleConversationAction = async (action, conversationId) => {
    try {
      switch (action) {
        case 'pin':
          const convPin = conversations.find(c => c.id === conversationId)
          if (convPin?.isPinned) {
            await chatService.unpinConversation(conversationId)
          } else {
            await chatService.pinConversation(conversationId)
          }
          loadConversations()
          break

        case 'mute':
          const convMute = conversations.find(c => c.id === conversationId)
          if (convMute?.isMuted) {
            await chatService.unmuteConversation(conversationId)
          } else {
            await chatService.muteConversation(conversationId)
          }
          loadConversations()
          break

        case 'unread':
          await chatService.markAsUnread(conversationId)
          setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 1 } : c))
          break

        case 'block':
          const convBlock = conversations.find(c => c.id === conversationId)
          const otherUserBlock = convBlock?.participants?.find(p => p.userId !== currentUser.id)
          if (otherUserBlock && window.confirm(`Chặn ${otherUserBlock.displayName}? Bạn sẽ không thể nhắn tin cho nhau.`)) {
            await chatService.blockUser(otherUserBlock.userId)
            alert('Đã chặn người dùng')
            setConversations(prev => prev.filter(c => c.id !== conversationId))
            if (activeConvId === conversationId) {
              setActiveConvId(null)
            }
          }
          break

        case 'delete':
          if (window.confirm('Xóa cuộc trò chuyện này?')) {
            await chatService.archiveConversation(conversationId)
            setConversations(prev => prev.filter(c => c.id !== conversationId))
            if (activeConvId === conversationId) {
              setActiveConvId(null)
            }
          }
          break
      }
    } catch (e) {
      console.error(e)
      alert('Có lỗi xảy ra')
    }
  }

  const activeConv = conversations.find(c => c.id === activeConvId)
  const otherUser = activeConv?.participants?.find(p => p.userId !== currentUser.id)
  const isOnline = onlineUsers.has(otherUser?.userId)

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 lg:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 hidden md:flex">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tin nhắn</h1>
            <button
              onClick={() => setCreateGroupModal(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Tạo nhóm chat"
            >
              <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">add_circle</span>
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
            <input
              value={searchQ}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Tìm kiếm hoặc bắt đầu chat..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQ.trim() && searchResults.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-800">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 px-4 py-2">NGƯỜI DÙNG</p>
            {searchResults.map(u => (
              <button key={u.id} onClick={() => startChat(u.id)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Avatar src={u.avatarUrl} name={u.displayName} size="sm" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{u.displayName}</p>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
          )}

          {conversations.length === 0 && !loadingConvs && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3">forum</span>
              <p className="font-medium text-gray-600 dark:text-gray-400">Chưa có tin nhắn</p>
              <p className="text-sm text-gray-500 mt-1">Bắt đầu chat ngay</p>
            </div>
          )}

          {filteredConversations.map(c => (
            <ConversationItem
              key={c.id}
              conv={c}
              currentUserId={currentUser.id}
              isActive={c.id === activeConvId}
              onClick={() => openConversation(c.id)}
              online={isOnline}
              onAction={handleConversationAction}
            />
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50">
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div>
              <span className="material-symbols-outlined text-9xl text-gray-200 dark:text-gray-700 mb-6 block">forum</span>
              <h2 className="text-4xl font-bold text-gray-700 dark:text-gray-300 mb-4">Chọn cuộc trò chuyện</h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 w-full px-8">Chọn từ danh sách hoặc bắt đầu cuộc trò chuyện mới</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-2 lg:px-8 md:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3 flex-1">
                <Avatar src={activeConv?.isGroup ? activeConv?.groupAvatarUrl : otherUser?.avatarUrl} name={activeConv?.groupName || otherUser?.displayName} size="lg" online={isOnline && !activeConv?.isGroup} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{activeConv?.groupName || otherUser?.displayName}</p>
                  <p className="text-xs text-gray-500">
                    {isOnline && !activeConv?.isGroup ? '🟢 Đang hoạt động' : '⚫ Không hoạt động'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">call</span>
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">videocam</span>
                </button>
                {activeConv?.isGroup && (
                  <button onClick={() => setGroupManageModal(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">info</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages - Facebook style */}
            <div className="flex-1 overflow-y-auto px-4 lg:px-8 md:px-6 py-4 space-y-3" onScroll={(e) => {
              const el = e.target
              isUserAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100
            }}>
              {loadingMsgs && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              )}

              {messages.length === 0 && !loadingMsgs && (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-3">waving_hand</span>
                  <p className="text-gray-500 dark:text-gray-400">Bắt đầu cuộc trò chuyện</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const prevMsg = messages[idx - 1]
                const isMe = msg.senderId === currentUser.id
                const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) > 60000
                
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {!isMe && (
                      <div className="flex-shrink-0 w-8 h-8">
                        {showAvatar ? (
                          <Avatar src={otherUser?.avatarUrl} name={otherUser?.displayName} size="sm" />
                        ) : (
                          <div className="w-8 h-8" />
                        )}
                      </div>
                    )}
                    {isMe && <div className="flex-shrink-0 w-8 h-8" />}

                    {/* Message bubble */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-xs`}>
                      {/* Text bubble */}
                      <div className={`px-4 py-2 rounded-2xl ${
                        isMe 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}>
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                      
                      {/* Time */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 lg:px-8 md:px-6 py-4">
              <form onSubmit={handleSend} className="flex gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Aa"
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e) }}
                />
                <button type="submit" disabled={!input.trim() || sending} className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Group Management Modal */}
      {groupManageModal && activeConv?.isGroup && (
        <GroupManagementModal
          conversation={activeConv}
          currentUserId={currentUser.id}
          onClose={() => setGroupManageModal(false)}
          onUpdate={(updatedConv) => {
            setConversations(prev => prev.map(c => c.id === updatedConv.id ? updatedConv : c))
          }}
          onDelete={() => {
            setActiveConvId(null)
            loadConversations()
          }}
          onLeave={() => {
            setActiveConvId(null)
            loadConversations()
          }}
        />
      )}

      {/* Create Group Modal */}
      {createGroupModal && (
        <CreateGroupModal
          onClose={() => setCreateGroupModal(false)}
          onCreated={(newConv) => {
            setConversations(prev => [newConv, ...prev])
            openConversation(newConv.id)
          }}
          allUsers={allUsers.filter(u => u.id !== currentUser.id)}
          currentUserId={currentUser.id}
          conversations={conversations}
        />
      )}
    </div>
  )
}
