import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'
import userService from '../services/userService'

export default function Settings() {
  const navigate = useNavigate()
  const { i18n, t } = useTranslation()
  const { isDark, toggleTheme } = useTheme()
  
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('display') // display | language | notifications | password

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  // Notifications state
  const [notifSettings, setNotifSettings] = useState({
    likeNotif: true,
    commentNotif: true,
    followNotif: true,
    messageNotif: true,
  })
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifError, setNotifError] = useState('')
  const [notifSuccess, setNotifSuccess] = useState('')

  // Load user data on mount
  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setUser(u)
      } catch (e) {
        console.error('Parse error:', e)
      }
    }

    // Load notification settings from localStorage
    const saved = localStorage.getItem('notifSettings')
    if (saved) {
      try {
        setNotifSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Parse notif settings error:', e)
      }
    }
  }, [])


  // ── Password handlers ──
  const handlePasswordChange = async () => {
    if (!currentPassword) {
      setPasswordError('Nhập mật khẩu hiện tại')
      return
    }
    if (!newPassword) {
      setPasswordError('Nhập mật khẩu mới')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu phải ≥ 8 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp')
      return
    }

    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')

    try {
      await userService.changePassword(currentPassword, newPassword)
      setPasswordSuccess('✅ Mật khẩu đã thay đổi. Đăng nhập lại...')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      setPasswordError(error.response?.data?.message || 'Thay đổi mật khẩu thất bại. Thử lại.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // ── Notification handlers ──
  const handleNotifToggle = (key) => {
    const updated = { ...notifSettings, [key]: !notifSettings[key] }
    setNotifSettings(updated)
  }

  const handleNotifSave = async () => {
    setNotifLoading(true)
    setNotifError('')
    setNotifSuccess('')

    try {
      // Save to localStorage (backend integration can be added later)
      localStorage.setItem('notifSettings', JSON.stringify(notifSettings))
      setNotifSuccess('✅ Cài đặt thông báo đã lưu')
      setTimeout(() => setNotifSuccess(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setNotifError('Lưu cài đặt thất bại')
    } finally {
      setNotifLoading(false)
    }
  }

  // ── Language handler ──
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  if (!user) {
    return (
      <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-700 min-h-screen pb-20 flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 shrink-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 sticky top-[61px] z-10 bg-white dark:bg-gray-950 overflow-x-auto">
        {[
          { key: 'display', label: 'Hiển thị' },
          { key: 'language', label: 'Ngôn ngữ' },
          { key: 'notifications', label: 'Thông báo' },
          { key: 'password', label: 'Mật khẩu' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Display Tab - Dark Mode */}
        {activeTab === 'display' && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Chế độ hiển thị</h2>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Chế độ tối</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {isDark ? '✅ Đang bật' : '⚪ Đang tắt'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    isDark ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Language Tab */}
        {activeTab === 'language' && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Ngôn ngữ</h2>

            <div className="space-y-3">
              {[
                { code: 'vi', name: '🇻🇳 Tiếng Việt' },
                { code: 'en', name: '🇬🇧 English' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                    i18n.language === lang.code
                      ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-indigo-400 dark:hover:border-indigo-500'
                  }`}
                >
                  {lang.name}
                  {i18n.language === lang.code && ' ✓'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Cài đặt thông báo</h2>

            {notifError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {notifError}
              </div>
            )}
            {notifSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm rounded-lg">
                {notifSuccess}
              </div>
            )}

            <div className="space-y-3">
              {[
                { key: 'likeNotif', label: '❤️ Thích bài viết', desc: 'Nhận thông báo khi bài viết được thích' },
                { key: 'commentNotif', label: '💬 Bình luận', desc: 'Nhận thông báo khi có bình luận mới' },
                { key: 'followNotif', label: '👥 Người theo dõi mới', desc: 'Nhận thông báo khi có người theo dõi' },
                { key: 'messageNotif', label: '✉️ Tin nhắn', desc: 'Nhận thông báo khi có tin nhắn mới' },
              ].map(item => (
                <div key={item.key} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleNotifToggle(item.key)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      notifSettings[item.key] ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        notifSettings[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleNotifSave}
              disabled={notifLoading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {notifLoading ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Thay đổi mật khẩu</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Vì lý do bảo mật, bạn sẽ cần đăng nhập lại sau khi thay đổi.</p>

            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm rounded-lg">
                {passwordSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Tối thiểu 8 ký tự</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={passwordLoading}
                  className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
