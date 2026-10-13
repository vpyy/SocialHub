import { useState, useEffect } from 'react'
import PostCard from '../components/PostCard'
import CreatePostBar from '../components/CreatePostBar'

const mockPosts = [
  {
    id: '1',
    author: {
      id: '1',
      displayName: 'Nguyễn Quang Minh',
      username: 'minh_dev',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDR3C5cqZekBTaHa_zYHES74Ce17DZx3YewwRSTt-DWsMgLJ-SubEKAi1_MTiZr31dbGosvz4mvbuXuoBAQ7MXmpzZ2AjtfgQolnDATIKfJL5T8toWvE5fQBD0lYW9IADCnpTZpwvIvG7y6ce7wSKQTOglQ_lWpDUOlBFORG3BTNfY4SZhoeyc5q023dLAWbTNTtmtWjyyBiXgnuMZxw2QB3nrCWHBdJulJ2ZvrIVzjLAbZIqjvl2oj',
      isVerified: true
    },
    content: '🚀 Vừa hoàn thành đợt benchmark thực tế cho kiến trúc hệ thống khóa luận tốt nghiệp! Kết hợp #NoSQLDatabase cùng Redis Caching giúp giảm 65% độ trễ truy vấn cho mạng xã hội phân tán.\n\n#WebDev2025 #GraduationProject #TechViet #FullStack',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE38iKoYQgbs5KUR2Hg3jBzBamYDgI2b94KCj1rpkdlNYIMXaKT1QJCktzrrP6LOvI0ZyIX6rh_xLQLHSjonVdsT1ycFIL6yso-B2cM6350vs-soraaICM9n3cbmcxzFBkzAZdqlpqA8moaNEfKO9xcLnI8qwYzOZjgMSPlyRgmUWX7XbTqlmR_EgFON9-YYBMYMbjoenS1Cvf5-wEDgWygBsEnWiqaqAuBhYDsnQ4BOhdzretsrNz',
    imageCaption: 'Benchmark Report v2.4 - Latency Reduction Graph',
    likes: 128,
    comments: 24,
    shares: 14,
    isLiked: false,
    isBookmarked: false,
    createdAt: '15 phút trước',
    privacy: 'public'
  },
  {
    id: '2',
    author: {
      id: '2',
      displayName: 'Lê Lan Chi',
      username: 'lanchi.ui',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeeQnXrd--UUD0hxu5u_KVC9x7H0_QdDHrM7GthDTLff9p8YI9cLsSDYpgY86-sMNOjdG5julMCw3Wn79i42FyB_oawz2Dy5OhYRgA1NZe50p8Rq1Mc0BH9vzEbTLfDvj5OO8caH_45Lp5wyp237eHBhdiGnkLUlCMEra6XZll6gILB7tJfjeTogqkbad9BYgT9izqE6OvEea_APOXIsUgTiv9ZtQC0nynEmNqQkWaw78lK_gv7LwE',
      isVerified: true
    },
    content: 'Đang thiết kế dashboard mới cho project. UI/UX design thinking với focus vào accessibility và user experience! 🎨✨',
    imageUrl: null,
    likes: 89,
    comments: 12,
    shares: 5,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2 giờ trước',
    privacy: 'public'
  }
]

export default function Feed() {
  const [feedTab, setFeedTab] = useState('for-you')
  const [posts, setPosts] = useState(mockPosts)
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

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ))
  }

  const handleBookmark = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isBookmarked: !post.isBookmarked }
        : post
    ))
  }

  return (
    <section className="flex-1 w-full max-w-4xl mx-auto border-r border-outline-variant/30 min-h-screen pb-20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <h1 className="text-headline-md font-headline-md text-on-surface font-bold hidden sm:block">
          {user?.displayName ? `Welcome, ${user.displayName}` : 'Home Feed'}
        </h1>
        <h1 className="text-headline-md font-headline-md text-on-surface font-bold sm:hidden">
          Home
        </h1>
        
        <div className="flex items-center gap-4 md:gap-6 ml-auto">
          <button
            onClick={() => setFeedTab('for-you')}
            className={`pb-2 text-label-md font-label-md transition-all whitespace-nowrap ${
              feedTab === 'for-you'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="hidden sm:inline">For You</span>
            <span className="sm:hidden">For You</span>
          </button>
          <button
            onClick={() => setFeedTab('following')}
            className={`pb-2 text-label-md font-label-md transition-all whitespace-nowrap ${
              feedTab === 'following'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Following
          </button>
        </div>

        <button className="p-2 text-primary hover:bg-surface-container rounded-full transition-colors ml-2 flex-shrink-0">
          <span className="material-symbols-outlined">add_circle</span>
        </button>
      </header>

      {/* Create Post Bar */}
      <CreatePostBar />

      {/* Posts Feed - Scrollable */}
      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/30">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onBookmark={handleBookmark}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <span className="material-symbols-outlined text-6xl text-outline-variant/40 mb-4">inbox</span>
            <p className="text-on-surface-variant text-center">Không có bài viết nào</p>
          </div>
        )}
      </div>

      {/* Right Sidebar - Hide on mobile */}
      <div className="hidden lg:block w-80 border-l border-outline-variant/30 bg-surface p-4 flex-shrink-0">
        <div className="rounded-2xl bg-surface-container p-4">
          <h3 className="text-headline-md font-headline-md text-on-surface font-bold mb-4">
            Có thể bạn quan tâm
          </h3>
          <div className="space-y-3">
            {['#WebDevelopment', '#ReactJS', '#MongoDB', '#FullStack'].map(tag => (
              <div key={tag} className="p-3 rounded-xl hover:bg-surface-container-high cursor-pointer transition-colors">
                <p className="text-label-md font-label-md text-primary font-bold">{tag}</p>
                <p className="text-body-sm font-body-sm text-on-surface-variant">127.5K posts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
