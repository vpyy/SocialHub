import { useEffect, useRef, useCallback } from 'react'

/**
 * Infinite scroll hook — loads more items when scroll reaches bottom
 * @param {Function} onLoadMore — called when user scrolls near bottom
 * @param {boolean} hasMore — whether more items are available
 * @param {boolean} loading — whether currently loading
 * @param {number} threshold — pixels from bottom to trigger (default 300)
 */
export function useInfiniteScroll(onLoadMore, hasMore, loading, threshold = 300) {
  const observerTarget = useRef(null)

  useEffect(() => {
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    )

    const target = observerTarget.current
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
      observer.disconnect()
    }
  }, [hasMore, loading, onLoadMore, threshold])

  return observerTarget
}
