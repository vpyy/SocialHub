import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import postService from '../services/postService'
import PostCard from '../components/PostCard'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) {
      setError('Post ID is missing')
      return
    }

    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch post by ID
        const response = await postService.getPostById(id)
        const postData = response?.data || response

        if (!postData) {
          setError('Không tìm thấy bài viết')
          return
        }

        // Convert to frontend format
        const convertedPost = convertToFrontendFormat(postData)
        setPost(convertedPost)
      } catch (err) {
        console.error('Error fetching post:', err)
        setError('Không thể tải bài viết. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [id])

  const convertToFrontendFormat = (backendPost) => {
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
      videoUrl: videoItem ? videoItem.url : null,
      media: backendPost.media || [],
      visibility: backendPost.visibility || 'PUBLIC',
      likes: backendPost.likeCount || 0,
      comments: backendPost.commentCount || 0,
      shares: backendPost.shareCount || 0,
      isLiked: backendPost.likedByCurrentUser || false,
      isBookmarked: backendPost.isBookmarkedByCurrentUser || false,
      createdAt: formatTimestamp(backendPost.createdAt),
      privacy: backendPost.visibility?.toLowerCase() || 'public',
      hashtags: backendPost.hashtags || []
    }
  }

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

  return (
    <section className="flex-1 w-full max-w-3xl mx-auto border-x border-gray-200 dark:border-gray-700 min-h-screen pb-20 bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Quay lại"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết bài viết</h1>
      </div>

      {/* Content */}
      <div className="px-4 md:px-6 py-6">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-4xl text-red-200 dark:text-red-900">error</span>
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            <button 
              onClick={() => navigate('/')} 
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Quay lại trang chủ
            </button>
          </div>
        )}

        {!loading && !error && post && (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
            <PostCard
              post={post}
              showCommentsDefault={true}
              noBorder={true}
              onLike={() => {}}
              onBookmark={() => {}}
              onUpdate={() => {}}
              onDelete={() => navigate('/')}
            />
          </div>
        )}

        {!loading && !error && !post && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="material-symbols-outlined text-4xl text-gray-200 dark:text-gray-700">article</span>
            <p className="text-sm text-gray-400 dark:text-gray-500">Không tìm thấy bài viết</p>
          </div>
        )}
      </div>
    </section>
  )
}
