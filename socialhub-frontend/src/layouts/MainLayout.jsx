import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom'
import Sidebar from '../components/common/Sidebar'
import { useAuth } from '../context/AuthContext'

export default function MainLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user: authUser, isAuthenticated, isLoading } = useAuth()

  // Fallback to localStorage if authUser is not set in state yet
  const localUser = (() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  const currentUser = authUser || localUser

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-300 dark:border-indigo-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
      </div>
    )
  }

  // Not loading and not authenticated and no user -> redirect to login
  if (!isAuthenticated && !currentUser) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-white dark:bg-gray-950">
      <div className="w-full h-full flex min-w-0">
        <Sidebar user={currentUser} navigate={navigate} location={location} />

        <main className="flex-1 min-w-0 h-full overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
