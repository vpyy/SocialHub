import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";

const API_BASE = "http://localhost:8080/api";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    setLoading(true);
    setError("");

    try {
      // Get current user ID from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id || "temp-user-id";

      const headers = {
        "Content-Type": "application/json",
        "X-User-Id": userId,
      };

      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/posts/${id}`, { headers });
      const data = await res.json();

      if (data.success) {
        // Transform API response to match PostCard expected format
        const postData = data.data;
        const transformedPost = {
          ...postData,
          author: {
            id: postData.authorId,
            username: postData.authorUsername,
            displayName: postData.authorDisplayName,
            avatarUrl: postData.authorAvatarUrl,
            isVerified: postData.authorIsVerified || false,
          },
          // Map media array to imageUrl for backwards compatibility
          imageUrl: postData.media && postData.media.length > 0 ? postData.media[0].url : null,
          media: postData.media || [], // Keep original media array for editing
          visibility: postData.visibility || 'PUBLIC', // Keep original visibility
          likes: postData.likeCount || 0,
          comments: postData.commentCount || 0,
          shares: postData.shareCount || 0,
          isLiked: postData.likedByCurrentUser || false,
          isReposted: postData.repostedByCurrentUser || false,
        };
        setPost(transformedPost);
      } else {
        setError(data.message || "Không thể tải bài viết");
      }
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = () => {
    fetchPost();
  };

  const handlePostDelete = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-gray-200 dark:border-slate-800 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-3 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50 mb-2">Không tìm thấy</h2>
          <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-slate-700 min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 z-20">
        <div className="px-4 md:px-6 py-2.5 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors -ml-2"
            aria-label="Quay lại"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Bài viết</h1>
        </div>
      </div>

      {/* Content with better padding */}
      <div className="px-2 md:px-4">
        <PostCard
          post={post}
          onUpdate={handlePostUpdate}
          onDelete={handlePostDelete}
          showCommentsDefault={true}
          noBorder={true}
        />
      </div>
    </div>
  );
}
