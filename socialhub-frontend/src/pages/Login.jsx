import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Only show success message once, then clear it
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear the state after showing
      window.history.replaceState({}, document.title)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: email,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Đăng nhập thất bại')
        return
      }

      localStorage.setItem('token', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))

      navigate('/')
    } catch (err) {
      setError('Lỗi kết nối: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex">
      {/* Animated Background Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-200/30 via-purple-100/20 to-pink-100/20 dark:from-indigo-900/20 dark:via-purple-800/10 dark:to-pink-900/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-indigo-100/20 dark:bg-indigo-900/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-8 lg:px-12 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">hub</span>
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-white">SocialHub</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Mạng xã hội thu nhỏ</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Kết nối bạn bè</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Đăng nhập để tiếp tục chia sẻ khoảnh khắc với bạn bè</p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">check_circle</span>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[18px]">error</span>
              <p className="text-xs text-red-900 dark:text-red-200 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-6">
            {/* Email/Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Email hoặc Tên người dùng</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px]">alternate_email</span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com hoặc @username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/15 dark:focus:ring-indigo-500/15 outline-none transition text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Mật khẩu</label>
                <button
                  type="button"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition"
                  onClick={() => setError('Chức năng quên mật khẩu sẽ sớm có')}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px]">key</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-600/15 dark:focus:ring-indigo-500/15 outline-none transition text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember */}
            <div className="flex items-center pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500/30 dark:focus:ring-indigo-400/30 dark:bg-slate-800" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Ghi nhớ đăng nhập trên thiết bị này</span>
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:shadow-indigo-500/25 dark:from-indigo-600 dark:to-purple-600 dark:hover:shadow-indigo-600/25 disabled:opacity-50 text-white py-3 px-5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all mt-2"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào SocialHub'}</span>
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-xs font-medium">Hoặc tiếp tục với</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          {/* Switch to Register */}
          <div className="text-center pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chưa có tài khoản SocialHub?
              <button
                onClick={() => navigate('/register')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-1"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Content (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center px-8 py-12">
        <div className="max-w-md w-full">
          {/* Illustration or Content */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-slate-200/50 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white mx-auto">
                <span className="material-symbols-outlined text-4xl">people</span>
              </div>

              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Kết nối bạn bè</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Không gian thu nhỏ ấm áp để trò chuyện, chia sẻ khoảnh khắc và giữ liên lạc cùng những người thân thiết mỗi ngày.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                {[
                  { icon: 'favorite', label: 'Chia sẻ khoảnh khắc' },
                  { icon: 'forum', label: 'Trò chuyện với bạn' },
                  { icon: 'bookmark', label: 'Lưu bài viết yêu thích' },
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <span className="material-symbols-outlined text-[18px]">{feature.icon}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Được tin tưởng bởi hàng nghìn người dùng</p>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-amber-400 dark:text-amber-500 text-[18px]">star</span>
              ))}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">4.9 / 5 - Tuyệt vời!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
