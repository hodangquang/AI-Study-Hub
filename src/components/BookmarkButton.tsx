import React, { useState } from 'react'
import { Bookmark, BookmarkCheck, Loader2, X } from 'lucide-react'
import { addBookmark, removeBookmark } from '../services/bookmarkService'
import { toast } from 'react-toastify'

interface BookmarkButtonProps {
  documentId: string
  documentTitle: string
  initialBookmarked?: boolean
  onToggle?: (bookmarked: boolean) => void
  variant?: 'icon' | 'full'
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  documentId,
  documentTitle,
  initialBookmarked = false,
  onToggle,
  variant = 'full',
}) => {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [note, setNote] = useState('')

  const handleAdd = async () => {
    if (bookmarked) {
      setLoading(true)
      try {
        await removeBookmark(documentId)
        setBookmarked(false)
        onToggle?.(false)
        toast.success(`Đã bỏ yêu thích "${documentTitle}"`)
      } catch {
        toast.error('Bỏ yêu thích thất bại')
      } finally {
        setLoading(false)
      }
    } else {
      setShowNoteModal(true)
    }
  }

  const handleConfirmAdd = async () => {
    setLoading(true)
    setShowNoteModal(false)
    try {
      await addBookmark(documentId, note.trim() ? { note: note.trim() } : {})
      setBookmarked(true)
      onToggle?.(true)
      toast.success(`Đã thêm "${documentTitle}" vào yêu thích`)
      setNote('')
    } catch {
      toast.error('Thêm yêu thích thất bại')
    } finally {
      setLoading(false)
    }
  }

  /* ── Render button ── */
  const isIcon = variant === 'icon'

  return (
    <>
      <button
        onClick={handleAdd}
        disabled={loading}
        title={bookmarked ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        className={[
          'inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium',
          isIcon
            ? 'w-9 h-9 rounded-lg border'
            : 'px-4 py-2 rounded-lg border text-sm',
          bookmarked
            ? 'bg-[#e8f0fe] border-[#1967d2] text-[#1967d2] hover:bg-red-50 hover:border-red-300 hover:text-red-500'
            : 'bg-white border-[#e0e3e7] text-[#5f6368] hover:bg-[#e8f0fe] hover:border-[#1967d2] hover:text-[#1967d2]',
        ].join(' ')}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : bookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        {!isIcon && (
          <span>{bookmarked ? 'Đã yêu thích' : 'Thêm yêu thích'}</span>
        )}
      </button>

      {/* ── Note Modal ── */}
      {showNoteModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNoteModal(false)
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNoteModal(false)} />

          {/* Modal card */}
          <div className="relative bg-white border border-[#e0e3e7] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e0e3e7]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e8f0fe] flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-[#1967d2]" />
                </div>
                <h3 className="font-bold text-base text-[#202124]">Thêm vào yêu thích</h3>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Doc title preview */}
              <div className="bg-[#f8fafd] border-l-2 border-[#1967d2] rounded-r-md px-3 py-2 text-sm text-[#5f6368] leading-snug">
                {documentTitle}
              </div>

              {/* Note textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#5f6368] uppercase tracking-wide">
                  Ghi chú <span className="normal-case font-normal">(tuỳ chọn)</span>
                </label>
                <textarea
                  className="w-full bg-white border border-[#e0e3e7] rounded-xl py-2.5 px-3.5 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:outline-none focus:border-[#1967d2] focus:ring-1 focus:ring-[#1967d2]/20 resize-none transition-colors"
                  placeholder="Nhập ghi chú cho bookmark này..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                  rows={3}
                />
                <p className="text-right text-xs text-[#9aa0a6]">{note.length}/300</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#e0e3e7]">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[#5f6368] bg-white border border-[#e0e3e7] rounded-xl hover:bg-[#f1f3f4] transition-colors cursor-pointer"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmAdd}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-[#1967d2] hover:bg-[#1557b0] rounded-xl transition-colors cursor-pointer shadow-sm shadow-[#1967d2]/20"
              >
                <Bookmark className="w-4 h-4" />
                Lưu yêu thích
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BookmarkButton
