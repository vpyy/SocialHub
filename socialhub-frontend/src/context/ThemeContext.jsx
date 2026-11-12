import { createContext, useState, useEffect, useCallback } from 'react'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'

    // Otherwise check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Update HTML class and localStorage when theme changes
  useEffect(() => {
    const html = document.documentElement
    if (isDarkMode) {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev)
  }, [])

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
