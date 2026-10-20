import { useState } from 'react'
import commentService from '../services/commentService'

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
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />

        <div className="flex-1">
          {/* Comment content */}
          <div className="bg-surface-container p-3 rounded-2xl rounded-tl-none">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-title-md text-on-surface font-semibold text-sm">
                {comment.authorDisplayName || comment.authorUsername || 'Unknown User'}
              </span>
              <span className="text-outline text-xs">
                {formatTimestamp(comment.createdAt)}
              </span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 ml-3">
            {!isReply && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Trả lời
              </button>
            )}
            
            {isAuthor && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-error font-semibold hover:underline"
              >
                Xóa
              </button>
            )}

            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-outline hover:text-on-surface font-semibold"
              >
                {showReplies ? 'Ẩn' : 'Hiện'} {comment.replies.length} phản hồi
              </button>
            )}
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-2 flex items-start gap-2">
              <img
                src="https://via.placeholder.com/32"
                alt="Current user"
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitReply()}
                  placeholder="Viết phản hồi..."
                  disabled={isSubmitting}
                  className="w-full py-2 pl-3 pr-10 bg-surface-container-low rounded-full text-body-sm font-body-sm border border-outline-variant/30 focus:outline-none focus:border-primary disabled:opacity-50"
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || !replyContent.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary hover:text-secondary disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSubmitting ? 'hourglass_empty' : 'send'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Nested replies */}
          {showReplies && hasReplies && (
            <div className="mt-2">
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
