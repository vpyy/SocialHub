import PostCard from './PostCard'

/**
 * Responsive Post Card Wrapper
 * Adds mobile-first responsive padding and spacing
 */
export default function ResponsivePostCard({ ...props }) {
  return (
    <div className="border-b border-gray-200 dark:border-slate-700 mb-0">
      <div className="p-3 sm:p-4 md:p-6">
        <PostCard {...props} />
      </div>
    </div>
  )
}
