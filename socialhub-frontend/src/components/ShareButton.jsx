import { useState } from 'react'
import chatService from '../services/chatService'

export default function ShareButton({ postId, post, onShareClick }) {
  const [showModal, setShowModal] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [conversations, setConversations] = useState([])
  const [selectedConvs, setSelectedConvs] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [sending, setSending] = useState(false)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  const handleOpenModal = async () => {
    if (!showModal) {
      // Load conversations
      setLoadingConvs(true)
      try {
        const res = await chatService.getConversations(0, 100)
        const data = res?.data ?? res
        setConversations(data?.content ?? [])
      } catch (e) {
        console.error('Error loading conversations:', e)
        alert('Không thể tải danh sách bạn bè')
      } finally {
        setLoadingConvs(false)
      }
    }
    setShowModal(!showModal)
  }

  // Filter conversations by search
  const filteredConversations = searchQ.trim()
    ? conversations.filter(c => {
        const other = c.participants?.find(p => p.userId !== currentUser.id)
        const displayName = c.isGroup ? c.groupName : (other?.displayName || other?.username || '')
        const username = other?.username || ''
        const q = searchQ.toLowerCase()
        return displayName.toLowerCase().includes(q) || username.toLowerCase().includes(q)
      })
    : conversations

  // Toggle select conversation
  const handleToggleConv = (convId) => {
    setSelectedConvs(prev =>
      prev.includes(convId)
        ? prev.filter(id => id !== convId)
        : [...prev, convId]
    )
  }

  // Send to all selected conversations
  const handleSendAll = async () => {
    if (selectedConvs.length === 0) {
      alert('Chọn ít nhất 1 người để chia sẻ')
      return
    }

    setSending(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const convId of selectedConvs) {
        try {
          await chatService.sendMessage(convId, { messageType: 'POST', sharedPostId: postId })
          successCount++
        } catch (e) {
          console.error('Error sending to conversation:', convId, e)
          failCount++
        }
      }

      if (successCount > 0) {
        alert(`Đã chia sẻ tới ${successCount} người${failCount > 0 ? `, ${failCount} người thất bại` : ''}`)
      } else {
        alert('Không thể chia sẻ bài viết')
      }
      setShowModal(false)
      setSelectedConvs([])
      setSearchQ('')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
        title="Chia sẻ bài viết"
      >
        <svg
          className="w-5 h-5 text-gray-600 dark:text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          {/* Curved share arrow like the reference image */}
          <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
          <polyline points="18 5 22 9 18 13"/>
        </svg>
      </button>

      {/* Share Modal - Large centered modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chia sẻ bài viết</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSearchQ('')
                  setSelectedConvs([])
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Tìm bạn bè hoặc nhóm..."
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            {/* Main Content Area - Split into 2 columns */}
            <div className="flex-1 overflow-hidden flex gap-4 p-6">
              {/* Left: Conversations List */}
              <div className="flex-1 flex flex-col min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Danh sách bạn bè ({filteredConversations.length})
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  {loadingConvs ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {conversations.length === 0 ? 'Chưa có cuộc trò chuyện' : 'Không tìm thấy'}
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map(conv => {
                      const other = conv.participants?.find(p => p.userId !== currentUser.id)
                      if (!other && !conv.isGroup) return null
                      const displayName = conv.isGroup ? conv.groupName : (other?.displayName || other?.username)
                      const isSelected = selectedConvs.includes(conv.id)

                      return (
                        <label
                          key={conv.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleConv(conv.id)}
                            className="w-5 h-5 rounded accent-indigo-600"
                          />
                          <div className="flex-1 min-w-0">
                            {conv.isGroup ? (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                                👥
                              </div>
                            ) : (
                              <img
                                src={other?.avatarUrl || 'https://via.placeholder.com/40'}
                                alt={displayName}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            )}
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                            {!conv.isGroup && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{other?.username}</p>
                            )}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right: Selected Recipients */}
              <div className="w-72 flex flex-col border-l border-gray-200 dark:border-gray-700 pl-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Đã chọn ({selectedConvs.length})
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {selectedConvs.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center">Chọn người để chia sẻ</p>
                    </div>
                  ) : (
                    conversations
                      .filter(c => selectedConvs.includes(c.id))
                      .map(conv => {
                        const other = conv.participants?.find(p => p.userId !== currentUser.id)
                        const displayName = conv.isGroup ? conv.groupName : (other?.displayName || other?.username)

                        return (
                          <div
                            key={conv.id}
                            className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700"
                          >
                            {conv.isGroup ? (
                              <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs shrink-0">
                                👥
                              </div>
                            ) : (
                              <img
                                src={other?.avatarUrl || 'https://via.placeholder.com/32'}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            )}
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{displayName}</p>
                            <button
                              onClick={() => handleToggleConv(conv.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 shrink-0"
                              title="Xóa"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSearchQ('')
                  setSelectedConvs([])
                }}
                disabled={sending}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSendAll}
                disabled={sending || selectedConvs.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-6-4m6 4l6-4" />
                    </svg>
                    Gửi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
