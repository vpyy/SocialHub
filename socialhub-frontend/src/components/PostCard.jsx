import { useState } from 'react'
import likeService from '../services/likeService'
import commentService from '../services/commentService'
import CommentItem from './CommentItem'

export default function PostCard({ post, onLike, onBookmark, onUpdate }) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  
  // Local state for optimistic updates
  const [localLiked, setLocalLiked] = useState(post.isLiked)
  const [localLikeCount, setLocalLikeCount] = useState(post.likes)
  const [localCommentCount, setLocalCommentCount] = useState(post.comments)

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLike = async () => {
    if (isLiking) return
    
    setIsLiking(true)
    
    // Optimistic update
    const wasLiked = localLiked
    setLocalLiked(!wasLiked)
    setLocalLikeCount(wasLiked ? localLikeCount - 1 : localLikeCount + 1)
    
    try {
      const response = await likeService.toggleLike(post.id)
      setLocalLiked(response.data.liked)
      
      if (onLike) {
        onLike(post.id)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setLocalLiked(wasLiked)
      setLocalLikeCount(wasLiked ? localLikeCount + 1 : localLikeCount - 1)
    } finally {
      setIsLiking(false)
    }
  }

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments)
      return
    }

    setIsLoadingComments(true)
    setShowComments(true)
    
    try {
      const response = await commentService.getPostComments(post.id, 0, 20)
      console.log('Comments response:', response)
      
      // Handle both response.data.content and response.content
      const commentsData = response.data?.content || response.content || []
      setComments(commentsData)
    } catch (error) {
      console.error('Error loading comments:', error)
      setComments([]) // Set empty array on error
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    
    try {
      const response = await commentService.createComment(post.id, {
        content: newComment.trim(),
        parentCommentId: null
      })
      
      console.log('Create comment response:', response)
      
      // Handle response structure
      const newCommentData = response.data || response
      setComments([newCommentData, ...comments])
      setNewComment('')
      setLocalCommentCount(localCommentCount + 1)
      
      if (onUpdate) {
        onUpdate(post.id)
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('Không thể gửi bình luận. Vui lòng thử lại.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleReply = async (parentCommentId, content) => {
    try {
      await commentService.createComment(post.id, {
        content: content.trim(),
        parentCommentId: parentCommentId
      })
      
      const updatedComments = await commentService.getPostComments(post.id, 0, 20)
      const commentsData = updatedComments.data?.content || updatedComments.content || []
      setComments(commentsData)
      setLocalCommentCount(localCommentCount + 1)
    } catch (error) {
      console.error('Error creating reply:', error)
      throw error
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return

    try {
      await commentService.deleteComment(commentId)
      
      const updatedComments = await commentService.getPostComments(post.id, 0, 20)
      const commentsData = updatedComments.data?.content || updatedComments.content || []
      setComments(commentsData)
      setLocalCommentCount(Math.max(0, localCommentCount - 1))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Không thể xóa bình luận.')
    }
  }

  return (
    <article className="bg-white border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={post.author.avatarUrl || 'https://via.placeholder.com/44'}
            alt={post.author.displayName}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900 hover:underline cursor-pointer">
                {post.author.displayName}
              </span>
              {post.author.isVerified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{post.createdAt}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="mb-3 text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Media */}
      {post.imageUrl && (
        <div className="mb-3 rounded-xl overflow-hidden border border-gray-200">
          <img
            src={post.imageUrl}
            alt={post.imageCaption || 'Post image'}
            className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
        </div>
      )}

      {/* Engagement Bar */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-all group disabled:opacity-50"
        >
          <svg 
            className={`w-5 h-5 transition-all ${
              localLiked 
                ? 'text-pink-600 fill-current' 
                : 'text-gray-400 group-hover:text-pink-600'
            } ${isLiking ? '' : 'group-hover:scale-110'}`}
            fill={localLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className={`text-sm font-semibold ${localLiked ? 'text-pink-600' : 'text-gray-600'}`}>
            {localLikeCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={loadComments}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-all group"
        >
          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-semibold text-gray-600">
            {localCommentCount}
          </span>
        </button>

        {/* Share Button */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-green-50 transition-all group">
          <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-sm font-semibold text-gray-600">
            {post.shares || 0}
          </span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={() => onBookmark && onBookmark(post.id)}
          className="p-1.5 rounded-full hover:bg-yellow-50 transition-all group"
        >
          <svg 
            className={`w-5 h-5 transition-colors ${
              post.isBookmarked 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-400 group-hover:text-yellow-500'
            }`}
            fill={post.isBookmarked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Comment Input */}
          <div className="flex items-start gap-3 mb-4">
            <img
              src={currentUser.avatarUrl || "https://via.placeholder.com/32"}
              alt="You"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
            />
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitComment()
                    }
                  }}
                  placeholder="Viết bình luận..."
                  disabled={isSubmittingComment}
                  rows="1"
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-2xl text-sm border border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="absolute right-2 bottom-2 p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-1">
                Nhấn Enter để gửi • Shift+Enter để xuống dòng
              </p>
            </div>
          </div>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.filter(c => c && c.id).map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={handleDeleteComment}
                  onReply={handleReply}
                  currentUserId={currentUser.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-400">Chưa có bình luận nào</p>
              <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên bình luận!</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
