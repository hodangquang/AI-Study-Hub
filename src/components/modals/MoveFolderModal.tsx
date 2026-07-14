import React, { useState } from 'react';
import { X, Folder, Search } from 'lucide-react';

interface MoveFolderModalProps {
  isOpen: boolean;
  folderId: string;
  folderName: string;
  folders: any[]; // All categories & folders in the system
  onConfirm: (targetParentId: string | null) => Promise<void>;
  onClose: () => void;
}

const MoveFolderModal: React.FC<MoveFolderModalProps> = ({
  isOpen,
  folderId,
  folderName,
  folders,
  onConfirm,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>('root'); // 'root' representing null
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Helper to check if folder A is a descendant of folder B (the one being moved)
  // to prevent cycles.
  const isDescendant = (candidateParentId: string, folderBeingMovedId: string): boolean => {
    let currentId: string | null = candidateParentId;
    while (currentId) {
      if (currentId === folderBeingMovedId) return true;
      const currentFolder = folders.find(f => f.id === currentId);
      currentId = currentFolder?.parentId || null;
    }
    return false;
  };

  // Filter folders: only show type === 'folder', and exclude folder itself
  const foldersList = folders.filter(f => f.type === 'folder' && f.id !== folderId);

  const filteredFolders = foldersList.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parentVal = selectedParentId === 'root' ? null : selectedParentId;
      await onConfirm(parentVal);
      onClose();
    } catch (err) {
      // Error handled by caller toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-[#000f21]/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in" 
      />

      {/* Modal Card */}
      <div className="relative bg-white border border-gray-200/80 rounded-2xl w-full max-w-[460px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] animate-scale-up text-gray-900 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-lg text-[#202124] tracking-tight">Di chuyển thư mục</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chọn thư mục đích để di chuyển "{folderName}"</p>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thư mục..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:bg-white focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/10 transition-all"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[300px]">
          {/* Root Option */}
          <label
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
              selectedParentId === 'root'
                ? 'bg-blue-50/50 border-[#1a73e8] text-[#1a73e8]'
                : 'bg-white border-gray-150 hover:bg-gray-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 shrink-0 text-[#1a73e8] fill-blue-50" />
              <div>
                <span className="text-sm font-semibold block">Thư mục gốc (Root)</span>
                <span className="text-[10px] text-gray-400 block">Thư mục cấp cao nhất</span>
              </div>
            </div>
            <input
              type="radio"
              name="targetFolder"
              value="root"
              checked={selectedParentId === 'root'}
              onChange={() => setSelectedParentId('root')}
              className="w-4 h-4 accent-[#1a73e8] cursor-pointer"
            />
          </label>

          {/* Dynamic Folders */}
          {filteredFolders.length > 0 ? (
            filteredFolders.map((f) => {
              const hasCycle = isDescendant(f.id, folderId);
              const isSelected = selectedParentId === f.id;

              return (
                <label
                  key={f.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 ${
                    hasCycle
                      ? 'bg-gray-50/80 border-gray-150 text-gray-400 cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'bg-blue-50/50 border-[#1a73e8] text-[#1a73e8] cursor-pointer'
                      : 'bg-white border-gray-150 hover:bg-gray-50/50 cursor-pointer'
                  }`}
                  title={hasCycle ? 'Không thể di chuyển thư mục vào bên trong chính nó hoặc thư mục con của nó' : ''}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Folder className={`w-5 h-5 shrink-0 ${hasCycle ? 'text-gray-300' : isSelected ? 'text-[#1a73e8]' : 'text-gray-500'}`} />
                    <div className="overflow-hidden">
                      <span className="text-sm font-semibold truncate block">{f.name}</span>
                      <span className="text-[10px] text-gray-400 block truncate">
                        {hasCycle ? 'Gây vòng lặp (Chặn)' : 'Khả dụng'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="targetFolder"
                    value={f.id}
                    disabled={hasCycle}
                    checked={isSelected}
                    onChange={() => setSelectedParentId(f.id)}
                    className="w-4 h-4 accent-[#1a73e8] cursor-pointer disabled:cursor-not-allowed"
                  />
                </label>
              );
            })
          ) : (
            searchQuery && (
              <div className="text-center py-8 text-gray-400 text-sm">
                Không tìm thấy thư mục nào phù hợp.
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="bg-transparent hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors cursor-pointer hover:underline disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white font-semibold py-2.5 px-6 rounded-full text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Đang di chuyển...' : 'Di chuyển'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveFolderModal;
