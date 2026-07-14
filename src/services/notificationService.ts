import { getAuthHeaders, handleUnauthorized } from '../lib/authStorage';
import type {
  GetMyNotificationsResponse,
  MarkReadResponse,
  SendNotificationRequest,
  SendNotificationResponse,
  AdminNotificationsResponse,
  NotificationType
} from '../types/notification';

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

export const getMyNotifications = async (params?: {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}): Promise<GetMyNotificationsResponse> => {
  const headers = getAuthHeaders();
  const qs = new URLSearchParams();
  if (params?.isRead !== undefined) qs.set('isRead', String(params.isRead));
  if (params?.type) qs.set('type', params.type);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const response = await fetch(apiUrl(`/users/me/notifications?${qs.toString()}`), {
    method: 'GET',
    headers: { accept: 'application/json', ...headers },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Lỗi lấy danh sách thông báo.');
  }
  return response.json();
}

export const markNotificationRead = async (
  notificationId: string
): Promise<MarkReadResponse> => {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/users/me/notifications/${notificationId}/read`), {
    method: 'PUT',
    headers: { accept: 'application/json', ...headers },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Lỗi đánh dấu đã đọc.');
  }
  return response.json();
}

export const sendAdminNotification = async (
  body: SendNotificationRequest
): Promise<SendNotificationResponse> => {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl('/admin/notifications'), {
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
    throw new Error('Lỗi gửi thông báo admin.');
  }
  return response.json();
}

export const getAdminNotifications = async (params?: {
  type?: NotificationType;
  senderId?: string;
  sourceEventId?: string;
  page?: number;
  limit?: number;
}): Promise<AdminNotificationsResponse> => {
  const headers = getAuthHeaders();
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.senderId) qs.set('senderId', params.senderId);
  if (params?.sourceEventId) qs.set('sourceEventId', params.sourceEventId);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const response = await fetch(apiUrl(`/admin/notifications?${qs.toString()}`), {
    method: 'GET',
    headers: { accept: 'application/json', ...headers },
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new Error('Lỗi lấy thông báo admin.');
  }
  return response.json();
}
