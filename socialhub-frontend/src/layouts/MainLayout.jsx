import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Failed to parse user data:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

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
