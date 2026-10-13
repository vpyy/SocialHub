import { useState } from 'react'

export default function CreatePostBar() {
  const [content, setContent] = useState('')

  return (
    <div className="p-5 border-b border-outline-variant/30 bg-surface-container-lowest">
      <div className="flex items-start gap-3">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuBB0HT_wLYim7e0zFg3wOkfsnhJUSfTge8oaajlG1uRVwG9dBqmdEH2zHyoc7cl_mnJh8EaOHlHqEr_0Jwt9TfFJMuJLv4pMVYB0_Mb4VNIuzFNFLVCFG3JpFLer54anBZ4s7r7_Yu2vD-lUNuKxXk9to3CZFJZrJqJs-EBHQ5hFz38Wl3RMT1RQ5fgFlTmCGd-uH1giRM2iKJd5Y09ycxhCnVokh7vO81xNBi_XNITlxyGvWwedt"
          alt="Current user"
          className="w-10 h-10 rounded-full object-cover border border-outline-variant/40"
        />
        <div className="flex-1">
          <button className="w-full text-left py-2.5 px-4 rounded-xl bg-surface-container-low text-on-surface-variant text-body-md font-body-md hover:bg-surface-container transition-colors">
            Bạn đang nghĩ gì, Minh? Chia sẻ dự án hoặc ý tưởng mới...
          </button>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-outline-variant/20">
            <div className="flex items-center gap-1 text-outline">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-label-sm font-label-sm text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">image</span>
                <span>Hình ảnh</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-label-sm font-label-sm text-secondary transition-colors">
                <span className="material-symbols-outlined text-[18px]">videocam</span>
                <span>Video</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-surface-container-low text-label-sm font-label-sm text-tertiary transition-colors">
                <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
                <span>Cảm xúc</span>
              </button>
            </div>
            <button className="px-4 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-label-sm font-semibold hover:bg-primary-container transition-colors">
              Đăng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
