import { forwardRef, useState } from 'react'
import Button from './Button'

/**
 * Smoothed Button with Micro-interactions
 * Enhanced Button with press feedback, hover effects, and animations
 */
const SmoothedButton = forwardRef(({
  onMouseDown,
  onMouseUp,
  children,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false)

  const handleMouseDown = (e) => {
    setIsPressed(true)
    onMouseDown?.(e)
  }

  const handleMouseUp = (e) => {
    setIsPressed(false)
    onMouseUp?.(e)
  }

  return (
    <Button
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        transition-smooth
        ${isPressed ? 'scale-95' : 'hover:scale-105'}
      `}
      {...props}
    >
      {children}
    </Button>
  )
})

SmoothedButton.displayName = 'SmoothedButton'

export default SmoothedButton
