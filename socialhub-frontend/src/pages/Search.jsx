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
    <section className="flex-1 max-w-[700px] border-r border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 sticky top-0 z-20 bg-white dark:bg-slate-950 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm người dùng, bài viết, hashtag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-500 text-body-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-950 bg-opacity-95 dark:bg-opacity-95 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "users"
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
          }`}
        >
          <span>Người dùng</span>
          {activeTab === "users" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "posts"
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
          }`}
        >
          <span>Bài viết</span>
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("hashtags")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "hashtags"
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50"
          }`}
        >
          <span>Hashtag</span>
          {activeTab === "hashtags" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {loading && (
          <div className="p-8 text-center text-gray-500 dark:text-slate-400">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-body-sm">Đang tìm kiếm...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-6 m-4 rounded-2xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-body-sm flex items-center gap-3">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && query && (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 mx-auto mb-3">
              🔍
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">
              Không tìm thấy kết quả
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1 max-w-xs mx-auto">
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
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500 mx-auto mb-3">
              🔎
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-slate-50">
              Hãy tìm kiếm
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm mt-1 max-w-xs mx-auto">
              Nhập từ khóa để tìm kiếm người dùng, bài viết hoặc hashtag
            </p>
          </div>
        )}

        {/* Users results */}
        {activeTab === "users" && !loading && results.length > 0 && (
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {results.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="p-4 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={
                      user.avatarUrl || "https://via.placeholder.com/48?text=U"
                    }
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-title-md font-bold text-gray-900 dark:text-slate-50 truncate">
                      {user.displayName}
                    </p>
                    <p className="text-body-sm text-gray-600 dark:text-slate-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 dark:text-slate-500 text-[24px]">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Posts results */}
        {activeTab === "posts" && !loading && results.length > 0 && (
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {results.map((post) => (
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
            ))}
          </div>
        )}

        {/* Hashtags results (same as posts) */}
        {activeTab === "hashtags" && !loading && results.length > 0 && (
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {results.map((post) => (
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
