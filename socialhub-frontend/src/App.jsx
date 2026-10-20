import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import Bookmarks from './pages/Bookmarks'
import Messages from './pages/Messages'
import Settings from './pages/Settings'
import './App.css'

// Protected Route Component - TEMPORARY: Auto-login for development
function ProtectedRoute({ element }) {
  useEffect(() => {
    // Auto-create session if not exists
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token) {
      localStorage.setItem('token', 'dev-token-temp')
      console.log('✅ Auto-created dev token')
    }
    
    if (!user) {
      const devUser = {
        id: 'temp-user-id',
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@socialhub.com',
        avatarUrl: 'https://via.placeholder.com/100'
      }
      localStorage.setItem('user', JSON.stringify(devUser))
      console.log('✅ Auto-created dev user:', devUser)
    }
  }, [])
  
  return element
}

function App() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize app
    console.log('🚀 SocialHub App initializing...')
    
    // Auto-create dev session
    const token = localStorage.getItem('token')
    if (!token) {
      localStorage.setItem('token', 'dev-token-temp')
    }
    
    const user = localStorage.getItem('user')
    if (!user) {
      const devUser = {
        id: 'temp-user-id',
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@socialhub.com',
        avatarUrl: 'https://via.placeholder.com/100'
      }
      localStorage.setItem('user', JSON.stringify(devUser))
    }
    
    setIsReady(true)
    console.log('✅ App ready!')
  }, [])

  if (!isReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#faf8ff] to-[#e2e7ff]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#4648d4] mx-auto mb-4 flex items-center justify-center animate-pulse"></div>
          <p className="text-[#767586]">Loading SocialHub...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<ProtectedRoute element={<Feed />} />} />
          <Route path="/profile/:username" element={<ProtectedRoute element={<Profile />} />} />
          <Route path="/search" element={<ProtectedRoute element={<Search />} />} />
          <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
          <Route path="/bookmarks" element={<ProtectedRoute element={<Bookmarks />} />} />
          <Route path="/messages" element={<ProtectedRoute element={<Messages />} />} />
          <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
        </Route>

        {/* Catch all - redirect to home (not login) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
