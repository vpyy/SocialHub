import { Container } from './ui'

/**
 * Responsive Feed Layout
 * Wraps main content area with proper padding and constraints
 */
export default function ResponsiveFeed({ children }) {
  return (
    <main className="flex-1 w-full overflow-y-auto min-h-screen bg-white dark:bg-slate-950 pb-16 md:pb-0">
      <div className="mx-auto max-w-3xl md:max-w-4xl w-full">
        {children}
      </div>
    </main>
  )
}
