import { forwardRef } from 'react'

/**
 * Reusable Form Input component
 * Consistent styling across forms (Login, Register, Settings, etc.)
 */
const FormInput = forwardRef(({
  label,
  error = '',
  required = false,
  type = 'text',
  placeholder = '',
  size = 'md', // sm, md, lg
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const sizeMap = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-4 py-3 text-base',
  }

  const sizeClass = sizeMap[size] || sizeMap.md

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full
          ${sizeClass}
          rounded-lg
          border border-gray-300 dark:border-slate-700
          bg-white dark:bg-slate-800
          text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          dark:focus:ring-indigo-400 dark:focus:border-indigo-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
})

FormInput.displayName = 'FormInput'

export default FormInput
