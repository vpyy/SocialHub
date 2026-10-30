import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";

const API_BASE = "http://localhost:8080/api";

export default function Discover() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Tab state: 'users' | 'posts'
  const [activeTab, setActiveTab] = useState("posts");

  // Posts state
  const [popularPosts, setPopularPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");

  // Users state
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  // Follow action loading state
  const [followingIds, setFollowingIds] = useState(new Set());
  const [followActionLoadingId, setFollowActionLoadingId] = useState(null);

  // ──────────────────────────────────────────────────────
  // Fetch Popular Posts
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "posts") {
      fetchPopularPosts();
    }
  }, [activeTab]);

  const fetchPopularPosts = async () => {
    setPostsLoading(true);
    setPostsError("");
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/discover/popular-posts?limit=20`, {
        headers,
      });
      const data = await res.json();

      if (data.success) {
        setPopularPosts(data.data || []);
      } else {
        setPostsError(data.message || "Không thể tải bài viết");
      }
    } catch (err) {
      setPostsError("Lỗi kết nối: " + err.message);
    } finally {
      setPostsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // Fetch Suggested Users
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "users") {
      if (!token) {
        setUsersError("Vui lòng đăng nhập để xem gợi ý người dùng");
        return;
      }
      fetchSuggestedUsers();
    }
  }, [activeTab]);

  const fetchSuggestedUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE}/discover/suggested-users?limit=20`, {
        headers,
      });
      const data = await res.json();

      if (data.success) {
        setSuggestedUsers(data.data || []);
        // Initialize following state from the response
        const initialFollowing = new Set(
          (data.data || [])
            .filter((user) => user.isFollowing)
            .map((user) => user.id)
        );
        setFollowingIds(initialFollowing);
      } else {
        setUsersError(data.message || "Không thể tải gợi ý người dùng");
      }
    } catch (err) {
      setUsersError("Lỗi kết nối: " + err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // Handle Follow/Unfollow
  // ──────────────────────────────────────────────────────
  const handleToggleFollow = async (userId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    setFollowActionLoadingId(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const isNowFollowing = data.data.following;
        
        // Update UI
        if (isNowFollowing) {
          setFollowingIds((prev) => new Set([...prev, userId]));
        } else {
          setFollowingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }

        // Update the suggested users list
        setSuggestedUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, isFollowing: isNowFollowing } : user
          )
        );
      } else {
        alert(data.message || "Không thể thực hiện thao tác follow");
      }
    } catch (err) {
      console.error("Follow error:", err);
      alert("Lỗi kết nối khi follow");
    } finally {
      setFollowActionLoadingId(null);
    }
  };

  // ──────────────────────────────────────────────────────
  // Render: Loading State
  // ──────────────────────────────────────────────────────
  if (activeTab === "posts" && postsLoading) {
    return (
      <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-800 min-h-screen pb-20 bg-white dark:bg-gray-950 p-4">
        <div className="flex justify-center items-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (activeTab === "users" && usersLoading) {
    return (
      <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-800 min-h-screen pb-20 bg-white dark:bg-gray-950 p-4">
        <div className="flex justify-center items-center py-12">
          <div className="inline-block w-6 h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 w-full max-w-5xl mx-auto border-x border-gray-200 dark:border-gray-800 min-h-screen pb-20 flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-3 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Khám phá
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Khám phá những bài viết, người dùng và nội dung mới
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 sticky top-[70px] bg-white dark:bg-gray-900 z-10">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all relative ${
            activeTab === "posts"
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>Bài viết nổi bật</span>
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3.5 text-center text-sm font-semibold transition-all relative ${
            activeTab === "users"
              ? "text-indigo-600 dark:text-indigo-400 font-bold"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>Gợi ý mới</span>
          {activeTab === "users" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* ─── Posts Tab ─── */}
        {activeTab === "posts" && (
          <div>
            {postsError && (
              <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {postsError}
              </div>
            )}

            {popularPosts && popularPosts.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {popularPosts.map((item) => (
                  <div
                    key={item.post.id}
                    className="p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <PostCard
                      post={item.post}
                      onLike={() => fetchPopularPosts()}
                      onBookmark={() => {}}
                    />

                    {/* Engagement badge */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[14px]">
                        trending_up
                      </span>
                      <span>
                        {item.totalEngagement} lượt tương tác
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-3">
                  <span className="material-symbols-outlined text-[30px]">
                    trending_up
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Chưa có bài viết nổi bật
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
                  Hãy quay lại sau để xem những bài viết được nhiều người tương tác
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Users Tab ─── */}
        {activeTab === "users" && (
          <div>
            {usersError && (
              <div className="p-4 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {usersError}
              </div>
            )}

            {!token ? (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-3">
                  <span className="material-symbols-outlined text-[30px]">
                    person_search
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Đăng nhập để xem gợi ý
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
                  Hãy đăng nhập để nhận gợi ý những người dùng phù hợp với bạn
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 px-6 py-2 bg-indigo-600 dark:bg-indigo-600 text-white rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-colors font-semibold text-sm"
                >
                  Đăng nhập
                </button>
              </div>
            ) : suggestedUsers && suggestedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {suggestedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-md dark:hover:shadow-gray-800 transition-all"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={
                          user.avatarUrl ||
                          "https://via.placeholder.com/48?text=User"
                        }
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {user.displayName || user.username}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    {/* Mutual followers info */}
                    {user.mutualFollowersCount > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        <span className="font-semibold">{user.mutualFollowersCount}</span>{" "}
                        người theo dõi chung
                      </p>
                    )}

                    {/* Reason badge */}
                    <div className="mb-3 inline-block px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                      {user.reason === "mutual_followers"
                        ? "Bạn chung"
                        : "Được theo dõi bởi bạn bè"}
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={() => handleToggleFollow(user.id)}
                      disabled={followActionLoadingId === user.id}
                      className={`w-full py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                        followingIds.has(user.id)
                          ? "border border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white hover:border-red-500 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          : "bg-indigo-600 dark:bg-indigo-600 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700"
                      }`}
                    >
                      {followActionLoadingId === user.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      ) : followingIds.has(user.id) ? (
                        "Đang theo dõi"
                      ) : (
                        "Theo dõi"
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-3">
                  <span className="material-symbols-outlined text-[30px]">
                    person_search
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Chưa có gợi ý người dùng
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 max-w-xs mx-auto">
                  Bạn đã theo dõi mọi người hoặc không có người dùng phù hợp để gợi ý
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
