import React, { useState } from "react";
import { Search, Bell, Moon, Sun, LogOut } from "lucide-react";

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
}

const Topbar: React.FC<TopbarProps> = ({
  searchQuery,
  setSearchQuery,
  title,
  user,
  onLogout,
}) => {
  const [notifications, setNotifications] = useState(3);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#031427]/85 backdrop-blur-md border-b border-[#464554]/40 sticky top-0 z-40 select-none">
      {/* Search Input */}
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c7c4d7] w-4 border-none h-4 transition-colors group-focus-within:text-[#c0c1ff]" />
          <input
            type="text"
            className="w-full bg-[#102034] border border-[#464554]/50 rounded-full py-2 pl-10 pr-4 text-sm text-[#d3e4fe] placeholder:text-[#c7c4d7]/70 focus:outline-none focus:border-[#c0c1ff] focus:ring-1 focus:ring-[#c0c1ff] transition-all bg-opacity-70 group-hover:border-[#c0c1ff]/50"
            placeholder="Tìm kiếm tài liệu, bài giảng, nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={() => {
            alert(
              'Bạn có 3 thông báo mới: \n1. Tài liệu "Đề cương ôn tập.docx" đã xử lý xong.\n2. Bạn vừa được thêm vào Nhóm Marketing.\n3. Giáo viên cập nhật slide mới.',
            );
            setNotifications(0);
          }}
          className="relative w-10 h-10 flex items-center justify-center text-[#c7c4d7] hover:bg-[#26364a] hover:text-[#d3e4fe] rounded-full transition-all duration-200 cursor-pointer"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ffb783] rounded-full ring-2 ring-[#031427] animate-pulse"></span>
          )}
        </button>

        {/* Dark Mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-10 h-10 flex items-center justify-center text-[#c7c4d7] hover:bg-[#26364a] hover:text-[#d3e4fe] rounded-full transition-all duration-200 cursor-pointer"
          title={
            isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"
          }
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* User Block */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#464554]/30 select-none relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#d3e4fe]">
              {user?.fullName || "Nguyễn Minh Khôi"}
            </p>
            <p className="text-xs text-[#c7c4d7] font-medium opacity-80">
              Gói Premium
            </p>
          </div>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full border border-[#464554]/50 overflow-hidden shadow-md cursor-pointer hover:border-[#c0c1ff] transition-all duration-300"
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
            <div className="absolute top-full right-0 mt-2 bg-[#102034] border border-[#464554]/50 rounded-lg shadow-lg z-50 min-w-[180px]">
              <button
                onClick={() => {
                  onLogout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium first:rounded-t-lg last:rounded-b-lg"
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
