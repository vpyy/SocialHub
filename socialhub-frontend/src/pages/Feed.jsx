import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PostCard from '../components/PostCard'
import CreatePostBar from '../components/CreatePostBar'
import postService from '../services/postService'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'

export default function Feed() {
  const { t } = useTranslation()
  const [feedTab, setFeedTab] = useState('for-you')
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Infinite scroll target
  const observerTarget = useInfiniteScroll(
    () => setPage((p) => p + 1),
    hasMore,
    loading,
    300 // trigger 300px from bottom
  )

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Failed to parse user:', error)
      }
    } else {
      // Create temporary user for testing
      const tempUser = {
        id: 'temp-user-id',
        displayName: 'Test User',
        username: 'testuser',
        avatarUrl: 'https://via.placeholder.com/40'
      }
      localStorage.setItem('user', JSON.stringify(tempUser))
      setUser(tempUser)
    }
  }, [])

  // Fetch feed data
  useEffect(() => {
    fetchFeed()
  }, [feedTab, page])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let response
      if (feedTab === 'for-you') {
        // For You: Show all PUBLIC and FOLLOWERS posts (excluding PRIVATE from others)
        response = await postService.getFeed(page, 20)
      } else {
        // Following: Show only posts from followed users
        response = await postService.getFollowingFeed(page, 20)
      }
      
      console.log('Feed response:', response)
      
      // Handle ApiResponse wrapper structure
      const feedData = response.data || response
      
      if (feedData && feedData.content) {
        const newPosts = feedData.content.map(post => convertToFrontendFormat(post))
        console.log('Converted posts:', newPosts)
        setPosts(page === 0 ? newPosts : [...posts, ...newPosts])
        setHasMore(!feedData.last)
      } else {
        console.error('Unexpected response structure:', response)
      }
    } catch (err) {
      console.error('Error fetching feed:', err)
      setError('Không thể tải bài viết. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  // Convert backend format to frontend format
  const convertToFrontendFormat = (backendPost) => {
    // Extract image and video URLs from the media array [{type, url}]
    const images = (backendPost.media || [])
      .filter(m => m.type === 'IMAGE')
      .map(m => m.url)
    const videoItem = (backendPost.media || []).find(m => m.type === 'VIDEO')

    return {
      id: backendPost.id,
      author: {
        id: backendPost.authorId,
        displayName: backendPost.authorDisplayName || backendPost.authorUsername || 'Unknown User',
        username: backendPost.authorUsername || 'unknown',
        avatarUrl: backendPost.authorAvatarUrl || 'https://via.placeholder.com/40',
        isVerified: false
      },
      content: backendPost.content,
      imageUrl: images.length > 0 ? images[0] : null,
      imageCaption: images.length > 0 ? 'Image' : null,
      videoUrl: videoItem ? videoItem.url : null,
      media: backendPost.media || [], // Keep original media array for editing
      visibility: backendPost.visibility || 'PUBLIC', // Keep original visibility
      likes: backendPost.likeCount || 0,
      comments: backendPost.commentCount || 0,
      shares: backendPost.shareCount || 0,
      isLiked: backendPost.likedByCurrentUser || false,
      isBookmarked: false,
      createdAt: formatTimestamp(backendPost.createdAt),
      privacy: backendPost.visibility?.toLowerCase() || 'public',
      hashtags: backendPost.hashtags || []
    }
  }

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Vừa xong'
    
    const now = new Date()
    const postTime = new Date(timestamp)
    const diffMs = now - postTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return postTime.toLocaleDateString('vi-VN')
  }

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))
  }

  const handleBookmark = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ))
  }

  const handlePostCreated = (newPost) => {
    // Refresh feed when new post is created
    setPage(0)
    fetchFeed()
  }
  
  const handlePostDeleted = (postId) => {
    // Remove deleted post from UI
    setPosts(posts.filter(post => post.id !== postId))
  }

  const handleTabChange = (tab) => {
    setFeedTab(tab)
    setPage(0)
    setPosts([])
  }

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden bg-white dark:bg-gray-950">
      {/* Header - Fixed at top */}
      <header className="flex-shrink-0 sticky top-0 z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
          {user?.displayName ? `Welcome, ${user.displayName}` : 'Home Feed'}
        </h1>
        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white sm:hidden">
          Home
        </h1>
        
        <div className="flex items-center gap-4 md:gap-6 ml-auto">
          <button
            onClick={() => handleTabChange('for-you')}
            className={`pb-2 text-sm md:text-base font-medium transition-all whitespace-nowrap ${
              feedTab === 'for-you'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('feed.forYou')}
          </button>
          <button
            onClick={() => handleTabChange('following')}
            className={`pb-2 text-sm md:text-base font-medium transition-all whitespace-nowrap ${
              feedTab === 'following'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('feed.following')}
          </button>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors ml-2 flex-shrink-0"
        >
          🔄
        </button>
      </header>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Posts Feed */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Create Post Bar - Fixed */}
          <div className="flex-shrink-0 sticky top-[73px] z-10 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md">
            <CreatePostBar onPostCreated={handlePostCreated} />
          </div>

          {/* Posts Feed - Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
            {loading && posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <span className="text-6xl mb-4">⚠️</span>
                <p className="text-red-600 dark:text-red-400 text-center mb-4">{error}</p>
                <button 
                  onClick={() => fetchFeed()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : posts.length > 0 ? (
              <>
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                    onUpdate={fetchFeed}
                    onDelete={handlePostDeleted}
                  />
                ))}
                {/* Infinite scroll trigger element */}
                {hasMore && (
                  <div ref={observerTarget} className="py-8 text-center">
                    {loading ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">Scroll to load more...</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4">inbox</span>
                <p className="text-on-surface-variant text-center mb-2">Chưa có bài viết nào</p>
                <p className="text-body-sm text-on-surface-variant text-center">
                  Hãy tạo bài viết đầu tiên của bạn!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Hide on mobile, scrollable */}
        <div className="hidden lg:flex lg:w-80 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-col flex-shrink-0">
          <div className="p-4 overflow-y-auto">
            <div className="rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Có thể bạn quan tâm
              </h3>
              <div className="space-y-3">
                {['#WebDevelopment', '#ReactJS', '#MongoDB', '#FullStack'].map(tag => (
                  <div key={tag} className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{tag}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">127.5K posts</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
