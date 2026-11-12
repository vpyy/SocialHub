import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token không tồn tại')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verifyToken) => {
    try {
      setStatus('loading')
      const response = await api.post('/auth/verify-email', { token: verifyToken })
      
      if (response.data) {
        setStatus('success')
        setMessage('✅ Email đã được xác minh thành công!')
        
        setTimeout(() => {
          navigate('/login', { state: { message: 'Email xác minh thành công. Vui lòng đăng nhập.' } })
        }, 3000)
      }
    } catch (error) {
      setStatus('error')
      const errorMsg = error.response?.data?.message || 'Xác minh email thất bại'
      setMessage(errorMsg)
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Vui lòng nhập email')
      return
    }

    setResendLoading(true)
    try {
      await api.post('/auth/resend-verification', { email })
      setMessage('✅ Email xác minh đã được gửi lại. Kiểm tra hộp thư của bạn.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gửi lại email thất bại')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f1f5f9] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Đang xác minh email...</h1>
              <p className="text-gray-600">Vui lòng chờ</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-2">Xác minh Thành Công!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Đang chuyển hướng đến trang đăng nhập...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">❌</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Xác minh Thất Bại</h1>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">Link xác minh có thể đã hết hạn hoặc không hợp lệ.</p>
                
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />

                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition"
                >
                  {resendLoading ? 'Đang gửi...' : 'Gửi lại email xác minh'}
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Quay lại Đăng nhập
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
