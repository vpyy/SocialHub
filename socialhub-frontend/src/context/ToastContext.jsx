import { createContext, useState, useCallback } from 'react'

export const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now()
    const toast = { id, message, type }

    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  const typeStyles = {
    success: 'bg-green-600 dark:bg-green-700 text-white',
    error: 'bg-red-600 dark:bg-red-700 text-white',
    warning: 'bg-amber-600 dark:bg-amber-700 text-white',
    info: 'bg-blue-600 dark:bg-blue-700 text-white',
  }

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-3 z-[999] pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            ${typeStyles[toast.type]}
            px-4 py-3 rounded-lg shadow-lg
            flex items-center gap-3
            animate-toast-slide-in
            pointer-events-auto
            max-w-sm
          `}
          role="alert"
        >
          <span className="font-bold text-lg">{typeIcons[toast.type]}</span>
          <span className="flex-1 text-sm">{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 hover:opacity-70 transition-opacity"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
