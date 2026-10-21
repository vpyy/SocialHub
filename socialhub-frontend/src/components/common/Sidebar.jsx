import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import notificationService from '../../services/notificationService'

export default function Sidebar({ user, navigate, location }) {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [unreadNotifs, setUnreadNotifs] = useState(0)

  const profilePath = user?.username ? `/profile/${user.username}` : '/profile/me'

  // Poll unread notification count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount()
        setUnreadNotifs(res?.data?.count ?? res?.count ?? 0)
      } catch { /* silent */ }
    }
    fetchCount()
    const id = setInterval(fetchCount, 30000)
    return () => clearInterval(id)
  }, [])

  const navItems = [
    { icon: 'home',          label: 'Home',          path: '/',              fill: true  },
    { icon: 'tag',           label: 'Explore',        path: '/search',        fill: false },
    { icon: 'notifications', label: 'Notifications',  path: '/notifications', fill: false, badge: unreadNotifs > 0 ? String(unreadNotifs > 99 ? '99+' : unreadNotifs) : null },
    { icon: 'chat_bubble',   label: 'Messages',       path: '/messages',      fill: false },
    { icon: 'bookmark',      label: 'Bookmarks',      path: '/bookmarks',     fill: false },
    { icon: 'person',        label: 'Profile',        path: profilePath,      fill: false },
    { icon: 'settings',      label: 'Settings',       path: '/settings',      fill: false },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}&tab=posts`)
    }
  }

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 border-r border-outline-variant/30 flex flex-col justify-between p-4 bg-surface z-30 select-none overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:opacity-80">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md shadow-primary/20 flex-shrink-0">
            <span className="material-symbols-outlined fill-icon text-on-primary">hub</span>
          </div>
          <div>
            <span className="text-headline-md font-headline-md font-bold text-primary block leading-tight tracking-tight">
              SocialHub
            </span>
            <span className="text-label-sm font-label-sm text-outline block leading-none">
              Creator Network
            </span>
          </div>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-3 py-2.5 bg-surface-container rounded-full text-body-sm text-on-surface placeholder:text-outline outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </form>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-full font-label-md transition-all duration-150 active:scale-[0.98] ${
                isActive(item.path)
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${item.fill ? 'fill-icon' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-label-md font-label-md">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-tertiary text-on-tertiary text-label-sm font-label-sm px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Create Post Button */}
        <button className="w-full mt-2 py-3.5 px-5 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary font-headline-md text-title-md font-semibold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">edit_square</span>
          <span>Create Post</span>
        </button>
      </div>

      {/* User Card */}
      <div className="border-t border-outline-variant/30 pt-3 relative">
        <div
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="flex items-center justify-between p-2 rounded-2xl hover:bg-surface-container cursor-pointer transition-colors duration-150"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={user?.avatarUrl || 'https://via.placeholder.com/40'}
              alt={user?.displayName || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-outline-variant flex-shrink-0"
            />
            <div className="truncate min-w-0">
              <p className="text-title-md font-title-md leading-tight text-on-surface truncate">
                {user?.displayName || 'User'}
              </p>
              <p className="text-body-sm font-body-sm text-outline truncate">@{user?.username || 'user'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline flex-shrink-0">more_vert</span>
        </div>

        {/* Dropdown */}
        {showUserDropdown && (
          <div className="absolute bottom-16 left-0 right-0 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-2 flex flex-col gap-1 z-40">
            <button className="flex items-center gap-2.5 px-3 py-2 text-label-md font-label-md text-on-surface hover:bg-surface-container rounded-xl transition-colors">
              <span className="material-symbols-outlined text-outline">badge</span>
              <span>Hồ sơ tác giả</span>
            </button>
            <button className="flex items-center gap-2.5 px-3 py-2 text-label-md font-label-md text-on-surface hover:bg-surface-container rounded-xl transition-colors">
              <span className="material-symbols-outlined text-outline">switch_account</span>
              <span>Chuyển tài khoản</span>
            </button>
            <div className="h-px bg-outline-variant/30 my-1"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-label-md font-label-md text-error hover:bg-error-container/40 rounded-xl transition-colors w-full"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
