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
  const [uploadingImage, setUploadingImage] = useState(false)

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

  // Handle file upload from computer
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setUploadingImage(true)
    
    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} không phải là hình ảnh`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn (max 5MB)`)
          continue
        }

        // Option 1: Convert to Base64 (simple but not recommended for large files)
        const base64 = await fileToBase64(file)
        setImageUrls([...imageUrls, base64])
        
        // Option 2: Upload to cloud service (recommended)
        // Uncomment below if you have ImgBB API key
        // const uploadedUrl = await uploadToImgBB(file)
        // setImageUrls([...imageUrls, uploadedUrl])
      }
      
      alert('Upload hình ảnh thành công!')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Không thể upload hình ảnh. Vui lòng thử lại.')
    } finally {
      setUploadingImage(false)
      // Reset input
      event.target.value = ''
    }
  }

  // Convert file to Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Optional: Upload to ImgBB (free image hosting)
  // Get free API key at https://api.imgbb.com/
  const uploadToImgBB = async (file) => {
    const apiKey = 'YOUR_IMGBB_API_KEY' // Replace with your API key
    
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    
    if (data.success) {
      return data.data.url
    } else {
      throw new Error('Upload failed')
    }
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
                disabled={isSubmitting || uploadingImage}
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

              {/* Image URLs Preview */}
              {imageUrls.length > 0 && (
                <div className="mb-3 space-y-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full max-h-64 object-cover rounded-lg border border-gray-200" 
                      />
                      <button
                        onClick={() => handleRemoveImageUrl(index)}
                        disabled={isSubmitting}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Media Section */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="font-semibold text-gray-700 mb-2 text-sm">Thêm vào bài viết</div>
                
                <div className="flex flex-wrap gap-2">
                  {/* Upload from Computer */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg cursor-pointer transition-colors">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Ảnh/Video</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isSubmitting || uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {uploadingImage && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-600">Đang upload...</span>
                    </div>
                  )}
                </div>

                {/* Or use URL */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddImageUrl()}
                    placeholder="Hoặc nhập URL hình ảnh"
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-3 bg-white rounded-lg text-sm border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all"
                  />
                  <button
                    onClick={handleAddImageUrl}
                    disabled={isSubmitting || !imageUrlInput.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Video URL */}
              <div className="mb-3">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Nhập URL video (YouTube, Vimeo...)"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-gray-50 rounded-full text-sm border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting || uploadingImage}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || uploadingImage || (!content.trim() && imageUrls.length === 0 && !videoUrl)}
                className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? 'Đang đăng...' : uploadingImage ? 'Đang upload...' : 'Đăng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
