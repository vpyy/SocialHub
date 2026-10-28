/**
 * Animated Page Wrapper
 * Adds fade-in animation to pages on mount
 */
export default function AnimatedPage({ children, className = '' }) {
  return (
    <div className={`animate-fade-in ${className}`}>
      {children}
    </div>
  )
}
