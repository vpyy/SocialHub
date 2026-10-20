import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PostCard from "../components/PostCard";

const API_BASE = "http://localhost:8080/api";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();

  // File input refs for local image upload
  const avatarFileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  // Current logged in user & token
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // Profile data states
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs state: 'posts' | 'reposts' | 'liked'
  const [activeTab, setActiveTab] = useState("posts");

  // Modal state for followers/following: null | 'followers' | 'following'
  const [modalType, setModalType] = useState(null);

  // Reposts & Liked Posts states
  const [reposts, setReposts] = useState([]);
  const [repostsLoading, setRepostsLoading] = useState(false);
  const [repostsLoaded, setRepostsLoaded] = useState(false);

  const [likedPosts, setLikedPosts] = useState([]);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [likedPostsLoaded, setLikedPostsLoaded] = useState(false);

  // Followers & Following lists
  const [followers, setFollowers] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersLoaded, setFollowersLoaded] = useState(false);

  const [following, setFollowing] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);

  // Follow/Unfollow action loading state
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Edit profile modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
    coverUrl: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Helper to read and optimize image from local file
  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WebP...)");
      return;
    }

    setEditError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize avatar dimensions to max 400x400
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

        setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WebP...)");
      return;
    }

    setEditError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize cover dimensions to max 1200 width
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        setEditForm((prev) => ({ ...prev, coverUrl: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ──────────────────────────────────────────────────────
  // Fetch Profile by username
  // ──────────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError("");
    setFollowersLoaded(false);
    setFollowingLoaded(false);
    setFollowers([]);
    setFollowing([]);
    setRepostsLoaded(false);
    setLikedPostsLoaded(false);
    setReposts([]);
    setLikedPosts([]);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/users/${username}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Không thể tìm thấy trang cá nhân này");
        setProfile(null);
        return;
      }

      setProfile(data.data);
      setEditForm({
        displayName: data.data.displayName || "",
        bio: data.data.bio || "",
        avatarUrl: data.data.avatarUrl || data.data.avatar || "",
        coverUrl: data.data.coverUrl || data.data.cover || "",
      });
    } catch (err) {
      setError("Lỗi kết nối máy chủ: " + err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username, token]);

  useEffect(() => {
    fetchProfile();
    setActiveTab("posts");
  }, [fetchProfile]);

  // ──────────────────────────────────────────────────────
  // Fetch Followers & Following for Modal
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    if (modalType === "followers" && !followersLoaded) {
      setFollowersLoading(true);
      fetch(`${API_BASE}/users/${profile.id}/followers`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFollowers(data.data || []);
            setFollowersLoaded(true);
          }
        })
        .catch((err) => console.error("Failed to load followers:", err))
        .finally(() => setFollowersLoading(false));
    }

    if (modalType === "following" && !followingLoaded) {
      setFollowingLoading(true);
      fetch(`${API_BASE}/users/${profile.id}/following`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFollowing(data.data || []);
            setFollowingLoaded(true);
          }
        })
        .catch((err) => console.error("Failed to load following:", err))
        .finally(() => setFollowingLoading(false));
    }
  }, [modalType, profile?.id, followersLoaded, followingLoaded, token]);

  // ──────────────────────────────────────────────────────
  // Fetch Reposts & Liked Posts when tab changes
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.id) return;

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    if (activeTab === "reposts" && !repostsLoaded) {
      setRepostsLoading(true);
      fetch(`${API_BASE}/users/${profile.id}/reposts`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setReposts(data.data || []);
            setRepostsLoaded(true);
          }
        })
        .catch((err) => console.error("Failed to load reposts:", err))
        .finally(() => setRepostsLoading(false));
    }

    if (activeTab === "liked" && !likedPostsLoaded) {
      setLikedPostsLoading(true);
      fetch(`${API_BASE}/users/${profile.id}/liked-posts`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLikedPosts(data.data || []);
            setLikedPostsLoaded(true);
          }
        })
        .catch((err) => console.error("Failed to load liked posts:", err))
        .finally(() => setLikedPostsLoading(false));
    }
  }, [activeTab, profile?.id, repostsLoaded, likedPostsLoaded, token]);

  // ──────────────────────────────────────────────────────
  // Toggle Follow on Profile Header
  // ──────────────────────────────────────────────────────
  const handleToggleFollowProfile = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!profile?.id || actionLoadingId) return;

    setActionLoadingId(profile.id);
    try {
      const res = await fetch(`${API_BASE}/users/${profile.id}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const isNowFollowing = data.data.following;
        const newFollowersCount =
          typeof data.data.followersCount === "number"
            ? data.data.followersCount
            : isNowFollowing
              ? profile.followersCount + 1
              : Math.max(0, profile.followersCount - 1);

        setProfile((prev) => ({
          ...prev,
          isFollowing: isNowFollowing,
          followersCount: newFollowersCount,
        }));

        // Refresh followers tab list if loaded
        if (followersLoaded) {
          setFollowersLoaded(false);
        }
      } else {
        alert(data.message || "Không thể thực hiện thao tác follow");
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
      alert("Lỗi kết nối khi follow: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ──────────────────────────────────────────────────────
  // Toggle Follow for user in Followers/Following list
  // ──────────────────────────────────────────────────────
  const handleToggleFollowUserInList = async (targetUser) => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (actionLoadingId) return;

    setActionLoadingId(targetUser.id);
    try {
      const res = await fetch(`${API_BASE}/users/${targetUser.id}/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const isNowFollowing = data.data.following;

        // Update in followers list
        setFollowers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id ? { ...u, isFollowing: isNowFollowing } : u,
          ),
        );

        // Update in following list
        setFollowing((prev) =>
          prev.map((u) =>
            u.id === targetUser.id ? { ...u, isFollowing: isNowFollowing } : u,
          ),
        );

        // If toggling on current user's profile, update followingCount
        if (profile?.isSelf) {
          setProfile((prev) => ({
            ...prev,
            followingCount: isNowFollowing
              ? prev.followingCount + 1
              : Math.max(0, prev.followingCount - 1),
          }));
        }

        // If toggling the main profile user from a list
        if (profile && profile.id === targetUser.id) {
          setProfile((prev) => ({
            ...prev,
            isFollowing: isNowFollowing,
            followersCount: data.data.followersCount ?? prev.followersCount,
          }));
        }
      }
    } catch (err) {
      console.error("List follow toggle error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ──────────────────────────────────────────────────────
  // Submit Edit Profile (PUT /api/users/me)
  // ──────────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!token) return;

    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: editForm.displayName.trim(),
          bio: editForm.bio.trim(),
          avatarUrl: editForm.avatarUrl.trim(),
          coverUrl: editForm.coverUrl.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.message || "Cập nhật hồ sơ thất bại");
        return;
      }

      // Update state
      setProfile((prev) => ({
        ...prev,
        ...data.data,
      }));

      // Update current user in localStorage for Sidebar/Header
      const updatedUser = {
        ...currentUser,
        displayName: data.data.displayName,
        avatarUrl: data.data.avatarUrl || data.data.avatar,
        coverUrl: data.data.coverUrl || data.data.cover,
        bio: data.data.bio,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // Close modal
      setIsEditOpen(false);
    } catch (err) {
      setEditError("Lỗi kết nối: " + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // Loading & Error States
  // ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="flex-1 max-w-[700px] border-r border-outline-variant/30 min-h-screen pb-20">
        <div className="h-48 bg-surface-container animate-pulse"></div>
        <div className="px-6 relative">
          <div className="w-28 h-28 rounded-full bg-surface-container-high border-4 border-surface -mt-14 animate-pulse"></div>
          <div className="mt-4 space-y-2">
            <div className="h-6 w-48 bg-surface-container rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-surface-container rounded animate-pulse"></div>
            <div className="h-4 w-full bg-surface-container rounded animate-pulse"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !profile) {
    return (
      <section className="flex-1 max-w-[700px] border-r border-outline-variant/30 min-h-screen p-8 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-4">
          <span className="material-symbols-outlined text-[36px]">
            person_off
          </span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">
          Người dùng không tồn tại
        </h2>
        <p className="text-on-surface-variant text-sm mb-6 max-w-sm">
          {error ||
            `Tài khoản @${username} không tồn tại hoặc đã đổi tên người dùng.`}
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-primary flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          <span>Quay lại Trang chủ</span>
        </button>
      </section>
    );
  }

  const isSelf = Boolean(profile.isSelf);
  const isFollowing = Boolean(profile.isFollowing);

  return (
    <section className="flex-1 w-full max-w-4xl mx-auto border-r border-outline-variant/30 min-h-screen pb-20 flex flex-col">
      {/* Header bar */}
      <div className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 px-4 md:px-6 py-2.5 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface-container transition-colors text-on-surface"
          title="Quay lại"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="text-title-md font-bold text-on-surface leading-tight flex items-center gap-1.5">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-body-sm text-outline">
            {profile.postsCount ?? (profile.posts?.length || 0)} bài viết
          </p>
        </div>
      </div>

      {/* Cover banner */}
      <div className="relative h-48 md:h-56 bg-surface-container-high overflow-hidden select-none">
        {profile.coverUrl ? (
          <img
            src={profile.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#4648d4]/30 via-[#6b38d4]/20 to-[#dae2fd] flex items-center justify-center">
            <span className="material-symbols-outlined text-outline/40 text-[64px]">
              image
            </span>
          </div>
        )}
      </div>

      {/* Profile info section */}
      <div className="px-4 md:px-6 relative pb-4 border-b border-outline-variant/30">
        {/* Avatar & Action Button Row */}
        <div className="flex items-end justify-between -mt-16 md:-mt-20 mb-4">
          <div className="relative group">
            <img
              src={
                profile.avatarUrl ||
                "https://via.placeholder.com/120?text=Avatar"
              }
              alt={profile.displayName || profile.username}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-surface shadow-md bg-surface"
            />
            {isSelf && (
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="absolute bottom-1 right-1 p-2 bg-primary text-on-primary rounded-full shadow-lg hover:bg-primary-container transition-all hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
                title="Thay đổi ảnh đại diện"
              >
                <span className="material-symbols-outlined text-[18px]">
                  photo_camera
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSelf ? (
              <button
                onClick={() => setIsEditOpen(true)}
                className="px-5 py-2 rounded-full border border-outline font-semibold text-on-surface text-label-md hover:bg-surface-container transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  edit
                </span>
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            ) : (
              <button
                onClick={handleToggleFollowProfile}
                disabled={actionLoadingId === profile.id}
                className={`px-6 py-2 rounded-full font-bold text-label-md transition-all flex items-center gap-1.5 active:scale-95 shadow-sm ${
                  isFollowing
                    ? "border border-outline text-on-surface hover:border-error hover:text-error hover:bg-error-container/20"
                    : "bg-primary text-on-primary hover:bg-primary-container hover:shadow-md"
                }`}
              >
                {actionLoadingId === profile.id ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : isFollowing ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      check
                    </span>
                    <span>Đang theo dõi</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      person_add
                    </span>
                    <span>Theo dõi</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-on-surface leading-tight flex items-center gap-1.5">
              <span>{profile.displayName || profile.username}</span>
            </h2>
            <p className="text-outline text-body-sm font-medium">
              @{profile.username}
            </p>
          </div>

          {/* Bio */}
          {profile.bio ? (
            <p className="text-on-surface text-body-md whitespace-pre-wrap leading-relaxed">
              {profile.bio}
            </p>
          ) : (
            <p className="text-outline text-body-sm italic">Chưa có tiểu sử</p>
          )}

          {/* Joined date & meta */}
          <div className="flex flex-wrap items-center gap-4 text-outline text-body-sm pt-1">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">
                calendar_month
              </span>
              <span>
                Tham gia{" "}
                {profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("vi-VN", {
                      month: "long",
                      year: "numeric",
                    })
                  : "gần đây"}
              </span>
            </div>
          </div>

          {/* Followers & Following counts */}
          <div className="flex items-center gap-6 pt-1 text-body-sm">
            <button
              onClick={() => setModalType("following")}
              className="hover:underline flex items-center gap-1 group text-left"
            >
              <strong className="font-bold text-on-surface group-hover:text-primary">
                {profile.followingCount ?? 0}
              </strong>
              <span className="text-outline">Đang theo dõi</span>
            </button>
            <button
              onClick={() => setModalType("followers")}
              className="hover:underline flex items-center gap-1 group text-left"
            >
              <strong className="font-bold text-on-surface group-hover:text-primary">
                {profile.followersCount ?? 0}
              </strong>
              <span className="text-outline">Người theo dõi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Tabs Bar */}
      <div className="flex border-b border-outline-variant/30 sticky top-[57px] bg-surface/95 backdrop-blur-md z-10">
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
          onClick={() => setActiveTab("reposts")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "reposts"
              ? "text-primary font-bold"
              : "text-outline hover:text-on-surface hover:bg-surface-container/50"
          }`}
        >
          <span>Bài viết đã đăng lại</span>
          {activeTab === "reposts" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab("liked")}
          className={`flex-1 py-3.5 text-center text-label-md font-semibold transition-all relative ${
            activeTab === "liked"
              ? "text-primary font-bold"
              : "text-outline hover:text-on-surface hover:bg-surface-container/50"
          }`}
        >
          <span>Bài viết đã thích</span>
          {activeTab === "liked" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full"></div>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {/* ─── TAB 1: BÀI VIẾT ─── */}
        {activeTab === "posts" && (
          <div>
            {profile.posts && profile.posts.length > 0 ? (
              <div className="divide-y divide-outline-variant/20">
                {profile.posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
                      author: post.author || {
                        id: profile.id,
                        username: profile.username,
                        displayName: profile.displayName,
                        avatarUrl: profile.avatarUrl,
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
            ) : (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
                  <span className="material-symbols-outlined text-[30px]">
                    post_add
                  </span>
                </div>
                <h3 className="text-base font-bold text-on-surface">
                  Chưa có bài viết nào
                </h3>
                <p className="text-outline text-sm mt-1 max-w-xs mx-auto">
                  {isSelf
                    ? "Bạn chưa đăng bài viết nào. Hãy chia sẻ suy nghĩ đầu tiên của bạn!"
                    : `Người dùng @${profile.username} chưa đăng bài viết nào.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: BÀI VIẾT ĐÃ ĐĂNG LẠI ─── */}
        {activeTab === "reposts" && (
          <div>
            {repostsLoading ? (
              <div className="p-8 text-center text-outline">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-body-sm">Đang tải bài viết đã đăng lại...</p>
              </div>
            ) : reposts && reposts.length > 0 ? (
              <div className="divide-y divide-outline-variant/20">
                {reposts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
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
            ) : (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
                  <span className="material-symbols-outlined text-[30px]">
                    repeat
                  </span>
                </div>
                <h3 className="text-base font-bold text-on-surface">
                  Chưa có bài viết đã đăng lại
                </h3>
                <p className="text-outline text-sm mt-1 max-w-xs mx-auto">
                  {isSelf
                    ? "Bạn chưa đăng lại bài viết nào."
                    : `@${profile.username} chưa đăng lại bài viết nào.`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: BÀI VIẾT ĐÃ THÍCH ─── */}
        {activeTab === "liked" && (
          <div>
            {likedPostsLoading ? (
              <div className="p-8 text-center text-outline">
                <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-body-sm">Đang tải bài viết đã thích...</p>
              </div>
            ) : likedPosts && likedPosts.length > 0 ? (
              <div className="divide-y divide-outline-variant/20">
                {likedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={{
                      ...post,
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
            ) : (
              <div className="py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
                  <span className="material-symbols-outlined text-[30px]">
                    favorite
                  </span>
                </div>
                <h3 className="text-base font-bold text-on-surface">
                  Chưa có bài viết đã thích
                </h3>
                <p className="text-outline text-sm mt-1 max-w-xs mx-auto">
                  {isSelf
                    ? "Bạn chưa thích bài viết nào."
                    : `@${profile.username} chưa thích bài viết nào.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── FOLLOWERS/FOLLOWING MODAL ─── */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalType(null)}
        >
          <div
            className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between sticky top-0 bg-surface z-10">
              <h3 className="text-title-md font-bold text-on-surface">
                {modalType === "followers"
                  ? `Người theo dõi (${profile.followersCount ?? 0})`
                  : `Đang theo dõi (${profile.followingCount ?? 0})`}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1">
              {modalType === "followers" ? (
                followersLoading ? (
                  <div className="p-8 text-center text-outline">
                    <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-body-sm">
                      Đang tải danh sách người theo dõi...
                    </p>
                  </div>
                ) : followers.length > 0 ? (
                  <div className="divide-y divide-outline-variant/20">
                    {followers.map((u) => (
                      <UserFollowCard
                        key={u.id}
                        user={u}
                        isCurrentUser={currentUser?.id === u.id || u.isSelf}
                        actionLoading={actionLoadingId === u.id}
                        onToggleFollow={() => handleToggleFollowUserInList(u)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center px-4">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
                      <span className="material-symbols-outlined text-[30px]">
                        group
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface">
                      Chưa có người theo dõi
                    </h3>
                    <p className="text-outline text-sm mt-1 max-w-xs mx-auto">
                      {isSelf
                        ? "Khi có người theo dõi bạn, họ sẽ xuất hiện tại đây."
                        : `Chưa có ai theo dõi @${profile.username}.`}
                    </p>
                  </div>
                )
              ) : followingLoading ? (
                <div className="p-8 text-center text-outline">
                  <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-body-sm">
                    Đang tải danh sách đang theo dõi...
                  </p>
                </div>
              ) : following.length > 0 ? (
                <div className="divide-y divide-outline-variant/20">
                  {following.map((u) => (
                    <UserFollowCard
                      key={u.id}
                      user={u}
                      isCurrentUser={currentUser?.id === u.id || u.isSelf}
                      actionLoading={actionLoadingId === u.id}
                      onToggleFollow={() => handleToggleFollowUserInList(u)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mx-auto mb-3">
                    <span className="material-symbols-outlined text-[30px]">
                      person_search
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-on-surface">
                    Chưa theo dõi ai
                  </h3>
                  <p className="text-outline text-sm mt-1 max-w-xs mx-auto">
                    {isSelf
                      ? "Bạn chưa theo dõi người dùng nào. Hãy tìm kiếm và kết nối bạn bè!"
                      : `@${profile.username} chưa theo dõi ai.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT PROFILE MODAL ─── */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-lg rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between">
              <h3 className="text-title-md font-bold text-on-surface">
                Chỉnh sửa trang cá nhân
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSaveProfile}
              className="p-6 overflow-y-auto space-y-4"
            >
              {editError && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>
                  <span>{editError}</span>
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-1">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  placeholder="Nhập tên hiển thị của bạn..."
                  className="input-field"
                />
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-label-md font-semibold text-on-surface">
                    Tiểu sử (Bio)
                  </label>
                  <span className="text-body-sm text-outline">
                    {editForm.bio.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Giới thiệu đôi nét về bản thân bạn..."
                  className="input-field resize-none"
                />
              </div>

              {/* Avatar Upload Section */}
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-2">
                  Ảnh đại diện
                </label>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />

                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0 bg-surface flex items-center justify-center shadow-sm">
                    {editForm.avatarUrl ? (
                      <img
                        src={editForm.avatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-outline text-[32px]">
                        person
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="px-4 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-label-sm font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          upload_file
                        </span>
                        <span>Tải ảnh từ máy</span>
                      </button>

                      {editForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm((prev) => ({ ...prev, avatarUrl: "" }))
                          }
                          className="px-3 py-1.5 rounded-full border border-outline text-error hover:bg-error-container/20 text-label-sm font-semibold transition-colors"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                    <p className="text-body-sm text-outline mt-1.5 truncate">
                      Chọn file JPG, PNG, WebP từ máy tính
                    </p>
                  </div>
                </div>

                {/* Fallback URL Input */}
                <div className="mt-2">
                  <input
                    type="url"
                    value={editForm.avatarUrl}
                    onChange={(e) =>
                      setEditForm({ ...editForm, avatarUrl: e.target.value })
                    }
                    placeholder="Hoặc dán URL ảnh đại diện..."
                    className="input-field text-body-sm"
                  />
                </div>
              </div>

              {/* Cover Upload Section */}
              <div>
                <label className="block text-label-md font-semibold text-on-surface mb-2">
                  Ảnh bìa (Cover)
                </label>

                {/* Hidden Cover File Input */}
                <input
                  type="file"
                  ref={coverFileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />

                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  <div className="relative h-24 w-full rounded-xl overflow-hidden border border-outline-variant/30 bg-surface flex items-center justify-center">
                    {editForm.coverUrl ? (
                      <img
                        src={editForm.coverUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-outline/40 text-[40px]">
                        image
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="px-4 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 text-label-sm font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        upload_file
                      </span>
                      <span>Tải ảnh bìa từ máy</span>
                    </button>

                    {editForm.coverUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({ ...prev, coverUrl: "" }))
                        }
                        className="px-3 py-1.5 rounded-full border border-outline text-error hover:bg-error-container/20 text-label-sm font-semibold transition-colors"
                      >
                        Xóa ảnh bìa
                      </button>
                    )}
                  </div>
                </div>

                {/* Fallback URL Input */}
                <div className="mt-2">
                  <input
                    type="url"
                    value={editForm.coverUrl}
                    onChange={(e) =>
                      setEditForm({ ...editForm, coverUrl: e.target.value })
                    }
                    placeholder="Hoặc dán URL ảnh bìa..."
                    className="input-field text-body-sm"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={editSaving}
                  className="px-5 py-2 rounded-full border border-outline font-semibold text-on-surface text-label-md hover:bg-surface-container"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-6 py-2 rounded-full bg-primary text-on-primary font-bold text-label-md hover:bg-primary-container shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {editSaving ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

// ──────────────────────────────────────────────────────
// Helper Component: User Follow Card
// ──────────────────────────────────────────────────────
function UserFollowCard({
  user,
  isCurrentUser,
  actionLoading,
  onToggleFollow,
}) {
  return (
    <div className="p-4 hover:bg-surface-container/40 transition-colors flex items-center justify-between gap-4">
      <Link
        to={`/profile/${user.username}`}
        className="flex items-center gap-3 flex-1 min-w-0 group"
      >
        <img
          src={
            user.avatarUrl ||
            user.avatar ||
            "https://via.placeholder.com/48?text=U"
          }
          alt={user.displayName || user.username}
          className="w-12 h-12 rounded-full object-cover border border-outline-variant flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-title-md font-bold text-on-surface group-hover:text-primary transition-colors truncate">
            {user.displayName || user.username}
          </p>
          <p className="text-body-sm text-outline truncate">@{user.username}</p>
          {user.bio && (
            <p className="text-body-sm text-on-surface-variant truncate mt-0.5">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      {!isCurrentUser && (
        <button
          onClick={onToggleFollow}
          disabled={actionLoading}
          className={`px-4 py-1.5 rounded-full text-label-sm font-semibold transition-all flex items-center gap-1 active:scale-95 flex-shrink-0 ${
            user.isFollowing
              ? "border border-outline text-on-surface hover:border-error hover:text-error hover:bg-error-container/20"
              : "bg-primary text-on-primary hover:bg-primary-container"
          }`}
        >
          {actionLoading ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          ) : user.isFollowing ? (
            "Đang theo dõi"
          ) : (
            "Theo dõi"
          )}
        </button>
      )}
    </div>
  );
}
