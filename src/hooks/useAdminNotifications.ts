import { useState, useCallback } from 'react';
import type {
  AdminNotificationGroup,
  SendNotificationRequest,
  NotificationType
} from '../types/notification';
import { sendAdminNotification, getAdminNotifications } from '../services/notificationService';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseAdminNotificationsReturn {
  history: AdminNotificationGroup[];
  meta: PaginationMeta | null;
  loading: boolean;
  sending: boolean;
  error: string | null;
  fetchHistory: (params?: {
    type?: NotificationType;
    senderId?: string;
    sourceEventId?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  send: (payload: SendNotificationRequest) => Promise<void>;
}

export const useAdminNotifications = (): UseAdminNotificationsReturn => {
  const [history, setHistory] = useState<AdminNotificationGroup[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (params?: {
      type?: NotificationType;
      senderId?: string;
      sourceEventId?: string;
      page?: number;
      limit?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAdminNotifications(params);
        setHistory(res.data);
        setMeta(res.meta);
      } catch (err: any) {
        const msg = err.message || 'Không thể tải lịch sử thông báo';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const send = useCallback(async (payload: SendNotificationRequest) => {
    setSending(true);
    setError(null);
    try {
      await sendAdminNotification(payload);
    } catch (err: any) {
      const msg = err.message || 'Gửi thông báo thất bại';
      setError(msg);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  return { history, meta, loading, sending, error, fetchHistory, send };
};
