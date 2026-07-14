import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useUserNotifications } from '../hooks/useUserNotifications';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<Props> = ({ visible, onClose }) => {
  const { notifications, meta, loading, error, fetchNotifications, markRead } = useUserNotifications();

  useEffect(() => {
    if (visible) {
      // load latest notifications and meta (unread count)
      fetchNotifications({ isRead: false, limit: 50 }).catch(() => {});
    }
  }, [visible, fetchNotifications]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-0 h-screen w-[360px] z-50">
      <div className="h-full bg-white border border-[#e0e3e7] rounded-lg shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e3e7]">
          <h3 className="text-sm font-semibold">Thông báo</h3>
          <div className="flex items-center gap-3">
            {meta && (
              <span className="text-xs text-[#5f6368]">Chưa đọc: {meta.unreadCount}</span>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-2 py-3">
          {loading && <div className="text-sm text-[#5f6368]">Đang tải...</div>}

          {!loading && notifications.length === 0 && (
            <div className="text-sm text-[#5f6368]">Không có thông báo</div>
          )}

          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n._id}
                onClick={async () => {
                  try {
                    if (!n.isRead) await markRead(n._id);
                  } catch (err: any) {
                    toast.error(err?.message || 'Đánh dấu đã đọc thất bại');
                  }
                }}
                className={`px-3 py-2 rounded-md cursor-pointer hover:bg-[#f6f8fa] transition-colors ${
                  n.isRead ? 'bg-white' : 'bg-[#f7fbff] border-l-4 border-[#1967d2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[#202124]">{n.title}</div>
                  <div className="text-xs text-[#6b6f73]">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-[#5f6368] mt-1 line-clamp-3">{n.body}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
