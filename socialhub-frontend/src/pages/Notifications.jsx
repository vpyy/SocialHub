import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import notificationService from '../services/notificationService'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts)
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d} ngày trước` : new Date(ts).toLocaleDateString('vi-VN')
}

const TYPE_META = {
  LIKE:    { icon: 'favorite',      color: 'text-red-500',    bg: 'bg-red-50',    label: 'đã thích bài viết của bạn' },
  COMMENT: { icon: 'chat_bubble',   color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'đã bình luận bài viết của bạn' },
  FOLLOW:  { icon: 'person_add',    color: 'text-indigo-500', bg: 'bg-indigo-50', label: 'đã theo dõi bạn' },
  MENTION: { icon: 'alternate_email',color:'text-purple-500', bg: 'bg-purple-50', label: 'đã đề cập đến bạn' },
  MESSAGE: { icon: 'mail',          color: 'text-green-500',  bg: 'bg-green-50',  label: 'đã gửi tin nhắn cho bạn' },
}

function Avatar({ src, name, size = 10 }) {
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
  
  const sizeClass = sizeMap[size] || 'w-10 h-10'
  
  return src
    ? <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} />
    : <div className={`${sizeClass} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0`}>{initials}</div>
}

function NotificationItem({ notif, onRead, navigate }) {
  const meta = TYPE_META[notif.type] || TYPE_META.LIKE
  
  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id)
    
    // Navigate to source based on type
    if (notif.type === 'LIKE' || notif.type === 'COMMENT') {
      navigate(`/`)  // Navigate to feed, post will show in there
    } else if (notif.type === 'FOLLOW' || notif.type === 'MENTION') {
      navigate(`/profile/${notif.actorUsername}`)
    } else if (notif.type === 'MESSAGE') {
      navigate(`/messages`)
    }
  }
  
  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-50 ${!notif.isRead ? 'bg-indigo-50/40' : ''}`}
    >
      {/* Actor avatar + type icon */}
      <div className="relative shrink-0 mt-0.5">
        <Avatar src={notif.actorAvatarUrl} name={notif.actorDisplayName} size={10} />
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${meta.bg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined text-[13px] ${meta.color}`}>{meta.icon}</span>
        </span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-snug">
          <span className="font-semibold">{notif.actorDisplayName || notif.actorUsername || 'Ai đó'}</span>
          {' '}{meta.label}
        </p>
        {notif.postContentPreview && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">"{notif.postContentPreview}"</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!notif.isRead && (
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
      )}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [page, setPage]         = useState(0)
  const [hasMore, setHasMore]   = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter]     = useState('all')   // 'all' | 'unread'

  const load = useCallback(async (pageNum = 0, fresh = true) => {
    if (fresh) setLoading(true); else setLoadingMore(true)
    setError(null)
    try {
      const res = await notificationService.getNotifications(pageNum, 20)
      // res = ApiResponse.data = Page<NotificationDto>
      const pageData = res?.data ?? res
      const items = pageData?.content ?? []
      setNotifications(prev => fresh ? items : [...prev, ...items])
      setHasMore(pageData ? !pageData.last : false)
      setPage(pageNum)

      const countRes = await notificationService.getUnreadCount()
      setUnreadCount(countRes?.data?.count ?? countRes?.count ?? 0)
    } catch (e) {
      console.error(e)
      setError('Không thể tải thông báo')
    } finally {
      setLoading(false); setLoadingMore(false)
    }
  }, [])

  useEffect(() => { load(0) }, [load])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (e) { console.error(e) }
  }

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markOneRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) { console.error(e) }
  }

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <section className="flex-1 max-w-[650px] border-r border-gray-100 min-h-screen flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900">Thông báo</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex rounded-full bg-gray-100 p-0.5 text-xs">
            {['all','unread'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full font-medium transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                {f === 'all' ? 'Tất cả' : 'Chưa đọc'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Đọc hết
            </button>
          )}
          <button onClick={() => load(0)} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {loading && [...Array(6)].map((_, i) => <SkeletonRow key={i} />)}

        {error && !loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <span className="material-symbols-outlined text-4xl text-red-200">error</span>
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => load(0)} className="text-xs text-indigo-600 hover:underline">Thử lại</button>
          </div>
        )}

        {!loading && !error && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <span className="material-symbols-outlined text-6xl text-gray-200 mb-3">notifications_off</span>
            <p className="font-semibold text-gray-500 mb-1">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
            <p className="text-xs text-gray-400">Khi có người thích hoặc bình luận bài viết của bạn, thông báo sẽ xuất hiện ở đây.</p>
          </div>
        )}

        {!loading && displayed.map(n => (
          <NotificationItem
            key={n.id}
            notif={n}
            onRead={handleMarkOneRead}
            navigate={navigate}
          />
        ))}

        {hasMore && filter === 'all' && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => load(page + 1, false)}
              disabled={loadingMore}
              className="px-6 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? 'Đang tải…' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
