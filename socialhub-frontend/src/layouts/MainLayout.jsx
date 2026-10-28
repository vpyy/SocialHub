import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import ResponsiveLayout from './ResponsiveLayout'

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
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  // No user → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <ResponsiveLayout user={user} navigate={navigate}>
      <Outlet />
    </ResponsiveLayout>
  )
}
