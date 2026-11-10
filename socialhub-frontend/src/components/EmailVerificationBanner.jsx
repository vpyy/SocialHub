import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import authApi from '../services/authApi'

/**
 * Email Verification Banner Component
 * Shows banner if user is not email verified
 * Allows resending verification email
 */
export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')

  // Don't show banner if user is verified
  if (!user || user.emailVerified) {
    return null
  }

  const handleResend = async () => {
    if (!user?.email) return

    setIsResending(true)
    try {
      await authApi.resendVerificationEmail(user.email)
      setMessage('✓ Email xác minh đã được gửi lại. Kiểm tra hộp thư của bạn.')
      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Gửi lại email thất bại')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-600 text-[20px] flex-shrink-0 mt-0.5">
          info
        </span>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 text-sm mb-1">
            Email chưa được xác minh
          </h3>
          <p className="text-amber-800 text-xs mb-3">
            Vui lòng xác minh email {user?.email} để truy cập đầy đủ các tính năng.
          </p>
          {message && (
            <p className={`text-xs mb-2 ${message.includes('✓') ? 'text-green-700' : 'text-red-700'}`}>
              {message}
            </p>
          )}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium rounded transition"
          >
            {isResending ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Đang gửi...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[14px]">
                  mail
                </span>
                Gửi lại email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
