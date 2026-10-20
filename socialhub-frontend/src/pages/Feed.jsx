import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import CreatePostBar from '../components/CreatePostBar'
import postService from '../services/postService'

export default function Feed() {
  const [feedTab, setFeedTab] = useState('for-you')
  const [posts, setPosts] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

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
        response = await postService.getFeed(page, 20)
      } else {
        response = await postService.getPublicFeed(page, 20)
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
      imageUrl: backendPost.imageUrls && backendPost.imageUrls.length > 0 ? backendPost.imageUrls[0] : null,
      imageCaption: backendPost.imageUrls && backendPost.imageUrls.length > 0 ? 'Image' : null,
      videoUrl: backendPost.videoUrl || null,
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

  const handleTabChange = (tab) => {
    setFeedTab(tab)
    setPage(0)
    setPosts([])
  }

  return (
    <section className="flex-1 w-full max-w-4xl mx-auto border-r border-outline-variant/30 min-h-screen pb-20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-headline-md font-headline-md text-on-surface font-bold hidden sm:block">
          {user?.displayName ? `Welcome, ${user.displayName}` : 'Home Feed'}
        </h1>
        <h1 className="text-headline-md font-headline-md text-on-surface font-bold sm:hidden">
          Home
        </h1>
        
        <div className="flex items-center gap-4 md:gap-6 ml-auto">
          <button
            onClick={() => handleTabChange('for-you')}
            className={`pb-2 text-label-md font-label-md transition-all whitespace-nowrap ${
              feedTab === 'for-you'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="hidden sm:inline">For You</span>
            <span className="sm:hidden">For You</span>
          </button>
          <button
            onClick={() => handleTabChange('following')}
            className={`pb-2 text-label-md font-label-md transition-all whitespace-nowrap ${
              feedTab === 'following'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Following
          </button>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="p-2 text-primary hover:bg-surface-container rounded-full transition-colors ml-2 flex-shrink-0"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </header>

      {/* Create Post Bar */}
      <CreatePostBar onPostCreated={handlePostCreated} />

      {/* Posts Feed - Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30">
        {loading && posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-on-surface-variant">Đang tải...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
            <p className="text-error text-center mb-4">{error}</p>
            <button 
              onClick={() => fetchFeed()}
              className="px-4 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors"
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
              />
            ))}
            {hasMore && (
              <div className="py-8 text-center">
                <button 
                  onClick={() => setPage(page + 1)}
                  disabled={loading}
                  className="px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors disabled:opacity-50"
                >
                  {loading ? 'Đang tải...' : 'Tải thêm'}
                </button>
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

      {/* Right Sidebar - Hide on mobile */}
      <div className="hidden lg:block w-80 border-l border-outline-variant/30 bg-surface p-4 flex-shrink-0">
        <div className="rounded-2xl bg-surface-container p-4">
          <h3 className="text-headline-md font-headline-md text-on-surface font-bold mb-4">
            Có thể bạn quan tâm
          </h3>
          <div className="space-y-3">
            {['#WebDevelopment', '#ReactJS', '#MongoDB', '#FullStack'].map(tag => (
              <div key={tag} className="p-3 rounded-xl hover:bg-surface-container-high cursor-pointer transition-colors">
                <p className="text-label-md font-label-md text-primary font-bold">{tag}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">127.5K posts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
