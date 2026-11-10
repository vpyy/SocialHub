import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('form') // form | success | error | invalid
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setMessage('Link không hợp lệ hoặc đã hết hạn')
    }
  }, [token])

  const calculatePasswordStrength = (pwd) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (pwd.length >= 12) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return strength
  }

  const handlePasswordChange = (e) => {
    const pwd = e.target.value
    setPassword(pwd)
    setPasswordStrength(calculatePasswordStrength(pwd))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!password || !confirmPassword) {
      setMessage('Vui lòng nhập mật khẩu và xác nhận mật khẩu')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp')
      return
    }

    if (password.length < 8) {
      setMessage('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    if (passwordStrength < 3) {
      setMessage('Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password
      })
      
      setStatus('success')
      setMessage('✅ Mật khẩu đã được đặt lại thành công!')
      
      setTimeout(() => {
        navigate('/login', { state: { message: 'Mật khẩu đã đặt lại. Vui lòng đăng nhập với mật khẩu mới.' } })
      }, 3000)
    } catch (error) {
      setStatus('error')
      const errorMsg = error.response?.data?.message || 'Đặt lại mật khẩu thất bại'
      setMessage(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          
          <h1 className="text-2xl font-bold text-red-600 mb-2">Link Không Hợp Lệ</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            Yêu cầu Link Mới
          </button>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          
          <h1 className="text-2xl font-bold text-green-600 mb-2">Thành Công!</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <p className="text-sm text-gray-500">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          
          <h1 className="text-2xl font-bold text-red-600 mb-2">Đặt Lại Thất Bại</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            Yêu cầu Link Mới
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#f093fb] to-[#f5576c] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">lock</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Đặt Lại Mật khẩu</h1>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Nhập mật khẩu mới của bạn. Mật khẩu phải mạnh và dễ nhớ.
          </p>

          {message && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu Mới</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu mới"
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {passwordStrength <= 2
                      ? 'Yếu'
                      : passwordStrength <= 3
                      ? 'Trung bình'
                      : 'Mạnh'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Xác Nhận Mật khẩu</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu"
                  disabled={loading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Mật khẩu không khớp</p>
              )}
              
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 mt-1">✓ Mật khẩu khớp</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-900 mb-2">Yêu cầu Mật khẩu:</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                  {password.length >= 8 ? '✓' : '•'} Ít nhất 8 ký tự
                </li>
                <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-600' : ''}>
                  {/[a-z]/.test(password) && /[A-Z]/.test(password) ? '✓' : '•'} Chữ hoa và chữ thường
                </li>
                <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                  {/\d/.test(password) ? '✓' : '•'} Ít nhất một số
                </li>
                <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600' : ''}>
                  {/[^a-zA-Z0-9]/.test(password) ? '✓' : '•'} Ít nhất một ký tự đặc biệt (!@#$%^&*)
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg hover:shadow-lg disabled:opacity-50 font-medium transition-all"
            >
              {loading ? 'Đang xử lý...' : 'Đặt Lại Mật khẩu'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Nhớ mật khẩu?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Quay lại Đăng nhập
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
