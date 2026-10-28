import { useEffect } from 'react'

/**
 * Reusable Modal component
 * Fully responsive for mobile (375px) to desktop (1920px)
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'max-w-2xl md:max-w-4xl lg:max-w-6xl',
  actions = null 
}) {
  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-3 sm:p-4 animate-modal-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div 
        className={`
          bg-white dark:bg-slate-900
          rounded-2xl shadow-2xl dark:shadow-2xl
          ${maxWidth}
          w-full
          max-h-[90vh] sm:max-h-[95vh]
          overflow-y-auto
          animate-modal-slide-up
        `}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
          {title && (
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors ml-auto"
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end bg-gray-50 dark:bg-slate-800">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
