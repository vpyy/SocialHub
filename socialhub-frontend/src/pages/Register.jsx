import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    // Validation
    if (formData.password !== formData.passwordConfirm) {
      showToast('Mật khẩu không khớp', 'error')
      return
    }

    if (formData.password.length < 8) {
      showToast('Mật khẩu phải có ít nhất 8 ký tự', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        showToast(data.message || 'Đăng ký thất bại', 'error')
        return
      }

      showToast('Đăng ký thành công! Đang chuyển đến đăng nhập...', 'success')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      showToast('Lỗi kết nối: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] flex">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 max-w-xs px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 z-50 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <span className={`material-symbols-outlined text-[20px] ${
            toast.type === 'success' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <p className={`text-sm font-medium ${
            toast.type === 'success' ? 'text-emerald-900' : 'text-red-900'
          }`}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Animated Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-200/30 via-purple-100/20 to-pink-100/20 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-indigo-100/20 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Left Side - Form (Full Width) */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-8 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">hub</span>
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">SocialHub</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Mạng xã hội thu nhỏ</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Tạo tài khoản</h1>
            <p className="text-slate-500 text-sm">Tham gia SocialHub và kết nối với bạn bè ngay hôm nay</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-3.5 mb-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Họ và tên</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">badge</span>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Hoàng Minh"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 outline-none transition text-sm text-slate-800 placeholder:text-slate-400"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Username sẽ tự tạo từ tên của bạn</p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 outline-none transition text-sm text-slate-800 placeholder:text-slate-400"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Password & Confirm (Grid 2 cột) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Mật khẩu</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">key</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 outline-none transition text-sm text-slate-800 placeholder:text-slate-400"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Xác nhận mật khẩu</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">check_circle</span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="passwordConfirm"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/15 outline-none transition text-sm text-slate-800 placeholder:text-slate-400"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" required className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30" />
                <span className="text-xs text-slate-600 leading-snug">
                  Tôi đồng ý với <a className="text-indigo-600 font-semibold hover:underline" href="#">Điều khoản dịch vụ</a> và <a className="text-indigo-600 font-semibold hover:underline" href="#">Chính sách quyền riêng tư</a> của SocialHub.
                </span>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 text-white py-3 px-5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all mt-2"
            >
              <span>{loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản SocialHub'}</span>
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Đã có tài khoản?
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 font-bold hover:underline ml-1"
              >
                Đăng nhập
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
