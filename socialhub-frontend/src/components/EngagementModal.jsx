import { useState, useEffect } from 'react'
import likeService from '../services/likeService'

export default function EngagementModal({ postId, type, count, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsers()
  }, [type])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      
      let response
      if (type === 'likes') {
        response = await likeService.getPostLikes(postId, 0, 100)
      }
      // Extend for comments/shares in future
      
      const data = response?.data?.content || response?.content || []
      setUsers(data)
    } catch (err) {
      console.error('Error loading engagement:', err)
      setError('Không thể tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    const titleMap = {
      likes: '❤️ Người thích',
      comments: '💬 Bình luận',
      shares: '↗️ Chia sẻ'
    }
    return titleMap[type] || 'Engagement'
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl max-h-96 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 dark:text-red-400">{error}</div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.userId || user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://via.placeholder.com/32'}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-slate-400">Chưa có {getTitle().toLowerCase()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
