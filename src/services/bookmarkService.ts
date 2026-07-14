import { getAuthHeaders, handleUnauthorized } from '../lib/authStorage';
import type {
  AddBookmarkRequest,
  AddBookmarkResponse,
  GetBookmarksResponse,
  RemoveBookmarkResponse
} from '../types/bookmark';

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

export const getMyBookmarks = async (
  page = 1,
  limit = 20
): Promise<GetBookmarksResponse> => {
  const headers = getAuthHeaders();
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });

  const response = await fetch(apiUrl(`/users/me/bookmarks?${qs.toString()}`), {
    method: 'GET',
    headers: { accept: 'application/json', ...headers },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Lỗi lấy danh sách bookmark.');
  }

  return response.json();
}

export const addBookmark = async (
  documentId: string,
  body: AddBookmarkRequest = {}
): Promise<AddBookmarkResponse> => {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${documentId}/bookmarks`), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Không thể thêm bookmark.');
  }

  return response.json();
}

export const removeBookmark = async (
  documentId: string
): Promise<RemoveBookmarkResponse> => {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${documentId}/bookmarks`), {
    method: 'DELETE',
    headers: { accept: 'application/json', ...headers },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Không thể xóa bookmark.');
  }

  return response.json();
}
