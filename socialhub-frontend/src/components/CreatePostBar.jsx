import { useState, useRef } from "react";
import postService from "../services/postService";

export default function CreatePostBar({ onPostCreated }) {
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [imageSize, setImageSize] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  // ── Hashtag state ──
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const fileInputRef = useRef(null);

  // ─── read user from localStorage for display ──────────────
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // ─── submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!content.trim() && imageUrls.length === 0 && !videoUrl) {
      alert("Vui lòng nhập nội dung hoặc thêm media");
      return;
    }

    setIsSubmitting(true);
    try {
      const media = [
        ...imageUrls.map((url) => ({ type: "IMAGE", url })),
        ...(videoUrl ? [{ type: "VIDEO", url: videoUrl }] : []),
      ];

      // Merge explicit hashtags + tags auto-extracted from content by backend
      await postService.createPost({
        content: content.trim(),
        visibility,
        media,
        hashtags,
      });

      setContent("");
      setImageUrls([]);
      setImageUrlInput("");
      setVideoUrl("");
      setHashtags([]);
      setHashtagInput("");
      setVisibility("PUBLIC");
      setShowModal(false);
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Không thể tạo bài viết. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── manual URL input ──────────────────────────────────────
  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url) {
      setImageUrls((prev) => [...prev, url]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── local file → compressed base64 (no external service) ──
  // Resize to max 1280px wide, compress to JPEG 85% quality
  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const MAX = 1280;
          let { width, height } = img;
          if (width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          }
          if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    const newImages = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(`"${file.name}" không phải hình ảnh`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`"${file.name}" quá lớn (tối đa 10 MB)`);
        continue;
      }
      try {
        const dataUrl = await compressImage(file);
        newImages.push(dataUrl);
      } catch (err) {
        console.error("compressImage failed:", err);
        alert(`Không thể đọc "${file.name}"`);
      }
    }

    setImageUrls((prev) => [...prev, ...newImages]);
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── reset & close ─────────────────────────────────────────
  const handleClose = () => {
    if (isSubmitting || uploadingImage) return;
    setContent("");
    setImageUrls([]);
    setImageUrlInput("");
    setVideoUrl("");
    setHashtags([]);
    setHashtagInput("");
    setVisibility("PUBLIC");
    setShowModal(false);
  };

  // ─── hashtag helpers ───────────────────────────────────────
  const addHashtag = (raw) => {
    const tag = raw.replace(/^#+/, "").trim().toLowerCase().replace(/\s+/g, "_");
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  };

  const handleHashtagKeyDown = (e) => {
    if (["Enter", " ", ","].includes(e.key)) {
      e.preventDefault();
      addHashtag(hashtagInput);
    }
    if (e.key === "Backspace" && !hashtagInput && hashtags.length) {
      setHashtags((prev) => prev.slice(0, -1));
    }
  };

  const removeHashtag = (tag) =>
    setHashtags((prev) => prev.filter((t) => t !== tag));

  // ─── render ────────────────────────────────────────────────
  return (
    <>
      {/* Trigger bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4 shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src={
              currentUser.avatarUrl ||
              "https://ui-avatars.com/api/?name=U&background=4648d4&color=fff"
            }
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
          />
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-left rounded-full transition-colors text-sm"
          >
            Bạn đang nghĩ gì?
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tạo bài viết</h2>
              <button
                onClick={handleClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
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

            {/* Body */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* User info row */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={
                    currentUser.avatarUrl ||
                    "https://ui-avatars.com/api/?name=U&background=4648d4&color=fff"
                  }
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {currentUser.displayName || currentUser.username || "User"}
                  </p>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={isSubmitting}
                    className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-2 py-0.5 mt-0.5 border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors dark:text-white"
                  >
                    <option value="PUBLIC">🌍 Công khai</option>
                    <option value="FOLLOWERS">👥 Người theo dõi</option>
                    <option value="PRIVATE">🔒 Chỉ mình tôi</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn đang nghĩ gì?"
                disabled={isSubmitting}
                className="w-full min-h-[120px] p-2 bg-transparent text-gray-800 dark:text-white text-base resize-none focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />

              {/* Image previews */}
              {imageUrls.length > 0 && (
                <div
                  className={`mb-3 grid gap-2 ${
                    imageSize === "large"
                      ? "grid-cols-1"
                      : imageSize === "medium"
                        ? "grid-cols-2"
                        : "grid-cols-3"
                  }`}
                >
                  {imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <img
                        src={url}
                        alt={`Preview ${i + 1}`}
                        className={`w-full object-cover ${
                          imageSize === "large"
                            ? "max-h-96"
                            : imageSize === "medium"
                              ? "max-h-56"
                              : "max-h-32"
                        }`}
                      />
                      <button
                        onClick={() => handleRemoveImage(i)}
                        disabled={isSubmitting}
                        className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 disabled:opacity-50 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa ảnh"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Media section */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Thêm vào bài viết
                  </p>

                  {/* Image Size Options */}
                  {imageUrls.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Kích thước:</span>
                      <select
                        value={imageSize}
                        onChange={(e) => setImageSize(e.target.value)}
                        disabled={isSubmitting}
                        className="text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500 dark:text-white"
                      >
                        <option value="small">Nhỏ</option>
                        <option value="medium">Vừa</option>
                        <option value="large">Lớn</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {/* File picker */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer transition-colors text-sm font-medium text-gray-700 dark:text-gray-300">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    {uploadingImage ? "Đang xử lý..." : "Chọn ảnh"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      disabled={isSubmitting || uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {uploadingImage && (
                    <div className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400" />
                      Đang đọc file...
                    </div>
                  )}
                </div>

                {/* Manual URL */}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddImageUrl()}
                    placeholder="Hoặc dán URL hình ảnh"
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-3 bg-white dark:bg-gray-800 rounded-lg text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white dark:placeholder-gray-500"
                  />
                  <button
                    onClick={handleAddImageUrl}
                    disabled={isSubmitting || !imageUrlInput.trim()}
                    className="px-4 py-2 bg-indigo-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Thêm
                  </button>
                </div>
              </div>

              {/* Video URL */}
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Nhập URL video (YouTube, Vimeo…)"
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-full text-sm border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 dark:text-white dark:placeholder-gray-500"
              />

              {/* Hashtag input */}
              <div className="mt-3">
                <div className="flex items-center gap-1.5 flex-wrap min-h-[40px] px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-300 dark:focus-within:ring-indigo-400 transition-all">
                  <span className="text-indigo-400 text-sm font-bold select-none">#</span>
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        className="text-indigo-400 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={handleHashtagKeyDown}
                    onBlur={() => hashtagInput.trim() && addHashtag(hashtagInput)}
                    placeholder={hashtags.length === 0 ? "Thêm hashtag (Enter để xác nhận)" : ""}
                    disabled={isSubmitting}
                    className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-1">
                  Gõ hashtag + Enter hoặc Space để thêm. Backend cũng tự trích xuất #tags từ nội dung.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 shrink-0">
              <button
                onClick={handleClose}
                disabled={isSubmitting || uploadingImage}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  uploadingImage ||
                  (!content.trim() && imageUrls.length === 0 && !videoUrl)
                }
                className="px-6 py-2 bg-indigo-600 dark:bg-indigo-600 text-white rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? "Đang đăng…" : "Đăng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
