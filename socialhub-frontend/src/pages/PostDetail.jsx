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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-gray-900 font-semibold text-lg">Đang tải bài viết</p>
            <p className="text-gray-500 text-sm mt-1">Vui lòng đợi trong giây lát...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center ring-4 ring-red-50">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Không tìm thấy bài viết
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header with shadow */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
              aria-label="Quay lại"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Bài viết
            </h1>
          </div>
        </div>
      </div>

      {/* Post Content with proper spacing */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200/50">
          <PostCard
            post={post}
            onUpdate={handlePostUpdate}
            onDelete={handlePostDelete}
            showCommentsDefault={true}
            noBorder={true}
          />
        </div>
        
        {/* Spacing at bottom */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
