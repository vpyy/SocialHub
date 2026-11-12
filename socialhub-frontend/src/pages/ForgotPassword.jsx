import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Vui lòng nhập email')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi email thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kiểm tra Email</h1>
          <p className="text-gray-600 mb-4">
            Nếu tài khoản với email <strong>{email}</strong> tồn tại, bạn sẽ nhận được email với hướng dẫn đặt lại mật khẩu.
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Link sẽ hết hạn trong 30 phút.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition"
          >
            Quay lại Đăng nhập
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
              <span className="material-symbols-outlined text-[22px]">lock_reset</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Đặt lại Mật khẩu</h1>
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Nhập email tài khoản của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để đặt lại mật khẩu.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg hover:shadow-lg disabled:opacity-50 font-medium transition-all"
            >
              {loading ? 'Đang gửi...' : 'Gửi Email Đặt lại Mật khẩu'}
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
