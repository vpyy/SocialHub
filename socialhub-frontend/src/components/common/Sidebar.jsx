import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import notificationService from '../../services/notificationService'
import chatService from '../../services/chatService'
import ThemeToggle from '../ThemeToggle'
import { useTheme } from '../../hooks/useTheme'

export default function Sidebar({ user, navigate, location }) {
  const { i18n, t } = useTranslation()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [savedAccounts, setSavedAccounts] = useState([])
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const profilePath = user?.username ? `/profile/${user.username}` : '/profile/me'

  // Load saved accounts from localStorage
  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]')
    setSavedAccounts(accounts)
  }, [])

  // Save current account to savedAccounts if not already saved
  useEffect(() => {
    if (user?.id) {
      const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]')
      const existingIndex = accounts.findIndex(acc => acc.id === user.id)
      
      const currentAccountData = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        token: localStorage.getItem('token'),
        lastUsed: Date.now()
      }

      if (existingIndex >= 0) {
        // Update existing account
        accounts[existingIndex] = currentAccountData
      } else {
        // Add new account
        accounts.push(currentAccountData)
      }

      localStorage.setItem('savedAccounts', JSON.stringify(accounts))
      setSavedAccounts(accounts)
    }
  }, [user])

  // Poll unread notification count every 2s for real-time updates
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationService.getUnreadCount()
        setUnreadNotifs(res?.data?.count ?? res?.count ?? 0)
      } catch { /* silent */ }
    }
    fetchCount()
    const id = setInterval(fetchCount, 2000)  // Changed from 30s to 2s for real-time
    return () => clearInterval(id)
  }, [])

  // Poll unread message count every 2s for real-time updates
  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        const res = await chatService.getConversations(0, 1000)
        const data = res?.data ?? res
        const convs = data?.content ?? []
        const totalUnread = convs.reduce((sum, conv) => sum + (conv.unreadCount ?? 0), 0)
        setUnreadMessages(totalUnread)
      } catch { /* silent */ }
    }
    fetchMessageCount()
    const id = setInterval(fetchMessageCount, 2000)
    return () => clearInterval(id)
  }, [])

  const navItems = [
    { icon: 'home',          labelKey: 'nav.home',          path: '/',              fill: true  },
    { icon: 'tag',           labelKey: 'nav.explore',       path: '/search',        fill: false },
    { icon: 'notifications', labelKey: 'nav.notifications', path: '/notifications', fill: false, badge: unreadNotifs > 0 ? String(unreadNotifs > 99 ? '99+' : unreadNotifs) : null },
    { icon: 'chat_bubble',   labelKey: 'nav.messages',      path: '/messages',      fill: false, badge: unreadMessages > 0 ? String(unreadMessages > 99 ? '99+' : unreadMessages) : null },
    { icon: 'bookmark',      labelKey: 'nav.bookmarks',     path: '/bookmarks',     fill: false },
    { icon: 'person',        labelKey: 'nav.profile',       path: profilePath,      fill: false },
    { icon: 'settings',      labelKey: 'nav.settings',      path: '/settings',      fill: false },
  ]

  const isActive = (path) => location.pathname === path

  const handleGoToProfile = () => {
    setShowUserDropdown(false)
    navigate(profilePath)
  }

  const handleSwitchAccount = () => {
    setShowUserDropdown(false)
    setShowSwitchAccountModal(true)
  }

  const handleSelectAccount = (account) => {
    // Switch to selected account
    localStorage.setItem('token', account.token)
    localStorage.setItem('user', JSON.stringify({
      id: account.id,
      username: account.username,
      displayName: account.displayName,
      avatarUrl: account.avatarUrl
    }))
    
    // Update last used time
    const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]')
    const updatedAccounts = accounts.map(acc => 
      acc.id === account.id ? { ...acc, lastUsed: Date.now() } : acc
    )
    localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts))
    
    // Reload page to refresh with new account
    window.location.href = '/'
  }

  const handleRemoveAccount = (accountId, e) => {
    e.stopPropagation()
    
    if (accountId === user?.id) {
      alert('Không thể xóa tài khoản đang sử dụng')
      return
    }

    if (!confirm('Bạn có chắc muốn xóa tài khoản này khỏi danh sách?')) {
      return
    }

    const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]')
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId)
    localStorage.setItem('savedAccounts', JSON.stringify(updatedAccounts))
    setSavedAccounts(updatedAccounts)
  }

  const handleAddNewAccount = () => {
    setShowSwitchAccountModal(false)
    // Don't clear current account data, just navigate to login
    navigate('/login?add=true')
  }

  const handleLogout = () => {
    // Don't remove from savedAccounts, just logout
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('language', langCode)
    setShowLanguageMenu(false)
  }

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}&tab=posts`)
    }
  }

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between p-4 bg-white dark:bg-gray-900 z-30 select-none overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <span className="material-symbols-outlined fill-icon text-white">hub</span>
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900 dark:text-white block leading-tight tracking-tight">
              SocialHub
            </span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block leading-none">
              Creator Network
            </span>
          </div>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px]">search</span>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('common.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 transition-all"
          />
        </form>

        {/* Navigation */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-150 active:scale-[0.98] ${
                isActive(item.path)
                  ? 'bg-indigo-600 dark:bg-indigo-600 text-white font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${item.fill ? 'fill-icon' : ''}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{t(item.labelKey)}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 dark:bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded-md">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* User Card */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-3 relative">
        <div className="flex items-center justify-between px-2 py-2">
          <ThemeToggle />
          <div
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors flex-1 ml-2"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user?.avatarUrl || 'https://via.placeholder.com/40'}
                alt={user?.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
              <div className="truncate min-w-0">
                <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username || 'user'}</p>
              </div>
            </div>
            <span className="ml-1 text-gray-600 dark:text-gray-400">⋮</span>
          </div>
        </div>

        {/* Dropdown */}
        {showUserDropdown && (
          <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex flex-col gap-1 z-40">
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{currentLanguage.flag}</span>
                  <span>{currentLanguage.name}</span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Language submenu */}
              {showLanguageMenu && (
                <div className="mt-1 ml-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        lang.code === i18n.language 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.name}</span>
                      {lang.code === i18n.language && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
            
            <button 
              onClick={handleSwitchAccount}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">switch_account</span>
              <span>{i18n.language === 'vi' ? 'Chuyển tài khoản' : 'Switch Account'}</span>
            </button>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors w-full"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>{i18n.language === 'vi' ? 'Đăng xuất' : 'Logout'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Switch Account Modal */}
      {showSwitchAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSwitchAccountModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Chuyển tài khoản
              </h2>
              <button
                onClick={() => setShowSwitchAccountModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {savedAccounts
                  .sort((a, b) => b.lastUsed - a.lastUsed)
                  .map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleSelectAccount(account)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        account.id === user?.id
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                      }`}
                    >
                      <img
                        src={account.avatarUrl || 'https://via.placeholder.com/48'}
                        alt={account.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {account.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{account.username}
                        </p>
                      </div>
                      {account.id === user?.id && (
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-1 rounded-md">
                          Đang dùng
                        </span>
                      )}
                      {account.id !== user?.id && (
                        <button
                          onClick={(e) => handleRemoveAccount(account.id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title="Xóa tài khoản"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
              </div>

              {/* Add New Account Button */}
              <button
                onClick={handleAddNewAccount}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Thêm tài khoản mới</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
