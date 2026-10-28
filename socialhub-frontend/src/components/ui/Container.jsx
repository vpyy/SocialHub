/**
 * Responsive Container Component
 * Manages consistent padding and max-width across pages
 */
export default function Container({ 
  children, 
  maxWidth = 'max-w-4xl',
  padding = 'p-4 md:p-6',
  className = '' 
}) {
  return (
    <div className={`mx-auto ${maxWidth} ${padding} ${className}`}>
      {children}
    </div>
  )
}
