import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import postService from '../services/postService'
import userService from '../services/userService'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts)
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d} ngày trước`
  return new Date(ts).toLocaleDateString('vi-VN')
}

function Avatar({ src, name, size = 10 }) {
  const initials = (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return src
    ? <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />
    : (
      <div className={`w-${size} h-${size} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0`}>
        {initials}
      </div>
    )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function UserCard({ user, navigate }) {
  return (
    <div
      onClick={() => navigate(`/profile/${user.username}`)}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      <Avatar src={user.avatarUrl} name={user.displayName} size={11} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
          {user.displayName}
        </p>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
        {user.bio && <p className="text-xs text-gray-400 truncate mt-0.5">{user.bio}</p>}
      </div>
      <span className="material-symbols-outlined text-gray-300 group-hover:text-indigo-400 transition-colors text-[20px]">
        chevron_right
      </span>
    </div>
  )
}

function PostCard({ post, navigate }) {
  const hasImage = post.media?.some(m => m.type === 'IMAGE')
  const imageUrl = post.media?.find(m => m.type === 'IMAGE')?.url
  const hasVideo = post.media?.some(m => m.type === 'VIDEO')

  return (
    <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => navigate(`/profile/${post.authorUsername || ''}`)}
    >
      <div className="flex gap-3">
        <Avatar src={post.authorAvatarUrl} name={post.authorDisplayName} size={10} />
        <div className="flex-1 min-w-0">
          {/* Author + time */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">
              {post.authorDisplayName || post.authorUsername || 'Unknown'}
            </span>
            <span className="text-gray-400 text-xs">@{post.authorUsername}</span>
            <span className="text-gray-300 text-xs">·</span>
            <span className="text-gray-400 text-xs">{formatTime(post.createdAt)}</span>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-700 leading-relaxed mb-2 line-clamp-3">{post.content}</p>

          {/* Image preview */}
          {hasImage && (
            <img
              src={imageUrl}
              alt="post media"
              className="rounded-lg max-h-48 object-cover w-full mb-2 border border-gray-100"
            />
          )}

          {/* Video badge */}
          {hasVideo && !hasImage && (
            <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded-lg px-3 py-1.5 w-fit mb-2">
              <span className="material-symbols-outlined text-[16px]">play_circle</span>
              Video
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {post.hashtags.map(tag => (
                <span key={tag} className="text-indigo-600 text-xs font-medium hover:underline">#{tag}</span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">favorite</span>
              {post.likeCount ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">chat_bubble</span>
              {post.commentCount ?? 0}
            </span>
            {post.media?.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">perm_media</span>
                {post.media.length} media
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ query, tab }) {
  const msgs = {
    posts:   { icon: 'article',     title: 'Không tìm thấy bài viết',  sub: `Chưa có bài viết nào chứa "${query}"` },
    users:   { icon: 'person_search', title: 'Không tìm thấy người dùng', sub: `Không có tài khoản nào khớp với "${query}"` },
    videos:  { icon: 'videocam_off', title: 'Không tìm thấy video',    sub: `Chưa có bài viết video nào chứa "${query}"` },
  }
  const { icon, title, sub } = msgs[tab] || msgs.posts
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <span className="material-symbols-outlined text-5xl text-gray-200 mb-3">{icon}</span>
      <p className="font-semibold text-gray-500 mb-1">{title}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="p-4 border-b border-gray-100 animate-pulse flex gap-3">
      <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

const TABS = [
  { key: 'posts',  label: 'Bài viết', icon: 'article' },
  { key: 'users',  label: 'Người dùng', icon: 'group' },
  { key: 'videos', label: 'Video',    icon: 'play_circle' },
]

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialQ   = searchParams.get('q') || ''
  const initialTab = searchParams.get('tab') || 'posts'

  const [inputValue, setInputValue] = useState(initialQ)
  const [query, setQuery]           = useState(initialQ)
  const [activeTab, setActiveTab]   = useState(initialTab)

  const [posts, setPosts]   = useState([])
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  // pagination for posts/videos
  const [page, setPage]     = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // ── focus input on mount ──
  useEffect(() => { inputRef.current?.focus() }, [])

  // ── run search whenever query or tab changes ──
  useEffect(() => {
    if (!query.trim()) {
      setPosts([]); setUsers([]); setHasMore(false)
      return
    }
    setPage(0)
    runSearch(query, activeTab, 0, true)
    setSearchParams({ q: query, tab: activeTab }, { replace: true })
  }, [query, activeTab])

  const runSearch = async (q, tab, pageNum, fresh = false) => {
    if (fresh) setLoading(true); else setLoadingMore(true)
    setError(null)
    try {
      if (tab === 'users') {
        const data = await userService.searchUsers(q)
        // ApiResponse: data is List<UserDto>
        setUsers(Array.isArray(data) ? data : [])
      } else {
        // posts or videos
        const data = await postService.searchPosts(q, pageNum, 20)
        // data is Page<PostDto>
        let results = data?.content || []

        if (tab === 'videos') {
          results = results.filter(p => p.media?.some(m => m.type === 'VIDEO'))
        }

        if (fresh) {
          setPosts(results)
        } else {
          setPosts(prev => [...prev, ...results])
        }
        setHasMore(data ? !data.last : false)
        setPage(pageNum)
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Không thể tìm kiếm. Vui lòng thử lại.')
    } finally {
      setLoading(false); setLoadingMore(false)
    }
  }

  // ── debounce input → query ──
  const handleInputChange = (e) => {
    const val = e.target.value
    setInputValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(val), 400)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    setQuery(inputValue)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPosts([]); setUsers([])
  }

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) runSearch(query, activeTab, page + 1, false)
  }

  // ── render ──
  return (
    <section className="flex-1 max-w-[650px] border-r border-gray-100 min-h-screen flex flex-col">

      {/* ── Search bar (sticky) ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <form onSubmit={handleSubmit} className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px]">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Tìm kiếm bài viết, người dùng, video…"
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 border border-transparent rounded-full text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => { setInputValue(''); setQuery(''); inputRef.current?.focus() }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </form>

        {/* ── Tabs ── */}
        {query.trim() && (
          <div className="flex gap-1 mt-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="flex-1">

        {/* Empty / welcome */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <span className="material-symbols-outlined text-6xl text-indigo-100 mb-4">manage_search</span>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Tìm kiếm SocialHub</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Nhập từ khóa để tìm bài viết, người dùng hoặc video bạn quan tâm
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {['#socialhub', 'học tập', 'du lịch', 'công nghệ', 'ẩm thực'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInputValue(s); setQuery(s) }}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div>
            {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center py-12 text-center px-6">
            <span className="material-symbols-outlined text-4xl text-red-200 mb-2">error</span>
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={() => runSearch(query, activeTab, 0, true)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Users tab */}
        {!loading && !error && query.trim() && activeTab === 'users' && (
          <div className="divide-y divide-gray-50">
            {users.length === 0
              ? <EmptyState query={query} tab="users" />
              : (
                <div className="p-2">
                  <p className="text-xs text-gray-400 px-2 pb-2 pt-1 font-medium">
                    {users.length} người dùng
                  </p>
                  {users.map(u => (
                    <UserCard key={u.id} user={u} navigate={navigate} />
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* Posts / Videos tab */}
        {!loading && !error && query.trim() && (activeTab === 'posts' || activeTab === 'videos') && (
          <div>
            {posts.length === 0
              ? <EmptyState query={query} tab={activeTab} />
              : (
                <>
                  <p className="text-xs text-gray-400 px-4 py-2 font-medium border-b border-gray-50">
                    {posts.length} kết quả{hasMore ? '+' : ''}
                  </p>
                  {posts.map(p => (
                    <PostCard key={p.id} post={p} navigate={navigate} />
                  ))}
                  {/* Load more */}
                  {hasMore && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-6 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                      >
                        {loadingMore ? 'Đang tải…' : 'Xem thêm'}
                      </button>
                    </div>
                  )}
                </>
              )
            }
          </div>
        )}
      </div>
    </section>
  )
}
