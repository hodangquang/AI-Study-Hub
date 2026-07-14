import { useState, useCallback } from 'react';
import type { AddBookmarkResponse, Bookmark, PaginationMeta } from '../types/bookmark';
import {
  getMyBookmarks,
  addBookmark,
  removeBookmark
} from '../services/bookmarkService';

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  meta: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  fetchBookmarks: (page?: number, limit?: number) => Promise<void>;
  handleAddBookmark: (documentId: string, note?: string) => Promise<AddBookmarkResponse | void>;
  handleRemoveBookmark: (documentId: string) => Promise<void>;
  isBookmarked: (documentId: string) => boolean;
}

export const useBookmarks = (): UseBookmarksReturn => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyBookmarks(page, limit);
      setBookmarks(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      const message = err.message || 'Không thể tải danh sách bookmark';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddBookmark = useCallback(
    async (documentId: string, note?: string) => {
      setError(null);
      try {
        const res = await addBookmark(documentId, note ? { note } : {});
        // Reload list after adding
        await fetchBookmarks();
        return res;
      } catch (err: any) {
        const message = err.message || 'Không thể thêm bookmark';
        setError(message);
        throw err;
      }
    },
    [fetchBookmarks]
  );

  const handleRemoveBookmark = useCallback(
    async (documentId: string) => {
      setError(null);
      try {
        await removeBookmark(documentId);
        // Optimistically remove from list
        setBookmarks((prev) =>
          prev.filter((bm) => bm.solution._id !== documentId)
        );
        if (meta) {
          setMeta({ ...meta, total: meta.total - 1 });
        }
      } catch (err: any) {
        const message = err.message || 'Không thể xóa bookmark';
        setError(message);
        throw err;
      }
    },
    [meta]
  );

  const isBookmarked = useCallback(
    (documentId: string) =>
      bookmarks.some((bm) => bm.solution._id === documentId),
    [bookmarks]
  );

  return {
    bookmarks,
    meta,
    loading,
    error,
    fetchBookmarks,
    handleAddBookmark,
    handleRemoveBookmark,
    isBookmarked
  };
};
