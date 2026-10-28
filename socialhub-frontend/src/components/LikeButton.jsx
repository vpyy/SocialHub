import { useState } from 'react'

/**
 * Animated Like Button
 * Shows heart animation on like/unlike with particle effect
 */
export default function LikeButton({ 
  isLiked = false, 
  count = 0, 
  onClick = () => {},
  disabled = false,
  loading = false,
  variant = 'compact' // compact, detailed
}) {
  const [animating, setAnimating] = useState(false)

  const handleClick = async (e) => {
    if (disabled || loading || animating) return

    setAnimating(true)
    await onClick(e)
    setTimeout(() => setAnimating(false), 600)
  }

  if (variant === 'detailed') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled || loading || animating}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          transition-smooth
          ${isLiked
            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isLiked ? 'Unlike' : 'Like'}
        aria-label={`Like (${count} likes)`}
      >
        <span className={`
          material-symbols-outlined text-xl
          ${animating ? 'animate-like-heart' : ''}
          ${isLiked ? 'fill-icon' : ''}
        `}>
          favorite
        </span>
        <span className="text-sm font-medium">{count > 0 ? count : ''}</span>
      </button>
    )
  }

  // Compact variant
  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading || animating}
      className={`
        p-2 rounded-lg transition-smooth
        ${isLiked
          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-110 active:scale-95
      `}
      title={isLiked ? 'Unlike' : 'Like'}
      aria-label={`Like (${count} likes)`}
    >
      <span className={`
        material-symbols-outlined text-xl
        ${animating ? 'animate-like-heart' : ''}
        ${isLiked ? 'fill-icon' : ''}
      `}>
        favorite
      </span>
    </button>
  )
}
