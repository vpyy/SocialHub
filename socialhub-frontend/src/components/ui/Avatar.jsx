/**
 * Reusable Avatar component
 * Consolidates avatar sizing and fallback logic
 */
export default function Avatar({ 
  src, 
  name = 'User', 
  size = 'md',
  className = '',
  clickable = false,
  onClick = null
}) {
  // Size mapping: size => Tailwind class
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-10 h-10',
    xl: 'w-11 h-11',
    '2xl': 'w-12 h-12',
    '3xl': 'w-16 h-16',
    '4xl': 'w-20 h-20',
    '5xl': 'w-28 h-28',
    '6xl': 'w-32 h-32',
  }

  const sizeClass = sizeMap[size] || sizeMap.md
  const initials = (name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const baseClass = `${sizeClass} rounded-full object-cover shrink-0 flex-shrink-0`
  const interactiveClass = clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
  const finalClass = `${baseClass} ${interactiveClass} ${className}`

  const handleClick = (e) => {
    if (clickable && onClick) {
      e.stopPropagation()
      onClick(e)
    }
  }

  // Always show initials as fallback (avoid image error handling)
  if (!src || !src.trim()) {
    return (
      <div
        className={`${finalClass} bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs sm:text-sm`}
        onClick={handleClick}
        title={name}
      >
        {initials}
      </div>
    )
  }

  // Image
  return (
    <img
      src={src}
      alt={name}
      className={finalClass}
      onClick={handleClick}
      title={name}
      loading="lazy"
    />
  )
}
