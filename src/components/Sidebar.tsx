import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Home, 
  FileText, 
  Users, 
  Bot, 
  Star, 
  Trash2, 
  Settings, 
  ShieldCheck, 
  HelpCircle, 
  LogOut,
  Plus,
  ChevronDown,
  FolderPlus,
  FileUp,
  FolderUp,
  X,
  Link,
  RefreshCw
} from 'lucide-react';
import CustomDialog from './ui/CustomDialog';
import { resolveShareToken, uploadDocumentFile } from '../services/documentsApi';
import { toast } from 'react-toastify';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openUploadModal: () => void;
  onLogout?: () => void;
  storageUsed: number; // in GB
  storageTotal: number; // in GB
  folders?: any[];
  onImportSuccess?: (newDoc: any) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  openUploadModal,
  onLogout,
  storageUsed,
  storageTotal,
  folders = [],
  onImportSuccess
}) => {
  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'documents', label: 'Tài liệu', icon: FileText },
    { id: 'groups', label: 'Nhóm học tập', icon: Users },
    { id: 'chatbot', label: 'AI Chatbot', icon: Bot },
    { id: 'favorites', label: 'Yêu thích', icon: Star },
    { id: 'trash', label: 'Thùng rác', icon: Trash2 },
  ];

  const storagePercentage = (storageUsed / storageTotal) * 100;
  const [showNewMenu, setShowNewMenu] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message?: string;
    showInput?: boolean;
    defaultValue?: string;
    inputPlaceholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    onConfirm: (value: string) => void;
  } | null>(null);

  // Share link import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [targetFolderId, setTargetFolderId] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    if (showNewMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNewMenu]);

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

      {/* New Button (Google Drive style) */}
      <div className="relative mb-5" ref={newMenuRef}>
        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="w-full bg-[#102034] hover:bg-[#1b2b3f] text-[#d3e4fe] font-medium rounded-2xl py-3 px-5 flex items-center gap-3 transition-all duration-200 shadow-[0_1px_6px_rgba(0,0,0,0.28)] hover:shadow-[0_1px_8px_rgba(0,0,0,0.40)] border border-[#464554]/40 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 text-[#d3e4fe]" />
          <span className="font-semibold">Mới</span>
          <ChevronDown className={`w-4 h-4 ml-auto text-[#c7c4d7] transition-transform duration-200 ${showNewMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {showNewMenu && (
          <div className="absolute left-0 top-full mt-2 w-56 bg-[#1b2b3f] border border-[#464554]/50 rounded-xl shadow-2xl shadow-black/40 z-50 py-1.5 overflow-hidden">
            {/* New Folder */}
            <button
              onClick={() => {
                setShowNewMenu(false);
                setDialogConfig({
                  title: 'Thư mục mới',
                  showInput: true,
                  defaultValue: '',
                  inputPlaceholder: 'Nhập tên thư mục mới',
                  confirmLabel: 'Tạo',
                  onConfirm: (name) => {
                    if (name.trim()) toast.success(`Đã tạo thư mục: "${name.trim()}"`);
                    setDialogConfig(null);
                  }
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#d3e4fe] hover:bg-[#26364a] transition-colors cursor-pointer"
            >
              <FolderPlus className="w-5 h-5 text-[#ffb783] flex-shrink-0" />
              <span>Thư mục mới</span>
            </button>

            <div className="mx-3 my-1.5 border-t border-[#464554]/40" />

            {/* File Upload */}
            <button
              onClick={() => {
                setShowNewMenu(false);
                openUploadModal();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#d3e4fe] hover:bg-[#26364a] transition-colors cursor-pointer"
            >
              <FileUp className="w-5 h-5 text-[#c0c1ff] flex-shrink-0" />
              <span>Tải tệp lên</span>
            </button>

            {/* Import Share Link */}
            <button
              onClick={() => {
                setShowNewMenu(false);
                setShowImportModal(true);
                // Set default folder selection to the first folder if available
                if (folders.length > 0) {
                  setTargetFolderId(folders[0].id);
                } else {
                  setTargetFolderId('');
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#d3e4fe] hover:bg-[#26364a] transition-colors cursor-pointer"
            >
              <Link className="w-5 h-5 text-[#8083ff] flex-shrink-0" />
              <span>Nhập từ liên kết chia sẻ</span>
            </button>

            {/* Folder Upload */}
            <button
              onClick={() => {
                setShowNewMenu(false);
                toast.info('Tính năng tải thư mục lên sắp ra mắt!');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#d3e4fe] hover:bg-[#26364a] transition-colors cursor-pointer"
            >
              <FolderUp className="w-5 h-5 text-[#c0c1ff] flex-shrink-0" />
              <span>Tải thư mục lên</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-sm transition-all duration-200 cursor-pointer text-left ${
                isActive 
                  ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' 
                  : 'text-[#5f6368] hover:bg-[#e8eaed] hover:text-[#202124]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#1967d2]' : 'text-[#5f6368]'}`} />
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

      </div>
      {dialogConfig && (
        <CustomDialog
          isOpen={dialogConfig !== null}
          title={dialogConfig.title}
          message={dialogConfig.message}
          showInput={dialogConfig.showInput}
          defaultValue={dialogConfig.defaultValue}
          inputPlaceholder={dialogConfig.inputPlaceholder}
          confirmLabel={dialogConfig.confirmLabel}
          isDanger={dialogConfig.isDanger}
          onConfirm={dialogConfig.onConfirm}
          onClose={() => setDialogConfig(null)}
        />
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 text-[#d3e4fe]">
          <div onClick={() => !importLoading && setShowImportModal(false)} className="absolute inset-0 bg-[#000f21]/78 backdrop-blur-xs" />
          
          <div className="relative bg-[#102034] border border-[#464554]/60 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl z-10">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#464554]/40 flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#d3e4fe]">Nhập từ liên kết chia sẻ</h3>
              <button 
                type="button" 
                disabled={importLoading}
                onClick={() => setShowImportModal(false)}
                className="text-[#c7c4d7] hover:text-[#d3e4fe] p-1.5 rounded-full hover:bg-[#26364a] disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!shareLink.trim()) return;
              setImportLoading(true);
              setImportError('');
              try {
                // 1. Extract token
                const trimmed = shareLink.trim();
                let token = trimmed;
                if (trimmed.includes('/shared/')) {
                  token = trimmed.split('/shared/').pop()?.split('?')[0] || trimmed;
                }
                
                // 2. Resolve share link
                const sharedDoc = await resolveShareToken(token);
                
                // 3. Download the document blob
                const fileRes = await fetch(sharedDoc.downloadUrl);
                if (!fileRes.ok) throw new Error('Không thể tải xuống tệp tin chia sẻ từ máy chủ.');
                const blob = await fileRes.blob();
                
                const fileTitle = sharedDoc.solution?.title || sharedDoc.title || 'Tài liệu chia sẻ';
                const fileExt = sharedDoc.solution?.fileExtension?.replace(/^\./, '') || 'pdf';
                const file = new File([blob], sharedDoc.solution?.fileName || sharedDoc.fileName || `${fileTitle}.${fileExt}`, {
                  type: blob.type
                });
                
                // 4. Upload it under the user's account in chosen category
                const newDoc = await uploadDocumentFile(
                  file,
                  fileTitle,
                  targetFolderId || undefined,
                  sharedDoc.solution?.tags?.join(',') || sharedDoc.tags?.join(','),
                  true,
                  sharedDoc.solution?.description || sharedDoc.description
                );

                if (onImportSuccess) {
                  onImportSuccess(newDoc);
                }
                setShowImportModal(false);
                setShareLink('');
                setTargetFolderId('');
              } catch (err: any) {
                console.error(err);
                setImportError(err.message || 'Lỗi khi nhập tài liệu.');
              } finally {
                setImportLoading(false);
              }
            }} className="p-6 space-y-5">
              
              {importLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw className="w-10 h-10 text-[#c0c1ff] animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#d3e4fe]">Đang nhập tài liệu chia sẻ...</p>
                    <p className="text-xs text-[#c7c4d7] mt-1">Hệ thống đang tải dữ liệu và phân tích AI.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Share link input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                      Liên kết hoặc mã chia sẻ <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shareLink}
                      onChange={(e) => setShareLink(e.target.value)}
                      placeholder="Ví dụ: sds hoặc https://.../shared/sds"
                      className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] placeholder:text-[#c7c4d7]/50 focus:outline-none focus:border-[#c0c1ff]"
                    />
                  </div>

                  {/* Folder category selection */}
                  <div>
                    <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                      Lưu vào thư mục <span className="text-red-400">*</span>
                    </label>
                    {folders.length === 0 ? (
                      <div className="w-full bg-[#1b2b3f] border border-amber-500/40 rounded-xl py-2.5 px-4 text-sm text-amber-400">
                        Chưa có thư mục nào được tạo. Tài liệu sẽ lưu vào Lưu trữ chung.
                      </div>
                    ) : (
                      <select
                        required
                        value={targetFolderId}
                        onChange={(e) => setTargetFolderId(e.target.value)}
                        className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] focus:outline-none focus:border-[#c0c1ff]"
                      >
                        <option value="">Lưu trữ chung (Không gắn thư mục)</option>
                        {folders.map((fol) => (
                          <option key={fol.id} value={fol.id}>
                            {fol.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Error display */}
                  {importError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
                      Lỗi: {importError}
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="pt-4 border-t border-[#464554]/30 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={importLoading}
                      onClick={() => setShowImportModal(false)}
                      className="bg-transparent hover:bg-[#26364a] text-[#c7c4d7] hover:text-[#d3e4fe] font-semibold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={!shareLink.trim() || importLoading}
                      className="bg-[#c0c1ff] hover:bg-[#e1e0ff] disabled:opacity-50 disabled:cursor-not-allowed text-[#1000a9] font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md cursor-pointer"
                    >
                      Nhập tài liệu
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
