/**
 * Reusable Loading Skeleton component
 * Shows placeholder content while data is loading with shimmer effect
 */
export default function LoadingSkeleton({ 
  type = 'post',
  count = 1 
}) {
  const SkeletonItem = ({ key }) => {
    const shimmerClasses = 'animate-shimmer bg-gray-200 dark:bg-slate-700'
    
    switch (type) {
      case 'post':
        return (
          <div key={key} className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-700">
            {/* Author section */}
            <div className="flex gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${shimmerClasses}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 ${shimmerClasses} rounded w-32`} />
                <div className={`h-3 ${shimmerClasses} rounded w-24`} />
              </div>
            </div>
            {/* Content */}
            <div className="space-y-2 mb-4">
              <div className={`h-4 ${shimmerClasses} rounded w-full`} />
              <div className={`h-4 ${shimmerClasses} rounded w-5/6`} />
              <div className={`h-3 ${shimmerClasses} rounded w-2/3`} />
            </div>
            {/* Image placeholder */}
            <div className={`h-48 ${shimmerClasses} rounded-lg mb-4`} />
            {/* Actions */}
            <div className="flex gap-8 pt-4 border-t border-gray-200 dark:border-slate-700">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-4 ${shimmerClasses} rounded w-12`} />
              ))}
            </div>
          </div>
        )

      case 'comment':
        return (
          <div key={key} className="p-4">
            <div className="flex gap-3">
              <div className={`w-8 h-8 rounded-full ${shimmerClasses}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3 ${shimmerClasses} rounded w-24`} />
                <div className={`h-3 ${shimmerClasses} rounded w-full`} />
                <div className={`h-3 ${shimmerClasses} rounded w-4/5`} />
              </div>
            </div>
          </div>
        )

      case 'user':
        return (
          <div key={key} className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${shimmerClasses}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 ${shimmerClasses} rounded w-32`} />
                <div className={`h-3 ${shimmerClasses} rounded w-24`} />
              </div>
              <div className={`h-8 ${shimmerClasses} rounded w-20`} />
            </div>
          </div>
        )

      case 'card':
        return (
          <div key={key} className="p-4 md:p-6 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div className={`h-6 ${shimmerClasses} rounded w-3/4 mb-3`} />
            <div className="space-y-2 mb-4">
              <div className={`h-4 ${shimmerClasses} rounded w-full`} />
              <div className={`h-4 ${shimmerClasses} rounded w-5/6`} />
            </div>
            <div className="flex gap-2">
              {[1, 2].map((i) => (
                <div key={i} className={`h-8 ${shimmerClasses} rounded w-20`} />
              ))}
            </div>
          </div>
        )

      case 'list':
        return (
          <div key={key} className="flex items-center gap-3 p-3">
            <div className={`w-10 h-10 ${shimmerClasses} rounded`} />
            <div className="flex-1 space-y-2">
              <div className={`h-4 ${shimmerClasses} rounded w-40`} />
              <div className={`h-3 ${shimmerClasses} rounded w-32`} />
            </div>
          </div>
        )

      default:
        return (
          <div key={key} className={`h-12 ${shimmerClasses} rounded`} />
        )
    }
  }

  return (
    <div className="space-y-0 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </div>
  )
}
