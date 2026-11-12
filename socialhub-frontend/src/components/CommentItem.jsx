import { useState } from 'react'

export default function CommentItem({ comment, onDelete, onReply, currentUserId, level = 0 }) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReplies, setShowReplies] = useState(true)

  const isAuthor = currentUserId === comment.authorId
  const hasReplies = comment.replies && comment.replies.length > 0

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      await onReply(comment.id, replyContent)
      setReplyContent('')
      setShowReplyInput(false)
    } catch (error) {
      console.error('Error submitting reply:', error)
      alert('Không thể gửi phản hồi. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Vừa xong'
    
    const now = new Date()
    const commentTime = new Date(timestamp)
    const diffMs = now - commentTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    return commentTime.toLocaleDateString('vi-VN')
  }

  const indentClass = level > 0 ? 'ml-10' : ''
  const isReply = level > 0

  return (
    <div className={`${indentClass} mb-3`}>
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <img
          src={comment.authorAvatarUrl || 'https://via.placeholder.com/32'}
          alt={comment.authorDisplayName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm"
        />

        <div className="flex-1">
          {/* Comment bubble */}
          <div className="bg-gray-100 hover:bg-gray-200 transition-colors p-3 rounded-2xl rounded-tl-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-gray-900">
                {comment.authorDisplayName || comment.authorUsername || 'Unknown User'}
              </span>
              <span className="text-gray-500 text-xs">
                {formatTimestamp(comment.createdAt)}
              </span>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4 mt-1 ml-3">
            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Trả lời
              </button>
            )}
            
            {isAuthor && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                Xóa
              </button>
            )}

            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-gray-600 hover:text-gray-800 font-semibold transition-colors"
              >
                {showReplies ? '▼ Ẩn' : '▶ Hiện'} {comment.replies.length} phản hồi
              </button>
            )}
          </div>

          {/* Reply input box */}
          {showReplyInput && (
            <div className="mt-3 flex items-start gap-2">
              <img
                src="https://via.placeholder.com/32"
                alt="Current user"
                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitReply()}
                  placeholder="Viết phản hồi..."
                  disabled={isSubmitting}
                  className="w-full py-2 pl-4 pr-12 bg-white rounded-full text-sm border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50 transition-all"
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || !replyContent.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Gửi"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {showReplies && hasReplies && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onDelete={onDelete}
                  onReply={onReply}
                  currentUserId={currentUserId}
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
