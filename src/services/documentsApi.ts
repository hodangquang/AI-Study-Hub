import { getAuthHeaders, handleUnauthorized } from "../lib/authStorage";
import type { StudyDocument } from "../types";
import { resolveAvatarUrl } from "./authApi";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  // If Vite proxy handles /api, we should query it relatively. 
  // If target server is specified in .env, we prepend it.
  return API_BASE ? `${API_BASE}${path}` : path;
}

export function formatRelativeTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'Gần đây';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Gần đây';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 5) {
    return 'Vừa tải lên';
  }
  if (diffMins < 60) {
    return `Sửa ${diffMins} phút trước`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `Sửa ${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `Sửa ${diffDays} ngày trước`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `Sửa ${diffWeeks} tuần trước`;
  }

  return `Sửa ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}

export function mapBackendDocToStudyDoc(doc: any): StudyDocument {
  const fileExt = doc.fileExtension?.replace(/^\./, '') || 'pdf';
  const fileType = ['pdf', 'docx', 'pptx'].includes(fileExt) ? fileExt : 'pdf';

  // Format size
  let sizeStr = '—';
  if (doc.fileSizeBytes) {
    if (doc.fileSizeBytes > 1024 * 1024) {
      sizeStr = `${(doc.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      sizeStr = `${(doc.fileSizeBytes / 1024).toFixed(0)} KB`;
    }
  }

  // Format category
  let categoryName: any = ' đại cương';
  const catName = doc.category?.name || '';
  if (catName.toLowerCase().includes('chuyên') || catName.toLowerCase().includes('ngành')) {
    categoryName = 'chuyên ngành';
  }

  // Parse owner info from doc.uploadedBy
  const uploadedBy = doc.uploadedBy || {};
  const ownerName = uploadedBy.fullName || undefined;
  const ownerAvatar = uploadedBy.avatarUrl
    ? resolveAvatarUrl(uploadedBy.avatarUrl, ownerName || '')
    : undefined;

  return {
    id: doc._id,
    title: doc.title || doc.fileName || 'Không có tiêu đề',
    type: fileType as any,
    size: sizeStr,
    category: categoryName,
    status: doc.aiStatus === 'ready' ? 'ready' : 'processing',
    lastModified: formatRelativeTime(doc.updatedAt || doc.createdAt),
    isFavorite: doc.isBookmarked || false,
    downloadUrl: doc.publicUrl || apiUrl(`/documents/${doc._id}/download`),
    iconBg: fileType === 'pdf' ? '#EF4444' : fileType === 'docx' ? '#3B82F6' : '#8B5CF6',
    ownerName,
    ownerAvatar,
    uploaderId: doc.uploaderId || uploadedBy._id || uploadedBy.id || undefined,
    description: doc.description,
    pageCount: doc.pageCount,
    viewCount: doc.viewCount,
    downloadCount: doc.downloadCount,
    tags: doc.tags,
    folderId: doc.folderId || (doc.folder && typeof doc.folder === 'object' ? doc.folder._id : doc.folder) || undefined,
  };
}

export interface FetchDocumentsParams {
  q?: string;
  categoryId?: string;
  tags?: string;
  isPublic?: boolean;
  aiStatus?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'viewCount' | 'downloadCount';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FetchDocumentsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FetchDocumentsResult {
  docs: StudyDocument[];
  meta: FetchDocumentsMeta;
}

export interface DocumentUploadStatus {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  status: string;
  aiStatus: 'pending' | 'processing' | 'ready' | 'failed';
  aiErrorMessage?: string;
  ocrStatus: 'pending' | 'processing' | 'ready' | 'failed';
  ocrErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchDocumentsWithParams(
  params: FetchDocumentsParams = {}
): Promise<FetchDocumentsResult> {
  const headers = getAuthHeaders();

  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.tags) qs.set('tags', params.tags);
  if (params.isPublic !== undefined) qs.set('isPublic', String(params.isPublic));
  if (params.aiStatus) qs.set('aiStatus', params.aiStatus);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.order) qs.set('order', params.order);
  qs.set('page', String(params.page ?? 1));
  qs.set('limit', String(params.limit ?? 20));

  const response = await fetch(apiUrl(`/documents?${qs.toString()}`), {
    method: 'GET',
    headers: { accept: 'application/json', ...headers },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Không thể tải danh sách tài liệu từ máy chủ.');
  }

  const resBody = await response.json();
  const dataList: any[] = resBody.data || [];
  const meta: FetchDocumentsMeta = resBody.meta || { page: 1, limit: 20, total: dataList.length, totalPages: 1 };

  return { docs: dataList.map(mapBackendDocToStudyDoc), meta };
}

/** Backward-compat wrapper used in App.tsx initial load */
export async function fetchDocuments(): Promise<StudyDocument[]> {
  const result = await fetchDocumentsWithParams({ limit: 100 });
  return result.docs;
}


export async function uploadDocumentFile(
  file: File,
  title: string,
  categoryId?: string,
  tags?: string,
  isPublic: boolean = false,
  description?: string,
  folderId?: string | null
): Promise<StudyDocument> {
  const headers = getAuthHeaders();

  // Create multipart payload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (description) formData.append("description", description);
  if (categoryId) formData.append("categoryId", categoryId);
  if (tags) formData.append("tags", tags);
  if (folderId) formData.append("folderId", folderId);
  formData.append("isPublic", String(isPublic));
  formData.append("enableOcr", "true");

  // Remove content-type header so fetch will set boundaries correctly
  const { "Content-Type": _, ...authHeaders } = headers as any;

  const response = await fetch(apiUrl("/documents"), {
    method: "POST",
    headers: {
      accept: "application/json",
      ...authHeaders,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Tải lên tệp thất bại.");
  }

  const resBody = await response.json();
  return mapBackendDocToStudyDoc(resBody.data);
}

export async function deleteDocumentOnBackend(id: string, deleteReason?: string): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}`), {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ deleteReason: deleteReason || "No longer needed" }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể xóa tài liệu trên máy chủ.");
  }
}

export async function bookmarkDocumentOnBackend(id: string): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}/bookmarks`), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error("Không thể đánh dấu tài liệu.");
  }
}

export async function unbookmarkDocumentOnBackend(id: string): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}/bookmarks`), {
    method: "DELETE",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error("Không thể bỏ đánh dấu tài liệu.");
  }
}


export interface BackendCategory {
  id: string;
  name: string;
  slug: string;
}

export async function fetchCategories(): Promise<BackendCategory[]> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl("/categories"), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    return [];
  }

  const resBody = await response.json();
  const list = resBody.data || [];
  return list.map((c: any) => ({
    id: c._id,
    name: c.name,
    slug: c.slug,
  }));
}

/**
 * Download a document file via GET /documents/{id}/download
 * The response is application/octet-stream — we fetch it with auth headers
 * then trigger a browser "Save As" using a temporary anchor element.
 */
export async function downloadDocumentFile(
  id: string,
  fileName: string
): Promise<void> {
  const headers = getAuthHeaders();

  const response = await fetch(apiUrl(`/documents/${id}/download`), {
    method: "GET",
    headers: {
      accept: "application/octet-stream",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    if (response.status === 403) throw new Error("Bạn không có quyền tải tài liệu này.");
    if (response.status === 404) throw new Error("Tài liệu hoặc tệp không tồn tại trên máy chủ.");
    const errBody = await response.json().catch(() => ({}));
    throw new Error((errBody as any).message || "Tải xuống thất bại.");
  }

  // Stream the response into a blob and trigger download
  const blob = await response.blob();

  // Try to read filename from Content-Disposition header
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
  const resolvedName = match?.[1]
    ? decodeURIComponent(match[1].trim())
    : fileName;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resolvedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Release object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Fetch detailed document info from GET /documents/{id}
 */
export async function fetchDocumentDetail(id: string): Promise<StudyDocument> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}`), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    if (response.status === 404) throw new Error("Không tìm thấy tài liệu.");
    if (response.status === 403) throw new Error("Bạn không có quyền truy cập tài liệu này.");
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể tải thông tin chi tiết tài liệu.");
  }

  const resBody = await response.json();
  return mapBackendDocToStudyDoc(resBody.data);
}

/**
 * Fetch backend document blob, override MIME type, and return temporary object URL for inline viewing
 */
export async function viewDocumentFile(id: string, fileType: string): Promise<string> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}/download`), {
    method: "GET",
    headers: {
      accept: "application/octet-stream",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    if (response.status === 403) throw new Error("Bạn không có quyền xem tài liệu này.");
    if (response.status === 404) throw new Error("Tài liệu hoặc tệp không tồn tại trên máy chủ.");
    const errBody = await response.json().catch(() => ({}));
    throw new Error((errBody as any).message || "Không thể tải tài liệu.");
  }

  const blob = await response.blob();

  // Map fileType to standard MIME types so browser can view inline (e.g. PDF viewer)
  let mimeType = "application/octet-stream";
  if (fileType === "pdf") mimeType = "application/pdf";
  else if (fileType === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  else if (fileType === "pptx") mimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

  const previewBlob = new Blob([blob], { type: mimeType });
  return URL.createObjectURL(previewBlob);
}

/**
 * Get document upload and processing status from GET /documents/{id}/upload-status
 */
export async function fetchDocumentUploadStatus(id: string): Promise<DocumentUploadStatus> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}/upload-status`), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    if (response.status === 404) throw new Error("Không tìm thấy tài liệu.");
    if (response.status === 403) throw new Error("Bạn không có quyền truy cập thông tin tải lên của tài liệu này.");
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể lấy trạng thái tải lên của tài liệu.");
  }

  const resBody = await response.json();
  const data = resBody.data || {};
  return {
    id: data._id,
    fileName: data.fileName,
    fileSizeBytes: data.fileSizeBytes,
    status: data.status,
    aiStatus: data.aiStatus,
    aiErrorMessage: data.aiErrorMessage,
    ocrStatus: data.ocrStatus,
    ocrErrorMessage: data.ocrErrorMessage,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export interface UpdateDocumentPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  isPublic?: boolean;
  language?: string;
}

/**
 * Update document metadata using PUT /documents/{id}
 */
export async function updateDocumentMetadata(
  id: string,
  payload: UpdateDocumentPayload
): Promise<StudyDocument> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}`), {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    if (response.status === 403) throw new Error("Chỉ chủ sở hữu mới có quyền cập nhật tài liệu.");
    if (response.status === 404) throw new Error("Tài liệu không tồn tại.");
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể cập nhật thông tin tài liệu.");
  }

  const resBody = await response.json();
  return mapBackendDocToStudyDoc(resBody.data);
}

export async function resolveShareToken(token: string): Promise<any> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/shared/${token}`), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể tìm thấy liên kết chia sẻ hoặc liên kết đã hết hạn.");
  }

  const resBody = await response.json();
  return resBody.data;
}

export interface CreateShareLinkPayload {
  permissionLevel?: 'viewer' | 'editor';
  canDownload?: boolean;
  canComment?: boolean;
  requiresLogin?: boolean;
  passwordHash?: string;
  maxUses?: number;
  expiresInDays?: number;
  note?: string;
}

export async function createDocumentShareLink(
  documentId: string,
  payload: CreateShareLinkPayload = {}
): Promise<{ token: string; shareUrl?: string }> {
  const headers = getAuthHeaders();

  const body = {
    permissionLevel: payload.permissionLevel ?? "viewer",
    canDownload: payload.canDownload ?? true,
    canComment: payload.canComment ?? true,
    requiresLogin: payload.requiresLogin ?? true,
    passwordHash: payload.passwordHash || undefined,
    maxUses: payload.maxUses ?? 0,
    expiresInDays: payload.expiresInDays ?? 0,
    note: payload.note || undefined,
  };

  const response = await fetch(apiUrl(`/documents/${documentId}/share`), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể tạo liên kết chia sẻ.");
  }

  const resBody = await response.json();
  return resBody.data;
}

export async function getDocumentShareLinks(
  documentId: string
): Promise<any[]> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${documentId}/share`), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể lấy danh sách liên kết chia sẻ.");
  }

  const resBody = await response.json();
  return resBody.data || [];
}

export async function revokeDocumentShareLink(
  documentId: string,
  shareId: string
): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${documentId}/share/${shareId}`), {
    method: "DELETE",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Không thể hủy bỏ liên kết chia sẻ.");
  }
}

export interface CreateFolderPayload {
  name: string;
  parentId?: string | null;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export async function createFolderOnBackend(payload: CreateFolderPayload): Promise<FolderItem> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl("/folders"), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      name: payload.name,
      parentId: payload.parentId || undefined,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Tạo thư mục thất bại.");
  }

  const resBody = await response.json();
  const data = resBody.data || resBody;
  return {
    id: data._id || data.id,
    name: data.name,
    parentId: data.parentId,
    ownerId: data.ownerId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function fetchFoldersFromBackend(folderId?: string): Promise<FolderItem[]> {
  const headers = getAuthHeaders();
  const qs = new URLSearchParams();
  if (folderId) qs.set('folderId', folderId);
  const response = await fetch(apiUrl(`/folders/contents?${qs.toString()}`), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    return [];
  }

  const resBody = await response.json();
  const data = resBody.data || resBody;
  const folderList = data.folders || [];
  return folderList.map((f: any) => ({
    id: f._id || f.id,
    name: f.name,
    parentId: f.parentId,
    ownerId: f.ownerId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));
}

export async function renameFolderOnBackend(id: string, name: string): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/folders/${id}`), {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Đổi tên thư mục thất bại.");
  }
}

export async function deleteFolderOnBackend(id: string): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/folders/${id}`), {
    method: "DELETE",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ confirm: true }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Xóa thư mục thất bại.");
  }
}

export interface FolderContents {
  currentFolder: FolderItem | null;
  breadcrumbs: FolderItem[];
  folders: FolderItem[];
  documents: StudyDocument[];
}

export async function fetchFolderContents(params: {
  folderId?: string;
  q?: string;
  sortBy?: string;
  order?: string;
}): Promise<FolderContents> {
  const headers = getAuthHeaders();
  const qs = new URLSearchParams();
  if (params.folderId) qs.set('folderId', params.folderId);
  if (params.q) qs.set('q', params.q);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.order) qs.set('order', params.order);

  const response = await fetch(apiUrl(`/folders/contents?${qs.toString()}`), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error("Không thể tải nội dung thư mục.");
  }

  const resBody = await response.json();
  const data = resBody.data || resBody;

  const currentFolder = data.currentFolder ? {
    id: data.currentFolder._id || data.currentFolder.id,
    name: data.currentFolder.name,
    parentId: data.currentFolder.parentId,
    ownerId: data.currentFolder.ownerId,
    createdAt: data.currentFolder.createdAt,
    updatedAt: data.currentFolder.updatedAt,
  } : null;

  const breadcrumbs = (data.breadcrumbs || []).map((b: any) => ({
    id: b._id || b.id,
    name: b.name,
    parentId: b.parentId,
    ownerId: b.ownerId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));

  const folders = (data.folders || []).map((f: any) => ({
    id: f._id || f.id,
    name: f.name,
    parentId: f.parentId,
    ownerId: f.ownerId,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  }));

  const documents = (data.documents || []).map(mapBackendDocToStudyDoc);

  return {
    currentFolder,
    breadcrumbs,
    folders,
    documents,
  };
}

export async function fetchFolderBreadcrumb(id: string): Promise<FolderItem[]> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/folders/${id}/breadcrumb`), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    return [];
  }

  const resBody = await response.json();
  const list = resBody.data || resBody || [];
  return list.map((b: any) => ({
    id: b._id || b.id,
    name: b.name,
    parentId: b.parentId,
    ownerId: b.ownerId,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));
}

export async function moveFolderOnBackend(id: string, parentId: string | null): Promise<void> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/folders/${id}/move`), {
    method: "PUT",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ parentId: parentId || null }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Di chuyển thư mục thất bại.");
  }
}

export interface SummarizePayload {
  length?: 'short' | 'medium' | 'long';
  language?: string;
  focus?: string;
}

export interface SummarizeResult {
  summary: string;
  keyPoints: string[];
}

export async function summarizeDocumentOnBackend(
  id: string,
  payload: SummarizePayload = {}
): Promise<SummarizeResult> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}/ai/summarize`), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      length: payload.length || "medium",
      language: payload.language || "Vietnamese",
      focus: payload.focus || "General",
    }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Tóm tắt tài liệu thất bại.");
  }

  const resBody = await response.json();
  const data = resBody.data || resBody;
  return {
    summary: data.summary || "",
    keyPoints: data.keyPoints || data.insights || [],
  };
}

export interface ExplainConceptPayload {
  concept: string;
  level?: 'basic' | 'intermediate' | 'advanced';
}

export interface ExplainConceptResult {
  concept: string;
  explanation: string;
}

export async function explainConceptOnBackend(
  id: string,
  payload: ExplainConceptPayload
): Promise<ExplainConceptResult> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/documents/${id}/ai/explain`), {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      concept: payload.concept,
      level: payload.level || "basic",
    }),
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || "Giải thích khái niệm thất bại.");
  }

  const resBody = await response.json();
  const data = resBody.data || resBody;
  return {
    concept: data.concept || payload.concept,
    explanation: data.explanation || data.content || "",
  };
}



