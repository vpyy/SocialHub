import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080/api";

export default function RepostButton({
  postId,
  shareCount = 0,
  isReposted = false,
  onRepostChange,
}) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [count, setCount] = useState(shareCount);
  const [isRepostedState, setIsRepostedState] = useState(isReposted);
  const [loading, setLoading] = useState(false);

  const handleRepost = async (e) => {
    e.stopPropagation();

    // In dev mode, we use X-User-Id header instead of token
    // if (!token) {
    //   navigate("/login");
    //   return;
    // }

    if (loading) return;

    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-User-Id": "temp-user-id",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/posts/${postId}/repost`, {
        method: "POST",
        headers: headers,
      });
      const data = await res.json();

      console.log("Repost response:", data);

      if (res.ok && data.success) {
        const newReposted = data.data.reposted;
        const newCount = data.data.shareCount;

        setIsRepostedState(newReposted);
        setCount(newCount);

        if (onRepostChange) {
          onRepostChange(newReposted, newCount);
        }
      }
    } catch (err) {
      console.error("Repost error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRepost}
      disabled={loading}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
        isRepostedState ? "text-green-600" : "text-gray-600"
      }`}
      title={isRepostedState ? "Bỏ đăng lại" : "Đăng lại"}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )}
      {count > 0 && <span className="text-sm font-medium">{count}</span>}
    </button>
  );
}
