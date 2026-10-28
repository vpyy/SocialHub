import { forwardRef } from 'react'

/**
 * Reusable Textarea component
 * Consistent styling for multi-line text input
 */
const Textarea = forwardRef(({
  label,
  error = '',
  required = false,
  placeholder = '',
  rows = 4,
  resize = 'vertical', // none, horizontal, vertical, both
  disabled = false,
  maxLength = null,
  showCharCount = false,
  className = '',
  value = '',
  onChange,
  ...props
}, ref) => {
  const resizeMap = {
    none: 'resize-none',
    horizontal: 'resize-x',
    vertical: 'resize-y',
    both: 'resize',
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <textarea
          ref={ref}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          className={`
            w-full
            px-4 py-2
            rounded-lg
            border border-gray-300 dark:border-slate-700
            bg-white dark:bg-slate-800
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            dark:focus:ring-indigo-400 dark:focus:border-indigo-400
            disabled:opacity-50 disabled:cursor-not-allowed
            ${resizeMap[resize] || resizeMap.vertical}
            ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      <div className="flex items-start justify-between gap-2">
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {showCharCount && maxLength && (
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
