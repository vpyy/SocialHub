import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import bookmarkService from '../services/bookmarkService'

function formatTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts)
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Vừa xong'
  if (m < 60) return `${m} phút`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d} ngày` : new Date(ts).toLocaleDateString('vi-VN')
}

function BookmarkCard({ item, onRemove, navigate }) {
  const post = item.post
  if (!post) return null
  const image = post.media?.find(m => m.type === 'IMAGE')?.url

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
      {/* Image */}
      {image ? (
        <div
          onClick={() => navigate(`/profile/${post.authorUsername || ''}`)}
          className="aspect-video overflow-hidden cursor-pointer"
        >
          <img src={image} alt="post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div
          onClick={() => navigate(`/profile/${post.authorUsername || ''}`)}
          className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-4xl text-indigo-200">article</span>
        </div>
      )}

      <div className="p-3">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          {post.authorAvatarUrl
            ? <img src={post.authorAvatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
            : <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                {(post.authorDisplayName || 'U')[0].toUpperCase()}
              </div>
          }
          <span className="text-xs font-medium text-gray-700 truncate">
            {post.authorDisplayName || post.authorUsername || 'Unknown'}
          </span>
          <span className="text-xs text-gray-400 ml-auto shrink-0">{formatTime(item.createdAt)}</span>
        </div>

        {/* Content preview */}
        <p className="text-sm text-gray-700 line-clamp-2 leading-snug mb-2">{post.content}</p>

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.hashtags.slice(0, 3).map(t => (
              <span key={t} className="text-indigo-500 text-xs">#{t}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">favorite</span>
              {post.likeCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
              {post.commentCount ?? 0}
            </span>
          </div>
          <button
            onClick={() => onRemove(item.postId)}
            className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Bỏ lưu"
          >
            <span className="material-symbols-outlined text-[18px] fill-icon">bookmark</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  )
}

export default function Bookmarks() {
  const navigate = useNavigate()
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [page, setPage]         = useState(0)
  const [hasMore, setHasMore]   = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async (pageNum = 0, fresh = true) => {
    if (fresh) setLoading(true); else setLoadingMore(true)
    setError(null)
    try {
      const res = await bookmarkService.getBookmarks(pageNum, 20)
      const pageData = res?.data ?? res
      const content  = pageData?.content ?? []
      setItems(prev => fresh ? content : [...prev, ...content])
      setHasMore(pageData ? !pageData.last : false)
      setPage(pageNum)
    } catch (e) {
      console.error(e)
      setError('Không thể tải danh sách đã lưu')
    } finally {
      setLoading(false); setLoadingMore(false)
    }
  }, [])

  useEffect(() => { load(0) }, [load])

  const handleRemove = async (postId) => {
    try {
      await bookmarkService.toggleBookmark(postId)
      setItems(prev => prev.filter(b => b.postId !== postId))
    } catch (e) { console.error(e) }
  }

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-700 min-h-screen pb-20 flex flex-col bg-white dark:bg-gray-950">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">bookmarks</span>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Đã lưu</h1>
          {items.length > 0 && (
            <span className="text-xs text-gray-400 font-normal">({items.length}{hasMore ? '+' : ''})</span>
          )}
        </div>
        <button onClick={() => load(0)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined text-[20px]">refresh</span>
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading && (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-4xl text-red-200">error</span>
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => load(0)} className="text-xs text-indigo-600 hover:underline">Thử lại</button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-200 mb-3">bookmark_border</span>
            <p className="font-semibold text-gray-500 mb-1">Chưa có bài viết nào được lưu</p>
            <p className="text-xs text-gray-400 max-w-xs">Nhấn vào biểu tượng bookmark trên bài viết để lưu lại đọc sau.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <BookmarkCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                navigate={navigate}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center py-4 mt-2">
            <button
              onClick={() => load(page + 1, false)}
              disabled={loadingMore}
              className="px-6 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? 'Đang tải…' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
