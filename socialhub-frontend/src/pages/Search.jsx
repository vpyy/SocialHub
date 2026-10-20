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
    <section className="flex-1 max-w-[700px] border-r border-outline-variant/30 min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm người dùng, bài viết, hashtag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface-container text-on-surface placeholder-outline text-body-sm outline-none focus:bg-surface-container-high transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 sticky top-16 bg-surface/95 backdrop-blur-md z-10">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "users"
              ? "text-primary font-bold"
              : "text-outline hover:text-on-surface hover:bg-surface-container/50"
          }`}
        >
          <span>Người dùng</span>
          {activeTab === "users" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "posts"
              ? "text-primary font-bold"
              : "text-outline hover:text-on-surface hover:bg-surface-container/50"
          }`}
        >
          <span>Bài viết</span>
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("hashtags")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "hashtags"
              ? "text-primary font-bold"
              : "text-outline hover:text-on-surface hover:bg-surface-container/50"
          }`}
        >
          <span>Hashtag</span>
          {activeTab === "hashtags" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full"></div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Loading state */}
        {loading && (
          <div className="p-8 text-center text-outline">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-body-sm">Đang tìm kiếm...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-6 m-4 rounded-2xl bg-error-container text-on-error-container text-body-sm flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && query && (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">
                search_off
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface">
              Không tìm thấy kết quả
            </h3>
            <p className="text-outline text-sm mt-1 max-w-xs mx-auto">
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
            <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">
                search
              </span>
            </div>
            <h3 className="text-base font-bold text-on-surface">
              Hãy tìm kiếm
            </h3>
            <p className="text-outline text-sm mt-1 max-w-xs mx-auto">
              Nhập từ khóa để tìm kiếm người dùng, bài viết hoặc hashtag
            </p>
          </div>
        )}

        {/* Users results */}
        {activeTab === "users" && !loading && results.length > 0 && (
          <div className="divide-y divide-outline-variant/20">
            {results.map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="p-4 hover:bg-surface-container/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={
                      user.avatarUrl || "https://via.placeholder.com/48?text=U"
                    }
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full object-cover border border-outline-variant flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-title-md font-bold text-on-surface truncate">
                      {user.displayName}
                    </p>
                    <p className="text-body-sm text-outline truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline text-[24px]">
                  arrow_forward
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Posts results */}
        {activeTab === "posts" && !loading && results.length > 0 && (
          <div className="divide-y divide-outline-variant/20">
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
          <div className="divide-y divide-outline-variant/20">
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
