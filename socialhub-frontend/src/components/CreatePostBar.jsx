import { useState, useEffect } from 'react'
import postService from '../services/postService'

export default function CreatePostBar({ onPostCreated }) {
  const [content, setContent] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mediaUrls, setMediaUrls] = useState([])
  const [mediaInput, setMediaInput] = useState('')
  const [mediaType, setMediaType] = useState('IMAGE')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Failed to parse user:', error)
      }
    }
  }, [])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setContent('')
    setMediaUrls([])
    setMediaInput('')
  }

  const handleAddMedia = () => {
    if (mediaInput.trim()) {
      setMediaUrls([...mediaUrls, { type: mediaType, url: mediaInput.trim() }])
      setMediaInput('')
    }
  }

  const handleRemoveMedia = (index) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết')
      return
    }

    setIsSubmitting(true)
    try {
      const postData = {
        content: content.trim(),
        media: mediaUrls,
        hashtags: [], // Extract from content automatically on backend
        visibility: visibility
      }

      const response = await postService.createPost(postData)
      console.log('Post created:', response)
      
      // Call parent callback to refresh feed
      if (onPostCreated) {
        onPostCreated(response.data)
      }

      // Reset form
      handleCloseModal()
      alert('Đăng bài thành công!')
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Không thể đăng bài. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
        <div className="flex items-start gap-3">
          <img
            src={user?.avatarUrl || "https://via.placeholder.com/40"}
            alt="Current user"
            className="w-10 h-10 rounded-full object-cover border border-outline-variant/40"
          />
          <div className="flex-1">
            <button 
              onClick={handleOpenModal}
              className="w-full text-left py-2.5 px-4 rounded-xl bg-surface-container-low text-on-surface-variant text-body-md font-body-md hover:bg-surface-container transition-colors"
            >
              {user?.displayName ? `Bạn đang nghĩ gì, ${user.displayName}?` : 'Chia sẻ suy nghĩ của bạn...'}
            </button>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-outline-variant/20">
              <div className="flex items-center gap-1 text-outline">
                <button onClick={handleOpenModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-label-sm font-label-sm text-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">image</span>
                  <span className="hidden sm:inline">Hình ảnh</span>
                </button>
                <button onClick={handleOpenModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-label-sm font-label-sm text-secondary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">videocam</span>
                  <span className="hidden sm:inline">Video</span>
                </button>
                <button onClick={handleOpenModal} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-label-sm font-label-sm text-tertiary transition-colors">
                  <span className="material-symbols-outlined text-[18px]">tag</span>
                  <span className="hidden sm:inline">Hashtag</span>
                </button>
              </div>
              <button 
                onClick={handleOpenModal}
                className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-label-sm font-semibold hover:bg-primary-container transition-colors"
              >
                Đăng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-surface border-b border-outline-variant/30 px-6 py-4 flex items-center justify-between">
              <h2 className="text-headline-md font-headline-md text-on-surface font-bold">
                Tạo bài viết mới
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Visibility Selector */}
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant mb-2 block">
                  Quyền riêng tư
                </label>
                <select 
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:outline-none focus:border-primary"
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="FOLLOWERS">Người theo dõi</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </div>

              {/* Content Textarea */}
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì? Sử dụng #hashtag để tăng tương tác..."
                  className="w-full h-40 px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:outline-none focus:border-primary resize-none text-body-md font-body-md"
                  maxLength={5000}
                />
                <div className="text-right text-body-sm font-body-sm text-on-surface-variant mt-1">
                  {content.length}/5000
                </div>
              </div>

              {/* Media URLs */}
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant mb-2 block">
                  Thêm media (URL)
                </label>
                <div className="flex gap-2 mb-2">
                  <select 
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:outline-none focus:border-primary"
                  >
                    <option value="IMAGE">Hình ảnh</option>
                    <option value="VIDEO">Video</option>
                  </select>
                  <input
                    type="url"
                    value={mediaInput}
                    onChange={(e) => setMediaInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 focus:outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleAddMedia}
                    className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors"
                  >
                    Thêm
                  </button>
                </div>

                {/* Media Preview */}
                {mediaUrls.length > 0 && (
                  <div className="space-y-2">
                    {mediaUrls.map((media, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg">
                        <span className="material-symbols-outlined text-primary">
                          {media.type === 'IMAGE' ? 'image' : 'videocam'}
                        </span>
                        <span className="flex-1 text-body-sm font-body-sm truncate">{media.url}</span>
                        <button 
                          onClick={() => handleRemoveMedia(index)}
                          className="p-1 hover:bg-error-container rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-error text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-surface border-t border-outline-variant/30 px-6 py-4 flex items-center justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-2 rounded-full border border-outline-variant/30 text-on-surface hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                className="px-6 py-2 rounded-full bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
