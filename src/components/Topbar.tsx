import React, { useState, useEffect } from "react";
import { Search, Bell, Settings, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "react-toastify";
import NotificationPanel from "./NotificationPanel";
import { getMyNotifications } from "../services/notificationService";

interface User {
  fullName: string;
  email: string;
  avatarUrl: string;
  username?: string;
}

interface TopbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  title?: string;
  user?: User;
  onLogout?: () => void;
  onViewProfile?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({
  searchQuery,
  setSearchQuery,
  title,
  user,
  onLogout,
  onViewProfile,
}) => {
  const [notifications, setNotifications] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getMyNotifications({ isRead: false, limit: 1 });
        if (!mounted) return;
        setUnreadCount(res.meta?.unreadCount ?? 0);
      } catch (err: any) {
        // ignore silently
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-[#e0e3e7] sticky top-0 z-40 select-none">
      {/* Search Input */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5f6368] w-4 border-none h-4 transition-colors group-focus-within:text-[#1967d2]" />
          <input
            type="text"
            className="w-full bg-[#f1f3f4] border border-[#e0e3e7] rounded-full py-2 pl-10 pr-4 text-sm text-[#202124] placeholder:text-[#5f6368]/80 focus:outline-none focus:border-[#c7d2fe] focus:ring-1 focus:ring-[#c7d2fe] transition-all group-hover:border-[#c7d2fe]"
            placeholder="Tìm kiếm tài liệu, bài giảng, nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <>
          <button
            onClick={() => setShowNotifications(true)}
            className="relative w-10 h-10 flex items-center justify-center text-[#5f6368] hover:bg-[#eceff1] hover:text-[#202124] rounded-full transition-all duration-200 cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#f28b82] rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>
          <NotificationPanel visible={showNotifications} onClose={() => setShowNotifications(false)} />
        </>

        {/* Settings shortcut */}
        <button
          onClick={() => toast.info("Theme sáng Google Drive đã được bật mặc định.")}
          className="w-10 h-10 flex items-center justify-center text-[#5f6368] hover:bg-[#eceff1] hover:text-[#202124] rounded-full transition-all duration-200 cursor-pointer"
          title="Giao diện"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Block */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#e0e3e7] select-none relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#202124]">
              {user?.fullName || "Nguyễn Minh Khôi"}
            </p>
          </div>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full border border-[#d2d6db] overflow-hidden shadow-sm cursor-pointer hover:border-[#c7d2fe] transition-all duration-300"
          >
            <img
              alt={user?.fullName || "User Avatar"}
              className="w-full h-full object-cover"
              src={
                user?.avatarUrl ||
                "https://lh3.googleusercontent.com/aida-public/AB6AXuDeIu6X_afgo0vR2SyhbuSVUPmFvww6JkOg3XzHDAjc643Po6akVAWkf66j78HU4nMeWT_zYrV7G3ubOiXfCJ6NTTm-Eyg8NOvdnON7q3-g1sqdByG54wr0mNMVmq4wPacZPkx-SJ9GA0yFopr8NLjGyFSG6U18oe6FmeEpapgkWoTwM7BLBIF2fiv6m8GaZ1iBYccOQ3Tw0-ZBxRaI5uqBFfq64ptKenlRLQE5bpJ27Tog19EvrhNoC8oI7Qnw8tZU309Xs5lfnGM"
              }
            />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && onLogout && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-[#e0e3e7] rounded-lg shadow-lg z-50 min-w-[180px] py-1">
              {onViewProfile && (
                <button
                  onClick={() => {
                    onViewProfile();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-[#3c4043] hover:bg-[#f1f3f4] transition-colors text-sm font-medium border-b border-[#e0e3e7]/50 text-left cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-[#5f6368]" />
                  Trang cá nhân
                </button>
              )}
              <button
                onClick={() => {
                  onLogout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
