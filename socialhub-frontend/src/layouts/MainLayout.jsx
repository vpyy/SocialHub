import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'

export default function MainLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  // No user → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="w-full flex justify-center min-h-screen">
      <div className="w-full max-w-[1400px] flex min-h-screen">
        <Sidebar user={user} navigate={navigate} location={location} />
        <main className="flex-1 flex">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
