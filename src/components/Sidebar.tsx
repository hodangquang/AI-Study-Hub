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
import { resolveShareToken, uploadDocumentFile } from '@/services/documentsApi';
import CustomDialog from '@/components/ui/CustomDialog';
import { toast } from 'react-toastify';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  openUploadModal: () => void;
  storageQuota: {
    usedBytes: number;
    totalBytes: number;
    plan: string;
  } | null;
  folders: any[];
  onImportSuccess?: (newDoc: any) => void;
  onCreateFolder?: (name: string, parentId?: string | null) => Promise<void> | void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  openUploadModal,
  storageQuota,
  folders,
  onImportSuccess,
  onCreateFolder
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [targetFolderId, setTargetFolderId] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  // Dialog config
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

  const newMenuRef = useRef<HTMLDivElement>(null);

  // Storage calculation helpers
  const storageUsed = storageQuota?.usedBytes ?? 0;
  const storageTotal = storageQuota?.totalBytes ?? 524288000; // default 500MB
  const storagePercentage = Math.min((storageUsed / storageTotal) * 100, 100);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'documents', label: 'Tài liệu', icon: FileText },
    { id: 'chatbot', label: 'AI Chatbot', icon: Bot },
    { id: 'favorites', label: 'Yêu thích', icon: Star },
    { id: 'trash', label: 'Thùng rác', icon: Trash2 },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setShowNewMenu(false);
      }
    };
    if (showNewMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNewMenu]);

  // Auto-initialize targetFolderId when modal is opened
  useEffect(() => {
    if (showImportModal) {
      const realFolders = folders.filter(fol => fol.type === 'folder');
      if (realFolders.length > 0) {
        setTargetFolderId(realFolders[0].id);
      } else {
        setTargetFolderId('');
      }
    }
  }, [showImportModal, folders]);

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-white border-r border-slate-200 flex flex-col p-4 z-50 overflow-y-auto select-none shadow-sm">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-1 py-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#1967d2] flex items-center justify-center shadow-lg shadow-[#1967d2]/15">
          <BookOpen className="text-white w-5 h-5 font-bold" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">AI Study Hub</h1>
          <p className="text-xs text-slate-500">Hệ thống học tập</p>
        </div>
      </div>

      {/* New Button (Google Drive style) */}
      <div className="relative mb-5" ref={newMenuRef}>
        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="w-full bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 shadow-sm rounded-2xl py-3 px-5 flex items-center gap-3 transition-all duration-200 cursor-pointer text-sm"
        >
          <Plus className="w-5 h-5 text-indigo-600" />
          <span>Mới</span>
          <ChevronDown className={`w-4 h-4 ml-auto text-slate-400 transition-transform duration-200 ${showNewMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {showNewMenu && (
          <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden animate-fade-in">
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
                    if (name.trim()) {
                      if (onCreateFolder) {
                        onCreateFolder(name.trim(), null);
                      } else {
                        toast.success(`Đã tạo thư mục: "${name.trim()}"`);
                      }
                    }
                    setDialogConfig(null);
                  }
                });
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left font-medium"
            >
              <FolderPlus className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span>Thư mục mới</span>
            </button>

            <div className="mx-3 my-1.5 border-t border-slate-100" />

            {/* File Upload */}
            <button
              onClick={() => {
                setShowNewMenu(false);
                openUploadModal();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left font-medium"
            >
              <FileUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <span>Tải tệp lên</span>
            </button>

            {/* Import Share Link */}
            <button
              onClick={() => {
                setShowNewMenu(false);
                setShowImportModal(true);
                if (folders.length > 0) {
                  setTargetFolderId(folders[0].id);
                } else {
                  setTargetFolderId('');
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer text-left font-medium"
            >
              <Link className="w-5 h-5 text-[#8083ff] flex-shrink-0" />
              <span>Nhập từ liên kết chia sẻ</span>
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
      <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-slate-100">
        {/* Storage Info */}
        <div className="px-3 py-2 mb-2 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-500 font-medium">Bộ nhớ lưu trữ</span>
            <span className="text-xs text-slate-700 font-semibold">{formatBytes(storageUsed)} / {formatBytes(storageTotal)}</span>
          </div>
          <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
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
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4">
          <div onClick={() => !importLoading && setShowImportModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
          
          <div className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl z-10 animate-fade-in">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Nhập từ liên kết chia sẻ</h3>
              <button 
                type="button" 
                disabled={importLoading}
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 disabled:opacity-50 cursor-pointer transition-colors"
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
                const trimmed = shareLink.trim();
                let token = trimmed;
                if (trimmed.includes('/shared/')) {
                  token = trimmed.split('/shared/').pop()?.split('?')[0] || trimmed;
                }
                
                const sharedDoc = await resolveShareToken(token);
                const fileRes = await fetch(sharedDoc.downloadUrl);
                if (!fileRes.ok) throw new Error('Không thể tải xuống tệp tin chia sẻ từ máy chủ.');
                const blob = await fileRes.blob();
                
                const fileTitle = sharedDoc.solution?.title || sharedDoc.title || 'Tài liệu chia sẻ';
                const fileExt = sharedDoc.solution?.fileExtension?.replace(/^\./, '') || 'pdf';
                const file = new File([blob], sharedDoc.solution?.fileName || sharedDoc.fileName || `${fileTitle}.${fileExt}`, {
                  type: blob.type
                });
                
                const newDoc = await uploadDocumentFile(
                  file,
                  fileTitle,
                  undefined,
                  sharedDoc.solution?.tags?.join(',') || sharedDoc.tags?.join(','),
                  true,
                  sharedDoc.solution?.description || sharedDoc.description,
                  targetFolderId || undefined
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
                  <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">Đang nhập tài liệu chia sẻ...</p>
                    <p className="text-xs text-slate-500 mt-1">Hệ thống đang tải dữ liệu và phân tích AI.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Share link input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                      Liên kết hoặc mã chia sẻ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shareLink}
                      onChange={(e) => setShareLink(e.target.value)}
                      placeholder="Ví dụ: sds hoặc https://.../shared/sds"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                    />
                  </div>

                  {/* Folder category selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                      Lưu vào thư mục <span className="text-red-500">*</span>
                    </label>
                    {folders.filter(fol => fol.type === 'folder').length === 0 ? (
                      <div className="w-full bg-amber-50 border border-amber-100 rounded-xl py-2.5 px-4 text-sm text-amber-600">
                        Chưa có thư mục nào được tạo. Bạn cần tạo thư mục trước để lưu tài liệu nhập vào.
                      </div>
                    ) : (
                      <select
                        required
                        value={targetFolderId}
                        onChange={(e) => setTargetFolderId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                      >
                        {folders.filter(fol => fol.type === 'folder').map((fol) => (
                          <option key={fol.id} value={fol.id}>
                            {fol.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Error display */}
                  {importError && (
                    <div className="bg-red-55 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
                      Lỗi: {importError}
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={importLoading}
                      onClick={() => setShowImportModal(false)}
                      className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm transition-all border border-slate-200 cursor-pointer shadow-sm"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={!shareLink.trim() || importLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
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
