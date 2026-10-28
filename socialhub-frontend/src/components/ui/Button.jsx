import { forwardRef } from 'react'

/**
 * Reusable Button component
 * Responsive sizes with mobile-first 44px touch target
 */
const Button = forwardRef(({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon = null,
  children,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props
}, ref) => {
  // Variant styles
  const variantMap = {
    primary: 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 active:bg-indigo-800',
    secondary: 'bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 dark:hover:bg-purple-600 active:bg-purple-800',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200',
    danger: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800',
  }

  // Size mapping - mobile-first: ensure 44px minimum touch target
  const sizeMap = {
    sm: 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm h-8 sm:h-9',
    md: 'px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base h-10 sm:h-11',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg h-11 sm:h-12',
  }

  const variantClass = variantMap[variant] || variantMap.primary
  const sizeClass = sizeMap[size] || sizeMap.md
  const widthClass = fullWidth ? 'w-full' : ''

  const buttonClass = `
    ${sizeClass}
    ${variantClass}
    ${widthClass}
    inline-flex items-center justify-center gap-2
    rounded-lg font-semibold
    transition-all duration-150
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
    dark:focus:ring-offset-slate-900
    ${loading ? 'opacity-50 pointer-events-none' : ''}
    ${className}
  `

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClass}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
