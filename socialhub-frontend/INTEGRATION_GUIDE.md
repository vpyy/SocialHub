# Frontend Integration Guide — Phase 1-2 Auth APIs

Tài liệu này hướng dẫn cách sử dụng các API endpoints từ frontend components.

---

## 📦 Import & Setup

### 1. Import authApi Service

```javascript
import authApi from '../services/authApi'
```

### 2. Use in Components

Tất cả các hàm từ `authApi.js` đều trả về Promise với response data.

---

## 🔐 Phase 1: Core Auth

### Login

```javascript
import { useAuth } from '../context/AuthContext'
import authApi from '../services/authApi'

export default function LoginPage() {
  const { login } = useAuth()
  
  const handleLogin = async (emailOrUsername, password) => {
    try {
      const result = await login(emailOrUsername, password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Login failed')
    }
  }
}
```

### Register

```javascript
const handleRegister = async (email, username, password, displayName) => {
  try {
    const response = await authApi.register(email, username, password, displayName)
    // response.data contains UserDto
    navigate('/verify-email', { state: { email } })
  } catch (error) {
    setError(error.response?.data?.message)
  }
}
```

### Refresh Token

```javascript
// Automatic in api.js interceptor, or manually:
const handleRefresh = async () => {
  try {
    const response = await authApi.refreshToken()
    // response.data.accessToken updated
  } catch (error) {
    // Session expired, redirect to login
  }
}
```

### Logout

```javascript
const handleLogout = async () => {
  try {
    await authApi.logout()
    // Clear auth context, redirect
  } catch (error) {
    console.error('Logout error', error)
  }
}
```

### Logout All Devices

```javascript
const handleLogoutAll = async () => {
  try {
    await authApi.logoutAllSessions(false) // or true to keep current session
    // Logged out from all devices
  } catch (error) {
    console.error('Error', error)
  }
}
```

### View Active Sessions

```javascript
const [sessions, setSessions] = useState([])

useEffect(() => {
  const fetchSessions = async () => {
    try {
      const response = await authApi.getSessions()
      // response.data = array of session objects with isCurrent flag
      setSessions(response.data)
    } catch (error) {
      console.error('Error', error)
    }
  }
  fetchSessions()
}, [])

// Render sessions with revoke buttons:
{sessions.map(session => (
  <div key={session.sessionId}>
    <span>{session.deviceName} - {session.ipAddress}</span>
    {!session.isCurrent && (
      <button onClick={() => revokeSession(session.sessionId)}>
        Revoke
      </button>
    )}
  </div>
))}
```

### Revoke Specific Session

```javascript
const handleRevokeSession = async (sessionId) => {
  try {
    await authApi.revokeSession(sessionId)
    // Session revoked, refresh list
  } catch (error) {
    console.error('Error', error)
  }
}
```

---

## 📧 Phase 2: Email Verification

### Verify Email (from email link)

```javascript
// VerifyEmail.jsx
import { useSearchParams } from 'react-router-dom'
import authApi from '../services/authApi'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  
  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('invalid')
      return
    }
    
    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail(token)
        setStatus('success')
        setTimeout(() => navigate('/login'), 3000)
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data?.message)
      }
    }
    
    verifyEmail()
  }, [searchParams])
  
  return (
    // UI based on status: loading, success, error
  )
}
```

### Resend Verification Email

```javascript
const [email, setEmail] = useState('')
const [loading, setLoading] = useState(false)
const [message, setMessage] = useState('')

const handleResendEmail = async () => {
  if (!email) {
    setMessage('Vui lòng nhập email')
    return
  }
  
  setLoading(true)
  try {
    await authApi.resendVerificationEmail(email)
    setMessage('✓ Email đã được gửi. Kiểm tra hộp thư của bạn.')
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Gửi lại email thất bại'
    setMessage(errorMsg)
    // Rate limit error (429): "Vui lòng đợi trước khi gửi lại"
  } finally {
    setLoading(false)
  }
}
```

### Email Verification Banner

```javascript
// Use in MainLayout or page header
import EmailVerificationBanner from '../components/EmailVerificationBanner'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
  const { user } = useAuth()
  
  if (!user?.emailVerified) {
    return <EmailVerificationBanner />
  }
  return null
}
```

---

## 🔑 Phase 2: Password Reset

### Request Password Reset Email

```javascript
// ForgotPassword.jsx
const [email, setEmail] = useState('')
const [submitted, setSubmitted] = useState(false)
const [loading, setLoading] = useState(false)

const handleSubmit = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  try {
    // Always returns success message for security (no user enumeration)
    await authApi.requestPasswordReset(email)
    setSubmitted(true)
  } catch (error) {
    // Still shows success (backend doesn't reveal if user exists)
    setSubmitted(true)
  } finally {
    setLoading(false)
  }
}
```

### Reset Password (from email link)

```javascript
// ResetPassword.jsx
import { useSearchParams } from 'react-router-dom'
import authApi from '../services/authApi'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('form')
  
  const token = searchParams.get('token')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage('Mật khẩu xác nhận không khớp')
      return
    }
    
    if (password.length < 8) {
      setMessage('Mật khẩu phải ít nhất 8 ký tự')
      return
    }
    
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      // All sessions revoked after reset
      setStatus('success')
      setTimeout(() => navigate('/login'), 3000)
    } catch (error) {
      setStatus('error')
      // Error: "Token hết hạn", "Token đã sử dụng", etc.
      const msg = error.response?.data?.message
      setMessage(msg)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    // Form with password inputs, strength indicator, submit button
  )
}
```

---

## 🔐 Phase 2: Google OAuth (Optional)

### Setup Google Sign-In

```javascript
// Login.jsx
import { useEffect } from 'react'
import authApi from '../services/authApi'

export default function Login() {
  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    document.head.appendChild(script)
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])
  
  const handleGoogleLogin = async (googleIdToken) => {
    try {
      const response = await authApi.authenticateWithGoogle(googleIdToken)
      // response.data.token = JWT access token
      // response.data.user = UserDto with authProvider="GOOGLE"
      setAccessToken(response.data.token)
      navigate('/')
    } catch (error) {
      setError(error.response?.data?.message || 'Google login failed')
    }
  }
  
  return (
    // Add Google Sign-In button
    <div id="google-signin-button"></div>
  )
}
```

### Handle Google ID Token

```javascript
// After Google Sign-In callback
const handleCredentialResponse = (response) => {
  // response.credential = Google ID token
  authApi.authenticateWithGoogle(response.credential)
    .then(res => {
      // Login successful
    })
    .catch(err => {
      // Login failed
    })
}

// Initialize Google Button with callback
window.google.accounts.id.initialize({
  client_id: 'YOUR_GOOGLE_CLIENT_ID',
  callback: handleCredentialResponse
})

window.google.accounts.id.renderButton(
  document.getElementById('google-signin-button'),
  { theme: 'outline', size: 'large' }
)
```

---

## 👤 User Profile

### Get Current User

```javascript
const handleGetCurrentUser = async () => {
  try {
    const response = await authApi.getCurrentUser()
    // response.data = UserDto (id, email, username, emailVerified, authProvider, etc.)
    setCurrentUser(response.data)
  } catch (error) {
    console.error('Error', error)
  }
}
```

### Update Profile

```javascript
const handleUpdateProfile = async (updates) => {
  try {
    const response = await authApi.updateProfile({
      displayName: 'New Name',
      bio: 'New bio',
      email: 'newemail@example.com' // Requires re-verification
    })
    // Profile updated
  } catch (error) {
    setError(error.response?.data?.message)
  }
}
```

### Change Password

```javascript
const handleChangePassword = async (oldPassword, newPassword) => {
  try {
    await authApi.changePassword(oldPassword, newPassword)
    // Password changed
  } catch (error) {
    setError(error.response?.data?.message)
    // Error: "Mật khẩu cũ không đúng"
  }
}
```

---

## 🛠 Error Handling Pattern

Tất cả các hàm từ `authApi` sử dụng error handling chung:

```javascript
try {
  const response = await authApi.someFunction()
  // Success: response.data contains data
} catch (error) {
  // error.response?.status = HTTP status (401, 429, etc.)
  // error.response?.data?.message = Server error message
  // error.response?.data?.error?.code = Error code
  
  if (error.response?.status === 429) {
    // Rate limited
    setError('Bạn đã thử quá nhiều lần. Vui lòng đợi.')
  } else if (error.response?.status === 401) {
    // Unauthorized
    setError('Phiên hết hạn, vui lòng đăng nhập lại')
  } else if (error.response?.data?.message) {
    setError(error.response.data.message)
  } else {
    setError('Lỗi kết nối')
  }
}
```

---

## 📝 Response Data Structures

### LoginResponse
```javascript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  tokenType: "Bearer",
  expiresIn: 1800,  // seconds
  user: {
    id: "userId",
    username: "username",
    email: "user@example.com",
    displayName: "Display Name",
    emailVerified: true|false,
    authProvider: "LOCAL|GOOGLE",
    avatarUrl: "...",
    coverUrl: "...",
    bio: "...",
    role: "USER|ADMIN",
    status: "ACTIVE|BLOCKED"
  }
}
```

### Session Object
```javascript
{
  sessionId: "uuid",
  userId: "userId",
  deviceName: "Chrome on macOS",
  osName: "macOS",
  browserName: "Chrome",
  ipAddress: "192.168.1.1",
  createdAt: 1234567890000,
  lastUsedAt: 1234567890000,
  isCurrent: true|false
}
```

### VerificationToken (Internal)
```javascript
// Not exposed directly, but backend tracks:
{
  type: "EMAIL_VERIFY|PASSWORD_RESET",
  expiresAt: 1234567890000,
  used: true|false
}
```

---

## 🔒 Security Best Practices

1. **Access Token**: Lưu trong memory (không localStorage)
2. **Refresh Token**: HTTP-only cookie (tự động gửi)
3. **Password**: Min 8 ký tự + uppercase + lowercase + digit + special char
4. **Email Verification**: Bắt buộc trước khi sử dụng toàn bộ tính năng
5. **Rate Limiting**: Tuân thủ 429 responses, đợi trước khi retry
6. **Logout**: Hãy gọi logout API trước khi clear localStorage
7. **Google OAuth**: Validate idToken trên backend (frontend verification không đủ)

---

## 🎯 Integration Checklist

- [ ] Import `authApi` và `useAuth` đúng chỗ
- [ ] Handle error responses từ backend (429, 401, 400)
- [ ] Implement retry logic cho network errors
- [ ] Place `EmailVerificationBanner` ở vị trí hiển thị
- [ ] Test email verification flow end-to-end
- [ ] Test password reset flow end-to-end
- [ ] Test rate limiting (spam 5+ times)
- [ ] Test logout from all devices
- [ ] Test Google OAuth (if implemented)
- [ ] Verify refresh token rotation works
- [ ] Verify session management UI

---

## 🚀 Quick Start Example

```javascript
import { useAuth } from '../context/AuthContext'
import authApi from '../services/authApi'
import EmailVerificationBanner from '../components/EmailVerificationBanner'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [sessions, setSessions] = useState([])
  
  useEffect(() => {
    fetchSessions()
  }, [])
  
  const fetchSessions = async () => {
    try {
      const response = await authApi.getSessions()
      setSessions(response.data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }
  
  const handleLogout = async () => {
    try {
      await authApi.logout()
      logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  return (
    <div>
      <EmailVerificationBanner />
      
      <h1>Welcome, {user?.displayName}!</h1>
      <p>Email: {user?.email}</p>
      <p>Verified: {user?.emailVerified ? '✓ Yes' : '✗ No'}</p>
      
      <h2>Active Sessions</h2>
      <ul>
        {sessions.map(session => (
          <li key={session.sessionId}>
            {session.deviceName} - {session.ipAddress}
            {session.isCurrent && ' (Current)'}
          </li>
        ))}
      </ul>
      
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
```

---

Ghi chú: Tất cả URLs trong guide này sử dụng base URL từ `api.js` (default: `http://localhost:8080/api`)
