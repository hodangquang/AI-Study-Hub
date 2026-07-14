import { useState, useCallback } from 'react';
import type { UserNotification, UserNotificationsMeta, NotificationType } from '../types/notification';
import { getMyNotifications, markNotificationRead } from '../services/notificationService';

interface UseUserNotificationsReturn {
  notifications: UserNotification[];
  meta: UserNotificationsMeta | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: (params?: {
    isRead?: boolean;
    type?: NotificationType;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useUserNotifications = (): UseUserNotificationsReturn => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [meta, setMeta] = useState<UserNotificationsMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (params?: {
      isRead?: boolean;
      type?: NotificationType;
      page?: number;
      limit?: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMyNotifications(params);
        setNotifications(res.data);
        setMeta(res.meta);
      } catch (err: any) {
        const msg = err.message || 'Không thể tải thông báo';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const markRead = useCallback(async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setMeta((prev) =>
        prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : prev
      );
    } catch (err: any) {
      const msg = err.message || 'Không thể đánh dấu đã đọc';
      setError(msg);
      throw err;
    }
  }, []);

  return { notifications, meta, loading, error, fetchNotifications, markRead };
};
