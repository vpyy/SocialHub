/**
 * Reusable Badge component
 * For notification counts, status indicators, tags
 */
export default function Badge({ 
  count = 0, 
  variant = 'primary', // primary, secondary, error, success
  size = 'md', // sm, md, lg
  pulse = false,
  className = ''
}) {
  if (count === 0 && !pulse) return null

  // Variant styles
  const variantMap = {
    primary: 'bg-indigo-600 text-white dark:bg-indigo-500',
    secondary: 'bg-purple-600 text-white dark:bg-purple-500',
    error: 'bg-red-600 text-white dark:bg-red-500',
    success: 'bg-green-600 text-white dark:bg-green-500',
    warning: 'bg-amber-600 text-white dark:bg-amber-500',
    neutral: 'bg-gray-600 text-white dark:bg-gray-700',
  }

  // Size mapping
  const sizeMap = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-7 h-7 text-sm',
  }

  const variantClass = variantMap[variant] || variantMap.primary
  const sizeClass = sizeMap[size] || sizeMap.md
  const pulseClass = pulse ? 'animate-pulse' : ''
  const displayText = count > 99 ? '99+' : count

  return (
    <span
      className={`
        ${sizeClass}
        ${variantClass}
        ${pulseClass}
        inline-flex items-center justify-center
        rounded-full font-bold
        ${className}
      `}
      aria-label={`${count} notifications`}
    >
      {displayText}
    </span>
  )
}
