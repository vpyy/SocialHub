import { useEffect, useState } from 'react'

/**
 * useAuth hook
 * Centralized user and auth state management
 * Replaces scattered JSON.parse(localStorage.getItem('user')) calls
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load from localStorage
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error('Error loading auth from localStorage:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
  }

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData }
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  return {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    logout,
    updateUser,
  }
}
