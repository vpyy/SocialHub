import { useState } from 'react'

export default function PostCard({ post, onLike, onBookmark }) {
  const [showComments, setShowComments] = useState(false)

  return (
    <article className="post-card">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={post.author?.avatarUrl || 'https://via.placeholder.com/44'}
            alt={post.author?.displayName || 'User'}
            className="w-11 h-11 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-title-md font-title-md text-on-surface">
                {post.author?.displayName || 'User'}
              </span>
              {post.author?.isVerified && (
                <span className="material-symbols-outlined fill-icon text-primary text-[18px]">
                  verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-body-sm font-body-sm text-outline">
              <span>@{post.author?.username || 'user'}</span>
              <span>•</span>
              <span>{post.createdAt}</span>
              <span>•</span>
              <span className="material-symbols-outlined text-[14px]">{post.privacy === 'public' ? 'public' : 'lock'}</span>
            </div>
          </div>
        </div>
        <button className="text-outline hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Content */}
      <div className="mt-3 text-body-md font-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Media */}
      {post.imageUrl && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-low shadow-sm">
          <img
            src={post.imageUrl}
            alt={post.imageCaption}
            className="w-full h-80 object-cover"
          />
          {post.imageCaption && (
            <div className="p-3 bg-surface-container-low/70 flex items-center justify-between text-body-sm font-body-sm">
              <span className="font-medium text-on-surface">{post.imageCaption}</span>
              <span className="text-primary font-label-sm hover:underline cursor-pointer">
                Xem chi tiết
              </span>
            </div>
          )}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-outline text-body-sm font-body-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            className="flex items-center gap-1.5 group transition-colors hover:text-tertiary"
          >
            <span
              className={`material-symbols-outlined ${post.isLiked ? 'fill-icon text-tertiary' : ''} group-hover:scale-110 transition-transform`}
            >
              favorite
            </span>
            <span>{post.likes}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            <span>{post.comments}</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-secondary transition-colors">
            <span className="material-symbols-outlined">share</span>
            <span>{post.shares}</span>
          </button>
        </div>
        <button
          onClick={() => onBookmark(post.id)}
          className="p-1 hover:text-primary transition-colors"
        >
          <span className={`material-symbols-outlined ${post.isBookmarked ? 'fill-icon text-primary' : ''}`}>
            bookmark
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-outline-variant/20">
          <div className="space-y-2.5 mb-3">
            <div className="flex items-start gap-2.5">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDn6cYqBB7e3Dezs4ySLwfQMkhkqkdJ8e7uRiwtS5Mg_YiLhN04nE8-pyf-3rUhJYbkZH0V8IyssJ9-g_cKz-r5xHZ0Qj5xV60XWZrrA5KDiuh1zC_vmITyOwJSapnWPQXLkc1j4qSimZo5qrdH6hMbEVIVSAqczs_yB1yb7qjEA_7SxZULiTgKyWA2I7g3k6h9TL08OCFXp9qkUJf5SFCMH6wLXTH7AhSk8LFrw_YRbaZZsvOzSuPt"
                alt="Comment author"
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="bg-surface-container p-2.5 rounded-2xl rounded-tl-none text-body-sm font-body-sm flex-1">
                <span className="font-title-md text-on-surface font-semibold block">Lê Lan Chi</span>
                <span className="text-on-surface-variant">
                  Kiến trúc này nhìn tối ưu thật sự bạn ơi! Có publish tài liệu lên GitHub không?
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuADFZquxQ3nxeMjM3PvMw7vlmoDQJhs80s0VoTFldIbU771zixYRKSKuKbpIXx81El54T2cJpbMmjIjldwmoTpN73PEX1I1EXtc_pneJ7LSQ-5K5xILXrtKRNHxsGV6zV1iYnfLv2D9mADmlyOgcQybiadEg3IUCo2fCnAWBUpmmfLNBVSjQ7fVX2PvhTfqfONiCZg3BhWUmr0ePqJwJaQACyrdK3WkMnK38VfaB_wASSAiYZv6ZNRT"
              alt="Current user"
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Viết bình luận của bạn..."
                className="w-full py-2 pl-3 pr-10 bg-surface-container-low rounded-full text-body-sm font-body-sm border border-outline-variant/30 focus:outline-none focus:border-primary"
              />
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary hover:text-secondary">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
