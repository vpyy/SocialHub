import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import userService from '../services/userService'

export default function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('profile') // profile | password | avatar | cover

  // Profile tab state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  // Avatar tab state
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState('')

  // Cover tab state
  const [coverUrl, setCoverUrl] = useState('')
  const [coverPreview, setCoverPreview] = useState('')
  const [coverLoading, setCoverLoading] = useState(false)
  const [coverError, setCoverError] = useState('')
  const [coverSuccess, setCoverSuccess] = useState('')

  // Load user data on mount
  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        setUser(u)
        setDisplayName(u.displayName || '')
        setBio(u.bio || '')
        setAvatarUrl(u.avatarUrl || '')
        setAvatarPreview(u.avatarUrl || '')
        setCoverUrl(u.coverUrl || '')
        setCoverPreview(u.coverUrl || '')
      } catch (e) {
        console.error('Parse error:', e)
      }
    }
  }, [])

  // ── Profile handlers ──
  const handleProfileSave = async () => {
    if (!displayName.trim()) {
      setProfileError('Tên hiển thị là bắt buộc')
      return
    }
    if (displayName.length > 50) {
      setProfileError('Tên hiển thị tối đa 50 ký tự')
      return
    }
    if (bio.length > 500) {
      setProfileError('Bio tối đa 500 ký tự')
      return
    }

    setProfileLoading(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const res = await userService.updateProfile(displayName, bio)
      const updated = res?.data?.data || res?.data || res
      const newUser = { ...user, displayName: updated.displayName, bio: updated.bio }
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      setProfileSuccess('✅ Hồ sơ đã cập nhật')
      setTimeout(() => setProfileSuccess(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setProfileError(error.response?.data?.message || 'Cập nhật thất bại. Thử lại.')
    } finally {
      setProfileLoading(false)
    }
  }

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

  // ── File upload handlers (Base64) ──
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Chỉ hỗ trợ hình ảnh')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Tối đa 5 MB')
      return
    }

    setAvatarLoading(true)
    setAvatarError('')
    try {
      const dataUrl = await fileToBase64(file)
      setAvatarPreview(dataUrl)
      setAvatarUrl(dataUrl)
      setAvatarSuccess('Preview: Nhấn Lưu để cập nhật')
    } catch (err) {
      setAvatarError('Lỗi đọc file')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleAvatarSave = async () => {
    if (!avatarUrl) {
      setAvatarError('Chọn ảnh trước')
      return
    }

    setAvatarLoading(true)
    setAvatarError('')
    setAvatarSuccess('')

    try {
      const res = await userService.updateAvatar(avatarUrl)
      const updated = res?.data?.data || res?.data || res
      const newUser = { ...user, avatarUrl: updated.avatarUrl }
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      setAvatarSuccess('✅ Avatar đã cập nhật')
      setTimeout(() => setAvatarSuccess(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setAvatarError(error.response?.data?.message || 'Cập nhật thất bại. Thử lại.')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setCoverError('Chỉ hỗ trợ hình ảnh')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setCoverError('Tối đa 10 MB')
      return
    }

    setCoverLoading(true)
    setCoverError('')
    try {
      const dataUrl = await fileToBase64(file)
      setCoverPreview(dataUrl)
      setCoverUrl(dataUrl)
      setCoverSuccess('Preview: Nhấn Lưu để cập nhật')
    } catch (err) {
      setCoverError('Lỗi đọc file')
    } finally {
      setCoverLoading(false)
    }
  }

  const handleCoverSave = async () => {
    if (!coverUrl) {
      setCoverError('Chọn ảnh trước')
      return
    }

    setCoverLoading(true)
    setCoverError('')
    setCoverSuccess('')

    try {
      const res = await userService.updateCover(coverUrl)
      const updated = res?.data?.data || res?.data || res
      const newUser = { ...user, coverUrl: updated.coverUrl }
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      setCoverSuccess('✅ Cover đã cập nhật')
      setTimeout(() => setCoverSuccess(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setCoverError(error.response?.data?.message || 'Cập nhật thất bại. Thử lại.')
    } finally {
      setCoverLoading(false)
    }
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
          { key: 'profile', label: 'Hồ sơ' },
          { key: 'password', label: 'Mật khẩu' },
          { key: 'avatar', label: 'Avatar' },
          { key: 'cover', label: 'Cover' },
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
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Cập nhật thông tin cá nhân</h2>

            {profileError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm rounded-lg">
                {profileSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                disabled={profileLoading}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white"
              />
              <p className="text-xs text-gray-400 mt-1">{displayName.length}/50</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                disabled={profileLoading}
                rows="4"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none disabled:opacity-50 dark:text-white"
              />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
            </div>

            <button
              onClick={handleProfileSave}
              disabled={profileLoading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
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

        {/* Avatar Tab */}
        {activeTab === 'avatar' && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Cập nhật Avatar</h2>

            {avatarError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {avatarError}
              </div>
            )}
            {avatarSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm rounded-lg">
                {avatarSuccess}
              </div>
            )}

            {avatarPreview && (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Preview:</p>
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900 shadow-md"
                />
              </div>
            )}

            <label className="w-full cursor-pointer">
              <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Chọn ảnh hoặc kéo vào đây</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF — Tối đa 5 MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarLoading}
                className="hidden"
              />
            </label>

            <button
              onClick={handleAvatarSave}
              disabled={avatarLoading || !avatarUrl}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {avatarLoading ? 'Đang lưu...' : 'Lưu Avatar'}
            </button>
          </div>
        )}

        {/* Cover Tab */}
        {activeTab === 'cover' && (
          <div className="max-w-2xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Cập nhật Cover</h2>

            {coverError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {coverError}
              </div>
            )}
            {coverSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-sm rounded-lg">
                {coverSuccess}
              </div>
            )}

            {coverPreview && (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Preview:</p>
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-48 rounded-lg object-cover border-2 border-indigo-100 dark:border-indigo-900 shadow-md"
                />
              </div>
            )}

            <label className="w-full cursor-pointer">
              <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Chọn ảnh hoặc kéo vào đây</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF — Tối đa 10 MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                disabled={coverLoading}
                className="hidden"
              />
            </label>

            <button
              onClick={handleCoverSave}
              disabled={coverLoading || !coverUrl}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors dark:bg-indigo-600 dark:hover:bg-indigo-700"
            >
              {coverLoading ? 'Đang lưu...' : 'Lưu Cover'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
