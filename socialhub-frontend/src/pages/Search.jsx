import { useState, useCallback, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PostCard from "../components/PostCard";

const API_BASE = "http://localhost:8080/api";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const token = localStorage.getItem("token");

  // Active tab state: "users" | "posts" | "hashtags"
  const [activeTab, setActiveTab] = useState("users");

  // Search states
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Fetch search results when query or tab changes
   */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError("");

      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        let url = "";
        if (activeTab === "users") {
          url = `${API_BASE}/search/users?q=${encodeURIComponent(query)}`;
        } else if (activeTab === "posts") {
          url = `${API_BASE}/search/posts?q=${encodeURIComponent(query)}`;
        } else if (activeTab === "hashtags") {
          url = `${API_BASE}/search/hashtags?tag=${encodeURIComponent(query)}`;
        }

        const res = await fetch(url, { headers });
        const data = await res.json();

        if (res.ok && data.success) {
          setResults(data.data || []);
        } else {
          setError(data.message || "Tìm kiếm thất bại");
          setResults([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Lỗi kết nối: " + err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, activeTab, token]);

  /**
   * Handle search input change
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchParams({ q: value }, { replace: true });
  };

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-700 min-h-screen pb-20 bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/85 dark:bg-gray-900/85 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm người dùng, bài viết, hashtag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-[78px] bg-white/95 dark:bg-gray-950/95 backdrop-blur-md z-10 px-4 md:px-6">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3.5 text-center text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
            activeTab === "users"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Người dùng
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3.5 text-center text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
            activeTab === "posts"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Bài viết
        </button>

        <button
          onClick={() => setActiveTab("hashtags")}
          className={`flex-1 py-3.5 text-center text-sm md:text-base font-semibold transition-all whitespace-nowrap ${
            activeTab === "hashtags"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Hashtag
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
        {/* Loading state */}
        {loading && (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm">Đang tìm kiếm...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-6 m-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && query && (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">
                search_off
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
              Không có{" "}
              {activeTab === "users"
                ? "người dùng"
                : activeTab === "posts"
                  ? "bài viết"
                  : "hashtag"}{" "}
              nào phù hợp với "{query}"
            </p>
          </div>
        )}

        {/* No search query */}
        {!loading && !error && results.length === 0 && !query && (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">
                search
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Hãy tìm kiếm
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
              Nhập từ khóa để tìm kiếm người dùng, bài viết hoặc hashtag
            </p>
          </div>
        )}

        {/* Users results */}
        {activeTab === "users" && !loading && results.length > 0 && (
          results.map((user) => (
            <Link
              key={user.id}
              to={`/profile/${user.username}`}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={
                    user.avatarUrl || "https://via.placeholder.com/48?text=U"
                  }
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                    @{user.username}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[24px]">
                arrow_forward
              </span>
            </Link>
          ))
        )}

        {/* Posts results */}
        {activeTab === "posts" && !loading && results.length > 0 && (
          results.map((post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                author: {
                  id: post.authorId,
                  username: post.authorUsername,
                  displayName: post.authorDisplayName,
                  avatarUrl: post.authorAvatarUrl,
                },
                createdAt: post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Vừa xong",
              }}
              onLike={() => {}}
              onBookmark={() => {}}
            />
          ))
        )}

        {/* Hashtags results (same as posts) */}
        {activeTab === "hashtags" && !loading && results.length > 0 && (
          results.map((post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                author: {
                  id: post.authorId,
                  username: post.authorUsername,
                  displayName: post.authorDisplayName,
                  avatarUrl: post.authorAvatarUrl,
                },
                createdAt: post.createdAt
                  ? new Date(post.createdAt).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "Vừa xong",
              }}
              onLike={() => {}}
              onBookmark={() => {}}
            />
          ))
        )}
      </div>
    </section>
  );
}
