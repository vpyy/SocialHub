import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import likeService from "../services/likeService";
import commentService from "../services/commentService";
import postService from "../services/postService";
import bookmarkService from "../services/bookmarkService";
import CommentItem from "./CommentItem";
import RepostButton from "./RepostButton";
import EngagementModal from "./EngagementModal";

export default function PostCard({
  post,
  onLike,
  onBookmark,
  onUpdate,
  onDelete,
  showCommentsDefault = false,
  noBorder = false,
}) {
  const [showComments, setShowComments] = useState(showCommentsDefault);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Engagement modal state
  const [engagementModal, setEngagementModal] = useState({ type: null, open: false });

  // Local state for optimistic updates
  const [localLiked, setLocalLiked] = useState(post.isLiked);
  const [localLikeCount, setLocalLikeCount] = useState(post.likes);
  const [localCommentCount, setLocalCommentCount] = useState(post.comments);
  const [localBookmarked, setLocalBookmarked] = useState(post.isBookmarked ?? false);

  // Edit/Delete menu state
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editVisibility, setEditVisibility] = useState(post.visibility || "PUBLIC");
  const [editImages, setEditImages] = useState(post.media || []);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAuthor = currentUser.id === post.author?.id;
  const navigate = useNavigate();

  // Navigate to user profile
  const handleProfileClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${post.author.username}`);
  };

  // Navigate to post detail
  const handlePostClick = (e) => {
    e.stopPropagation();
    
    // Don't navigate if clicking on interactive elements
    if (
      e.target.closest('button') ||
      e.target.closest('a') ||
      e.target.closest('input') ||
      e.target.closest('textarea')
    ) {
      return;
    }
    
    // Check if post is viewable (not PRIVATE from another user)
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (post.visibility === "PRIVATE" && post.author?.id !== currentUser.id) {
      // Don't navigate to posts user can't view
      return;
    }
    
    navigate(`/post/${post.id}`);
  };

  // Auto-load comments if showCommentsDefault is true
  useEffect(() => {
    if (showCommentsDefault) {
      setShowComments(true);
    }
  }, [showCommentsDefault]);

  // Early return if post or author data is invalid
  if (!post || !post.author) {
    return (
      <article className="bg-white border-b border-gray-100 p-4 md:p-6">
        <div className="text-center text-gray-500 py-8">
          <p>Không thể hiển thị bài viết này</p>
        </div>
      </article>
    );
  }

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);

    // Optimistic update
    const wasLiked = localLiked;
    setLocalLiked(!wasLiked);
    setLocalLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const response = await likeService.toggleLike(post.id);

      // response is ApiResponse.data → { liked, likeCount }
      const data = response?.data ?? response;
      if (data != null) {
        setLocalLiked(data.liked);
        // If server returned the true count, use it; otherwise keep optimistic value
        if (typeof data.likeCount === "number") {
          setLocalLikeCount(data.likeCount);
        }
      }
      if (onLike) onLike(post.id);
    } catch (error) {
      console.error("Error toggling like:", error);
      // Rollback optimistic update
      setLocalLiked(wasLiked);
      setLocalLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    const wasBookmarked = localBookmarked;
    setLocalBookmarked(!wasBookmarked);    // optimistic
    try {
      const res = await bookmarkService.toggleBookmark(post.id);
      const data = res?.data ?? res;
      if (data?.bookmarked != null) setLocalBookmarked(data.bookmarked);
      if (onBookmark) onBookmark(post.id);
    } catch (err) {
      console.error('Bookmark error:', err);
      setLocalBookmarked(wasBookmarked);   // rollback
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    setIsLoadingComments(true);
    setShowComments(true);

    try {
      const response = await commentService.getPostComments(post.id, 0, 20);
      console.log("Comments response:", response);

      // Handle both response.data.content and response.content
      const commentsData = response.data?.content || response.content || [];
      setComments(commentsData);
    } catch (error) {
      console.error("Error loading comments:", error);
      setComments([]); // Set empty array on error
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      const response = await commentService.createComment(post.id, {
        content: newComment.trim(),
        parentCommentId: null,
      });

      console.log("Create comment response:", response);

      // Handle response structure
      const newCommentData = response.data || response;
      setComments([newCommentData, ...comments]);
      setNewComment("");
      setLocalCommentCount(localCommentCount + 1);

      if (onUpdate) {
        onUpdate(post.id);
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      alert("Không thể gửi bình luận. Vui lòng thử lại.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = async (parentCommentId, content) => {
    try {
      await commentService.createComment(post.id, {
        content: content.trim(),
        parentCommentId: parentCommentId,
      });

      const updatedComments = await commentService.getPostComments(
        post.id,
        0,
        20,
      );
      const commentsData =
        updatedComments.data?.content || updatedComments.content || [];
      setComments(commentsData);
      setLocalCommentCount(localCommentCount + 1);
    } catch (error) {
      console.error("Error creating reply:", error);
      throw error;
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      await commentService.deleteComment(commentId);

      const updatedComments = await commentService.getPostComments(
        post.id,
        0,
        20,
      );
      const commentsData =
        updatedComments.data?.content || updatedComments.content || [];
      setComments(commentsData);
      setLocalCommentCount(Math.max(0, localCommentCount - 1));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Không thể xóa bình luận.");
    }
  };

  // Handle edit post
  const handleEditPost = () => {
    setEditContent(post.content);
    setEditVisibility(post.visibility || "PUBLIC");
    setEditImages(post.media || []);
    setShowEditModal(true);
    setShowMenu(false);
  };

  // Handle upload image for edit
  const handleEditImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("https://api.imgur.com/3/image", {
        method: "POST",
        headers: {
          Authorization: "Client-ID a18f7b37088b840",
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        const newImage = {
          type: "IMAGE",
          url: data.data.link,
        };
        setEditImages([...editImages, newImage]);
      } else {
        alert("Upload hình ảnh thất bại");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Lỗi khi upload hình ảnh");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle remove image from edit
  const handleRemoveEditImage = (index) => {
    setEditImages(editImages.filter((_, i) => i !== index));
  };

  // Handle update post
  const handleUpdatePost = async () => {
    if (!editContent.trim() && editImages.length === 0) {
      alert("Bài viết phải có nội dung hoặc hình ảnh");
      return;
    }

    setIsUpdating(true);
    try {
      const updatePayload = {
        content: editContent.trim(),
        visibility: editVisibility,
        media: editImages,
      };
      
      console.log("Update payload:", updatePayload);
      console.log("Post object:", post);
      
      await postService.updatePost(post.id, updatePayload);

      setShowEditModal(false);

      if (onUpdate) {
        onUpdate();
      }

      alert("Cập nhật bài viết thành công!");
      window.location.reload();
    } catch (error) {
      console.error("Error updating post:", error);
      console.error("Error response:", error.response?.data);
      alert("Không thể cập nhật bài viết. Vui lòng thử lại.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete post
  const handleDeletePost = async () => {
    if (
      !confirm(
        "Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.",
      )
    )
      return;

    setShowMenu(false);

    try {
      await postService.deletePost(post.id);

      if (onDelete) {
        onDelete(post.id);
      } else if (onUpdate) {
        onUpdate();
      }

      alert("Xóa bài viết thành công!");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };

  return (
    <article 
      className={`bg-white dark:bg-slate-950 ${noBorder ? 'p-3 md:p-4' : 'p-4 md:p-6 border-b border-gray-100 dark:border-slate-800'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <img
            src={post.author?.avatarUrl || 'https://via.placeholder.com/44'}
            alt={post.author?.displayName || 'User'}
            className="w-11 h-11 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleProfileClick}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span 
                className="text-title-md font-title-md text-on-surface cursor-pointer hover:underline"
                onClick={handleProfileClick}
              >
                {post.author?.displayName || 'Unknown User'}
              </span>
              {post.author?.isVerified && (
                <span className="material-symbols-outlined fill-icon text-primary text-[18px]">
                  verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-body-sm font-body-sm text-outline">
              <span 
                className="cursor-pointer hover:underline"
                onClick={handleProfileClick}
              >
                @{post.author?.username || 'unknown'}
              </span>
              <span>•</span>
              <span>{post.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Menu button - only show for post author */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[150px] z-10">
                <button
                  onClick={handleEditPost}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Chỉnh sửa
                </button>
                <button
                  onClick={handleDeletePost}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Xóa bài viết
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        className="mb-2 text-[15px] text-gray-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap cursor-pointer"
        onClick={handlePostClick}
      >
        {post.content}
      </div>

      {/* Media */}
      {post.imageUrl && (
        <div 
          className="mb-2 rounded-lg overflow-hidden cursor-pointer bg-gray-100 dark:bg-slate-900"
          onClick={handlePostClick}
        >
          <img
            src={post.imageUrl}
            alt={post.imageCaption || "Post image"}
            className="w-full h-auto object-contain max-h-[600px]"
          />
        </div>
      )}

      {/* Engagement Bar */}
      <div className="flex items-center justify-between py-1.5 mt-1">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group disabled:opacity-50"
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              localLiked ? "text-red-500 fill-current" : "text-gray-600 dark:text-slate-400"
            }`}
            fill={localLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span
            onClick={(e) => {
              e.stopPropagation()
              setEngagementModal({ type: 'likes', open: true })
            }}
            className="text-sm font-medium hover:underline cursor-pointer text-gray-700 dark:text-slate-300"
          >
            {localLikeCount}
          </span>
        </button>

        {/* Comment Button */}
        <button
          onClick={loadComments}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span
            onClick={(e) => {
              e.stopPropagation()
              setEngagementModal({ type: 'comments', open: true })
            }}
            className="text-sm font-medium hover:underline cursor-pointer text-gray-700 dark:text-slate-300"
          >
            {localCommentCount}
          </span>
        </button>

        {/* Repost Button */}
        <RepostButton
          postId={post.id}
          shareCount={post.shares || 0}
          isReposted={post.isReposted || false}
        />

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              localBookmarked ? "text-blue-500 fill-current" : "text-gray-600 dark:text-slate-400"
            }`}
            fill={localBookmarked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          {/* Comment Input */}
          <div className="flex items-start gap-2.5 mb-3">
            <img
              src={currentUser.avatarUrl || "https://via.placeholder.com/32"}
              alt="You"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  placeholder="Viết bình luận..."
                  disabled={isSubmittingComment}
                  rows="1"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-900 rounded-lg text-sm border-0 focus:bg-gray-100 dark:focus:bg-slate-800 outline-none resize-none disabled:opacity-50 transition-colors text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="absolute right-3 bottom-2.5 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-500"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-2.5">
              {comments
                .filter((c) => c && c.id)
                .map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={handleDeleteComment}
                    onReply={handleReply}
                    currentUserId={currentUser.id}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm text-gray-400">Chưa có bình luận nào</p>
              <p className="text-xs text-gray-400 mt-1">
                Hãy là người đầu tiên bình luận!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                Chỉnh sửa bài viết
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì?"
                  disabled={isUpdating}
                  className="w-full min-h-[150px] p-3 bg-gray-50 text-gray-800 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg border border-gray-200 disabled:opacity-50"
                />
              </div>

              {/* Visibility Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ai có thể xem bài viết này?
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value)}
                  disabled={isUpdating}
                  className="w-full p-3 bg-gray-50 text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg border border-gray-200 disabled:opacity-50"
                >
                  <option value="PUBLIC">🌍 Công khai - Mọi người có thể xem</option>
                  <option value="FOLLOWERS">👥 Người theo dõi - Chỉ người theo dõi tôi</option>
                  <option value="PRIVATE">🔒 Chỉ mình tôi</option>
                </select>
              </div>

              {/* Current Images */}
              {editImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {editImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveEditImage(index)}
                          disabled={isUpdating}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Image Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  id="edit-image-upload"
                  className="hidden"
                  disabled={isUpdating || isUploadingImage}
                />
                <label
                  htmlFor="edit-image-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer ${
                    (isUpdating || isUploadingImage) ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {isUploadingImage ? "Đang tải lên..." : "Thêm hình ảnh"}
                  </span>
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdatePost}
                disabled={isUpdating || isUploadingImage || (!editContent.trim() && editImages.length === 0)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Modal */}
      {engagementModal.open && (
        <EngagementModal
          postId={post.id}
          type={engagementModal.type}
          count={engagementModal.type === 'likes' ? localLikeCount : localCommentCount}
          onClose={() => setEngagementModal({ type: null, open: false })}
        />
      )}
    </article>
  );
}
