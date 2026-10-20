import { useState } from 'react'
import postService from '../services/postService'

export default function CreatePostBar({ onPostCreated }) {
  const [showModal, setShowModal] = useState(false)
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState([])
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [visibility, setVisibility] = useState('PUBLIC')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() && imageUrls.length === 0 && !videoUrl) {
      alert('Vui lòng nhập nội dung hoặc thêm media')
      return
    }

    setIsSubmitting(true)
    try {
      const postData = {
        content: content.trim(),
        visibility,
        ...(imageUrls.length > 0 && { imageUrls }),
        ...(videoUrl && { videoUrl })
      }

      await postService.createPost(postData)
      
      // Reset form
      setContent('')
      setImageUrls([])
      setImageUrlInput('')
      setVideoUrl('')
      setVisibility('PUBLIC')
      setShowModal(false)
      
      // Notify parent to refresh feed
      if (onPostCreated) onPostCreated()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Không thể tạo bài viết. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImageUrls([...imageUrls, imageUrlInput.trim()])
      setImageUrlInput('')
    }
  }

  const handleRemoveImageUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  return (
    <>
      {/* Create Post Bar */}
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="https://via.placeholder.com/40"
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-left rounded-full transition-colors cursor-pointer text-sm"
          >
            Bạn đang nghĩ gì?
          </button>
        </div>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Tạo bài viết</h2>
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* User info */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="https://via.placeholder.com/40"
                  alt="User avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Test User</div>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 mt-1 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="PUBLIC">🌍 Công khai</option>
                    <option value="FRIENDS">👥 Bạn bè</option>
                    <option value="PRIVATE">🔒 Chỉ mình tôi</option>
                  </select>
                </div>
              </div>

              {/* Content textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn đang nghĩ gì?"
                disabled={isSubmitting}
                className="w-full min-h-[120px] p-3 bg-transparent text-gray-800 text-base resize-none focus:outline-none placeholder:text-gray-400"
              />

              {/* Image URLs */}
              {imageUrls.length > 0 && (
                <div className="mb-3 space-y-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-2 rounded-lg transition-colors">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-16 h-16 object-cover rounded border border-gray-200" />
                      <div className="flex-1 text-xs text-gray-600 truncate">{url}</div>
                      <button
                        onClick={() => handleRemoveImageUrl(index)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full disabled:opacity-50 transition-all"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add image URL */}
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddImageUrl()}
                  placeholder="Nhập URL hình ảnh"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 bg-gray-50 rounded-full text-sm border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleAddImageUrl}
                  disabled={isSubmitting || !imageUrlInput.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  Thêm
                </button>
              </div>

              {/* Video URL */}
              <div className="mb-3">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Nhập URL video (tùy chọn)"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-gray-50 rounded-full text-sm border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && imageUrls.length === 0 && !videoUrl)}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? 'Đang đăng...' : 'Đăng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
