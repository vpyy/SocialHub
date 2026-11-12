import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {isDarkMode ? (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v1m6.364 1.636l-.707-.707M21 12h-1m-3.364 6.364l-.707.707M12 20v1m-6.364-1.636l.707.707M3 12h1m3.364-6.364l.707-.707M17 12a5 5 0 11-10 0 5 5 0 0110 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
