import React from 'react';
import { 
  BookOpen, 
  Upload, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Bot, 
  Star, 
  Trash2, 
  Settings, 
  ShieldCheck, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openUploadModal: () => void;
  onLogout?: () => void;
  storageUsed: number; // in GB
  storageTotal: number; // in GB
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  openUploadModal,
  onLogout,
  storageUsed,
  storageTotal 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Tài liệu', icon: FileText },
    { id: 'groups', label: 'Nhóm học tập', icon: Users },
    { id: 'chatbot', label: 'AI Chatbot', icon: Bot },
    { id: 'favorites', label: 'Yêu thích', icon: Star },
    { id: 'trash', label: 'Thùng rác', icon: Trash2 },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
    { id: 'admin', label: 'Quản trị', icon: ShieldCheck },
  ];

  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-[#102034] border-r border-[#464554]/50 flex flex-col p-4 z-50 overflow-y-auto select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-1 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#8083ff] flex items-center justify-center shadow-lg shadow-[#8083ff]/20">
          <BookOpen className="text-[#0d0096] w-5 h-5 font-bold" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[#d3e4fe] tracking-tight">AI Study Hub</h1>
          <p className="text-xs text-[#c7c4d7]">Hệ thống học tập</p>
        </div>
      </div>

      {/* Upload Button */}
      <button 
        onClick={openUploadModal}
        className="w-full bg-[#c0c1ff] hover:bg-[#e1e0ff] text-[#1000a9] font-medium rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_2px_8px_rgba(192,193,255,0.15)] hover:scale-[1.02] active:scale-95 cursor-pointer mb-5 text-sm"
      >
        <Upload className="w-4 h-4" />
        <span>Tải lên tài liệu</span>
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer text-left ${
                isActive 
                  ? 'bg-[#571bc1] text-[#c4abff] font-medium shadow-md shadow-[#571bc1]/20' 
                  : 'text-[#c7c4d7] hover:bg-[#26364a] hover:text-[#d3e4fe]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#c4abff]' : 'text-[#c7c4d7]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions and Storage Limit */}
      <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-[#464554]/30">
        {/* Storage Info */}
        <div className="px-3 py-2 mb-2 bg-[#0b1c30]/50 rounded-lg border border-[#464554]/10">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-[#c7c4d7] font-medium">Bộ nhớ lưu trữ</span>
            <span className="text-xs text-[#c7c4d7] font-semibold">{storageUsed}GB / {storageTotal}GB</span>
          </div>
          <div className="w-full bg-[#1b2b3f] h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#c0c1ff] h-full rounded-full transition-all duration-500" 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Help Button */}
        <button
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200 text-left ${
            activeTab === 'help'
              ? 'bg-[#26364a] text-[#d3e4fe]'
              : 'text-[#c7c4d7] hover:bg-[#26364a] hover:text-[#d3e4fe]'
          }`}
        >
          <HelpCircle className="w-5 h-5 text-[#c7c4d7]" />
          <span>Trợ giúp</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={() => onLogout?.()}
          className="flex items-center gap-3 px-4 py-2 text-[#c7c4d7] hover:bg-[#26364a] hover:text-[#ffb4ab] rounded-lg text-sm transition-all duration-200 text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
