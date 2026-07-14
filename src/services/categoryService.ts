import { getAuthHeaders, handleUnauthorized } from '../lib/authStorage';
import type { GetCategoriesQuery, GetCategoriesResponse } from '../types/category';

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

export const getCategories = async (
  params?: GetCategoriesQuery
): Promise<GetCategoriesResponse> => {
  const headers = getAuthHeaders();
  const qs = new URLSearchParams();
  if (params?.parentId) qs.set('parentId', params.parentId);
  if (params?.type) qs.set('type', params.type);
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive));

  const response = await fetch(apiUrl(`/categories?${qs.toString()}`), {
    method: 'GET',
    headers: { accept: 'application/json', ...headers },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Lỗi lấy danh sách category.');
  }
  return response.json();
}
