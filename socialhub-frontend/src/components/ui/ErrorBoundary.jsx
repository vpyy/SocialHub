import { Component } from 'react'

/**
 * Error Boundary component
 * Catches rendering errors and displays fallback UI
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // Could send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
                <summary className="cursor-pointer font-semibold text-red-800 dark:text-red-300 mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto max-h-40">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
