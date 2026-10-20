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

    if (!token) {
      navigate("/login");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/repost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

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
      className={`flex items-center gap-1.5 text-label-sm font-semibold transition-all ${
        isRepostedState
          ? "text-success"
          : "text-outline hover:text-success hover:bg-success/10"
      } px-3 py-1.5 rounded-full active:scale-95`}
      title={isRepostedState ? "Bỏ đăng lại" : "Đăng lại"}
    >
      {loading ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : (
        <span className="material-symbols-outlined text-[18px]">
          {isRepostedState ? "repeat_on" : "repeat"}
        </span>
      )}
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
