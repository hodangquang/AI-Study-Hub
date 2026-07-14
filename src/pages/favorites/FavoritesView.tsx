import React, { useEffect, useState } from 'react';
import {
  Star,
  BookOpen,
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { StudyDocument } from '@/types';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { Bookmark } from '@/types/bookmark';
import { toast } from 'react-toastify';

/* ── Props ── */
interface FavoritesViewProps {
  setActiveTab: (tab: string) => void;
  onOpenAIOverlay: (doc: StudyDocument) => void;
}

/* ── Helpers ── */
const formatFileSize = (bytes: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/** Chuyển dữ liệu Bookmark thành StudyDocument để mở AI Overlay */
const bookmarkToStudyDoc = (bm: Bookmark): StudyDocument => {
  const ext = bm.solution.fileExtension?.replace(/^\./, '').toLowerCase() || 'pdf';
  const fileType = (['pdf', 'docx', 'pptx'] as const).includes(ext as any)
    ? (ext as 'pdf' | 'docx' | 'pptx')
    : 'pdf';
  return {
    id: bm.solution._id,
    title: bm.solution.title,
    type: fileType,
    size: formatFileSize(bm.solution.fileSizeBytes),
    category: 'khác',
    status: 'ready',
    lastModified: formatDate(bm.createdAt),
    isFavorite: true,
    iconBg:
      fileType === 'pdf' ? '#EF4444' : fileType === 'docx' ? '#3B82F6' : '#8B5CF6',
    tags: bm.solution.tags,
  };
};

const DEFAULT_COVER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCbbfocjEbKOTSLbClyGfNcRHx-H896PSMtke6hQIXBawzeKwhv-EUXyRzlFl8fUiC8P5iu1kTqN479491dS4-KkH7C-FVedKwXdJQID_pive5sCEt9aKJ9ZqJ9_qogM4gmOXLNwnJTtYHpIXbBBC5Gw876d67hYrNTZSZQbc3cqeNa7bRpdeKY_owqRW7Xf6DQ7AD7LJU6rdWuawmmgYj3kE8gP-N6sMNj395nlFOVyko6CJwZV4YzFjeB2-4snqAFXY40vzWS2NY';

const LIMIT = 12;

/* ── Component ── */
const FavoritesView: React.FC<FavoritesViewProps> = ({
  setActiveTab,
  onOpenAIOverlay,
}) => {
  const { bookmarks, meta, loading, error, fetchBookmarks, handleRemoveBookmark } =
    useBookmarks();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks(currentPage, LIMIT);
  }, [currentPage, fetchBookmarks]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemove = async (
    e: React.MouseEvent,
    documentId: string,
    title: string
  ) => {
    e.stopPropagation();
    setRemovingId(documentId);
    try {
      await handleRemoveBookmark(documentId);
      toast.success(`Đã bỏ yêu thích "${title}"`);
    } catch {
      toast.error('Không thể bỏ yêu thích');
    } finally {
      setRemovingId(null);
    }
  };

  const filtered = bookmarks.filter((bm) =>
    bm.solution.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Add-more card dùng lại ở 2 nơi ── */
  const AddMoreCard = () => (
    <div
      onClick={() => setActiveTab('documents')}
      className="border-2 border-dashed border-[#e0e3e7] bg-white rounded-xl flex flex-col items-center justify-center p-6 gap-3 group hover:bg-[#f1f3f4] hover:border-[#c7d2fe]/60 transition-all cursor-pointer min-h-[220px]"
    >
      <div className="w-11 h-11 rounded-full bg-[#f1f3f4] flex items-center justify-center group-hover:bg-[#e8f0fe]/80 transition-all border border-[#e0e3e7]">
        <span className="text-[#5f6368] group-hover:text-[#1967d2] font-bold text-xl">
          +
        </span>
      </div>
      <p className="text-xs text-[#5f6368]/80 text-center font-medium max-w-[160px] leading-relaxed">
        Thêm tài liệu vào danh sách yêu thích
      </p>
    </div>
  );

  return (
    <div className="space-y-6 select-none">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#202124]">Tài liệu yêu thích</h2>
          <p className="text-sm text-[#5f6368] mt-1">
            {meta
              ? `${meta.total} tài liệu đã lưu`
              : 'Quản lý và ôn tập các tài liệu quan trọng đã được lưu trữ.'}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5f6368] pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm trong yêu thích..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-[#e0e3e7] rounded-lg text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:outline-none focus:border-[#1967d2] focus:ring-1 focus:ring-[#1967d2]/20 transition-colors w-56"
          />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-[#5f6368]">
          <Loader2 className="w-9 h-9 animate-spin text-[#1967d2]" />
          <p className="text-sm">Đang tải danh sách yêu thích...</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {searchQuery ? (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[280px] gap-3 text-center">
              <p className="text-sm text-[#5f6368]">
                Không có kết quả nào khớp với &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <AddMoreCard />
          )}
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((bookmark) => (
            <div
              key={bookmark._id}
              onClick={() => onOpenAIOverlay(bookmarkToStudyDoc(bookmark))}
              className="group bg-white border border-[#e0e3e7] rounded-xl overflow-hidden hover:border-[#c7d2fe]/60 transition-all duration-300 flex flex-col cursor-pointer shadow-sm"
            >
              {/* Cover */}
              <div className="relative h-40 bg-[#f1f3f4] overflow-hidden">
                <img
                  alt={bookmark.solution.title}
                  className="w-full h-full object-cover opacity-95 group-hover:scale-[1.03] group-hover:opacity-100 transition-all duration-500"
                  src={bookmark.solution.thumbnailUrl || DEFAULT_COVER}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_COVER;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent" />

                {/* Star remove */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={(e) =>
                      handleRemove(e, bookmark.solution._id, bookmark.solution.title)
                    }
                    disabled={removingId === bookmark.solution._id}
                    className="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-red-50 backdrop-blur-md rounded-full transition-colors border border-[#e0e3e7] cursor-pointer disabled:opacity-50"
                    title="Bỏ yêu thích"
                  >
                    {removingId === bookmark.solution._id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#5f6368]" />
                    ) : (
                      <Star className="w-4 h-4 fill-[#1967d2] text-[#1967d2]" />
                    )}
                  </button>
                </div>

                {/* File ext badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="bg-[#f1f3f4] text-[#5f6368] px-2 py-0.5 rounded text-[9px] font-bold border border-[#e0e3e7] uppercase tracking-widest">
                    {bookmark.solution.fileExtension?.replace(/^\./, '') || 'FILE'}
                  </span>
                </div>

                {/* Public badge */}
                {bookmark.solution.isPublic && (
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-semibold px-2 py-0.5 rounded">
                      Public
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1 gap-2">
                <h3 className="font-semibold text-sm text-[#202124] group-hover:text-[#1967d2] line-clamp-2 leading-relaxed">
                  {bookmark.solution.title}
                </h3>

                {/* Tags */}
                {bookmark.solution.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bookmark.solution.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] bg-[#e8f0fe] text-[#1967d2] px-2 py-0.5 rounded-full font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Note */}
                {bookmark.note && (
                  <div className="flex items-start gap-1.5 bg-[#f8fafd] border-l-2 border-[#1967d2] rounded-r-md px-2.5 py-2 text-xs text-[#5f6368]">
                    <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#1967d2]" />
                    <span className="line-clamp-2">{bookmark.note}</span>
                  </div>
                )}

                {/* Footer meta */}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#e0e3e7]">
                  <span className="text-[11px] text-[#5f6368]/80">
                    {formatFileSize(bookmark.solution.fileSizeBytes)}
                  </span>
                  <span className="text-[11px] text-[#5f6368]/80">
                    {formatDate(bookmark.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Add more card */}
          {!searchQuery && <AddMoreCard />}
        </div>
      )}

      {/* ── Pagination ── */}
      {meta && meta.totalPages > 1 && !searchQuery && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e0e3e7] bg-white text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === meta.totalPages ||
                Math.abs(p - currentPage) <= 2
            )
            .map((page, idx, arr) => (
              <React.Fragment key={page}>
                {idx > 0 && arr[idx - 1] !== page - 1 && (
                  <span className="text-[#9aa0a6] px-1 text-sm">…</span>
                )}
                <button
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#1967d2] text-white border border-[#1967d2]'
                      : 'bg-white border border-[#e0e3e7] text-[#5f6368] hover:bg-[#f1f3f4]'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}

          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e0e3e7] bg-white text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            disabled={currentPage === meta.totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FavoritesView;
