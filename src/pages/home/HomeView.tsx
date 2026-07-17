import React, { useState, useRef, useEffect } from 'react';
import { StudyDocument, StudyGroup } from '@/types';
import { AuthUser } from '@/types/auth';
import {
  Folder,
  FileText,
  Star,
  MoreVertical,
  Grid,
  List,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Users,
  Bot,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
  FileSpreadsheet,
  FileVideo,
  FileImage,
  Layers,
  FileCheck,
  UserPlus,
  Link,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  bookmarkDocumentOnBackend,
  unbookmarkDocumentOnBackend,
  deleteDocumentOnBackend,
  downloadDocumentFile,
  updateDocumentMetadata,
  createDocumentShareLink,
  renameFolderOnBackend
} from '@/services/documentsApi';
import CustomDialog from '@/components/ui/CustomDialog';
import ShareModal from '@/components/modals/ShareModal';

interface HomeViewProps {
  documents: StudyDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<StudyDocument[]>>;
  folders: any[];
  setFolders: React.Dispatch<React.SetStateAction<any[]>>;
  groups: StudyGroup[];
  setActiveTab: (tab: string) => void;
  onOpenAIOverlay: (doc: StudyDocument) => void;
  openUploadModal: () => void;
  currentUser: AuthUser | null;
  setCurrentFolderId: (id: string | null) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  documents,
  setDocuments,
  folders,
  setFolders,
  groups,
  setActiveTab,
  onOpenAIOverlay,
  openUploadModal,
  currentUser,
  setCurrentFolderId
}) => {
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Share modal state
  const [activeShareDoc, setActiveShareDoc] = useState<StudyDocument | null>(null);

  // Custom dialog config state
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when click outside or scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    const handleScroll = () => {
      closeDropdown();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const closeDropdown = () => {
    setOpenDropdownId(null);
    setDropdownCoords(null);
  };

  const toggleDropdown = (e: React.MouseEvent, id: string, type: 'folder' | 'file') => {
    e.stopPropagation();
    if (openDropdownId === id) {
      closeDropdown();
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const isFolder = type === 'folder';
      const dropdownWidth = isFolder ? 176 : 192;
      const dropdownHeight = isFolder ? 120 : 240;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      const top = openUpward ? rect.top - dropdownHeight - 6 : rect.bottom + 6;
      const left = rect.right - dropdownWidth;

      setDropdownCoords({ top, left });
      setOpenDropdownId(id);
    }
  };

  // Filter out deleted documents and show only user's own documents
  const activeDocs = documents.filter(d => !d.isDeleted && (!currentUser || d.uploaderId === currentUser.id));

  // Suggested documents (limit to 6 for clean view, or show more if needed)
  const suggestedDocs = activeDocs.slice(0, 6);

  // Folders for suggestions
  const suggestedFolders = folders.slice(0, 5);

  const handleFolderClick = (folder: any) => {
    if (folder.type === 'folder') {
      setCurrentFolderId(folder.id);
    } else {
      setCurrentFolderId(null);
    }
    setActiveTab('documents');
  };

  const toggleFavorite = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    try {
      if (doc.isFavorite) {
        await unbookmarkDocumentOnBackend(docId);
        toast.success(`Đã bỏ yêu thích tài liệu "${doc.title}".`);
      } else {
        await bookmarkDocumentOnBackend(docId);
        toast.success(`Đã thêm tài liệu "${doc.title}" vào thư mục yêu thích.`);
      }
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isFavorite: !d.isFavorite } : d));
    } catch (err) {
      console.error(err);
      toast.error('Không thể thực hiện tác vụ yêu thích trên máy chủ.');
    }
    closeDropdown();
  };

  const deleteDocument = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    closeDropdown();
    setDialogConfig({
      title: 'Xóa tài liệu',
      message: 'Bạn có chắc chắn muốn xóa tài liệu này?',
      showInput: true,
      defaultValue: 'No longer needed',
      inputPlaceholder: 'Nhập lý do xóa (tùy chọn)',
      confirmLabel: 'Xóa',
      isDanger: true,
      onConfirm: async (reason) => {
        try {
          await deleteDocumentOnBackend(docId, reason.trim() || 'No longer needed');
          setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isDeleted: true } : d));
          toast.success('Xóa tài liệu thành công.');
        } catch (err) {
          console.error(err);
          toast.error('Không thể xóa tài liệu trên máy chủ.');
        }
        setDialogConfig(null);
      }
    });
  };

  const handleShare = (e: React.MouseEvent | React.TouchEvent, doc: StudyDocument) => {
    e.stopPropagation();
    closeDropdown();
    setActiveShareDoc(doc);
  };

  const handleCopyShareLink = async (doc: StudyDocument) => {
    closeDropdown();
    const toastId = toast.loading(`Đang cấu hình và sao chép liên kết chia sẻ cho "${doc.title}"...`);
    try {
      const result = await createDocumentShareLink(doc.id, {});
      const shareUrl = `${window.location.origin}/shared/${result.token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.update(toastId, {
        render: `Đã tạo và sao chép liên kết chia sẻ cho "${doc.title}"!`,
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (err: any) {
      console.error(err);
      toast.update(toastId, {
        render: err.message || 'Lỗi khi tạo liên kết chia sẻ.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  const handleDownload = async (e: React.MouseEvent | React.TouchEvent, doc: StudyDocument) => {
    e.stopPropagation();
    closeDropdown();
    if (downloadingId === doc.id) return;
    setDownloadingId(doc.id);
    try {
      await downloadDocumentFile(doc.id, `${doc.title}.${doc.type}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể tải tài liệu xuống.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRenameDocument = (e: React.MouseEvent | React.TouchEvent, doc: StudyDocument) => {
    e.stopPropagation();
    closeDropdown();
    setDialogConfig({
      title: 'Rename',
      showInput: true,
      defaultValue: doc.title,
      inputPlaceholder: 'Nhập tiêu đề mới cho tài liệu',
      confirmLabel: 'OK',
      onConfirm: async (newTitle) => {
        if (!newTitle.trim()) {
          toast.warn('Tiêu đề tài liệu không được để trống.');
          return;
        }
        try {
          const updatedDoc = await updateDocumentMetadata(doc.id, { title: newTitle.trim() });
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, title: updatedDoc.title } : d));
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || 'Không thể cập nhật tên tài liệu.');
        }
        setDialogConfig(null);
      }
    });
  };

  const getOwnerName = (doc: StudyDocument) => {
    if (doc.ownerName) {
      if (currentUser && (doc.ownerName === currentUser.fullName || doc.uploaderId === currentUser.id)) {
        return 'tôi';
      }
      return doc.ownerName;
    }
    if (currentUser && doc.uploaderId === currentUser.id) {
      return 'tôi';
    }
    if (doc.category === 'chuyên ngành') {
      return doc.id === 'doc-3' ? 'Nguyễn Minh Sang' : 'Doan Minh Tuan';
    }
    return 'tôi';
  };

  const getOwnerAvatar = (doc: StudyDocument) => {
    if (currentUser && (doc.ownerName === currentUser.fullName || doc.uploaderId === currentUser.id)) {
      return currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=8083ff&color=fff`;
    }
    if (doc.ownerAvatar) {
      return doc.ownerAvatar;
    }
    if (doc.ownerName) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.ownerName)}&background=8083ff&color=fff`;
    }
    if (doc.category === 'chuyên ngành') {
      return doc.id === 'doc-3'
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCurRcJlaif8Yhf6hIhG67akxJQyYFcLaj1CwxQceRp1c8UN0goWFuTOxbWgEOv5_RqOp06QWJg_xlAYtdkbRYtP-Eyvr3lsiXLKtBf8bF-ajOTvTtGeSsHQEdVPz2PY_L_M3bpZbujM9D5GQKXbTSD1-Bc4xFYpMpJKOuW7jlR28Aq82DAYU9R_ClyujlWegPif_mRbDDn8ByAM4q2gWDXfFmJa9cL6_DI4s1xx1yueaErBQyWagoOaKS8u3Kyk0S_5DX2CC9xInk'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsQCm4zAGFdAxBch1jEAeTmQid4YD6qNBw_MMHoWo9KTiDsGRyYJYevSg9JKBC5CsUw_60ABOywRRz69IicyyK-uqJpH9YTRKdxUypOve878SQ-b56LFdGgtIG_fGLNQDCTCc1q9jr8gdubP3460gsDyrUdJgUngET-RZuEjEmzSsXYbnvcvpE0dbX7a4H2s5QVVmHPNQZpoZ7ZKNNdUB-88ZrfOQR84MCIXBi5LQhp9b3qM4yCZlDN3t3N1IIQ3pSNRMXy1GF-2U';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeIu6X_afgo0vR2SyhbuSVUPmFvww6JkOg3XzHDAjc643Po6akVAWkf66j78HU4nMeWT_zYrV7G3ubOiXfCJ6NTTm-Eyg8NOvdnON7q3-g1sqdByG54wr0mNMVmq4wPacZPkx-SJ9GA0yFopr8NLjGyFSG6U18oe6FmeEpapgkWoTwM7BLBIF2fiv6m8GaZ1iBYccOQ3Tw0-ZBxRaI5uqBFfq64ptKenlRLQE5bpJ27Tog19EvrhNoC8oI7Qnw8tZU309Xs5lfnGM';
  };

  const getDocLocation = (doc: StudyDocument) => {
    if (doc.category === 'chuyên ngành') {
      return doc.id === 'doc-3' ? 'Marketing Team' : 'CNTT K22';
    }
    return 'Drive của tôi';
  };

  // Custom CSS Stylized Previews for different file types
  const DEFAULT_COVER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbbfocjEbKOTSLbClyGfNcRHx-H896PSMtke6hQIXBawzeKwhv-EUXyRzlFl8fUiC8P5iu1kTqN479491dS4-KkH7C-FVedKwXdJQID_pive5sCEt9aKJ9ZqJ9_qogM4gmOXLNwnJTtYHpIXbBBC5Gw876d67hYrNTZSZQbc3cqeNa7bRpdeKY_owqRW7Xf6DQ7AD7LJU6rdWuawmmgYj3kE8gP-N6sMNj395nlFOVyko6CJwZV4YzFjeB2-4snqAFXY40vzWS2NY';

  return (
    <div className="space-y-8 animate-fade-in" ref={dropdownRef}>

      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#e0e3e7] rounded-2xl p-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f0fe] text-[#1967d2] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Study Hub Premium</span>
          </div>
          <h2 className="text-2xl font-bold text-[#202124]">Chào mừng bạn đến với AI Study Hub</h2>
          <p className="text-sm text-[#5f6368] leading-relaxed">
            Hôm nay bạn muốn học tập gì nào? Hệ thống đã sẵn sàng hỗ trợ tóm tắt tài liệu, giải bài tập và đồng hành cùng nhóm của bạn.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={openUploadModal}
            className="flex-1 md:flex-none bg-[#1967d2] hover:bg-[#1557b0] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm shadow-[#1967d2]/15 cursor-pointer text-center"
          >
            Tải tài liệu mới
          </button>
          <button
            onClick={() => setActiveTab('chatbot')}
            className="flex-1 md:flex-none bg-white hover:bg-[#f8fafd] text-[#1967d2] border border-[#d2e3fc] text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-center"
          >
            Hỏi Trợ lý AI
          </button>
        </div>
      </div>

      {/* 1. Suggested Folders Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-[#202124] flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#5f6368]" />
            Thư mục gợi ý
          </h3>
          <button
            onClick={() => setActiveTab('groups')}
            className="text-xs text-[#1967d2] hover:underline font-semibold flex items-center gap-1"
          >
            Xem tất cả nhóm <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {suggestedFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className="bg-white border border-[#e0e3e7] hover:border-[#c7d2fe] hover:shadow-sm rounded-xl p-3.5 flex flex-col justify-between relative group cursor-pointer transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ color: folder.color, backgroundColor: `${folder.color}15` }}
                >
                  <Folder className="w-6.5 h-6.5 fill-current" />
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => toggleDropdown(e, folder.id, 'folder')}
                    className="p-1 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Folder Dropdown */}
                  {openDropdownId === folder.id && dropdownCoords && (
                    <div
                      ref={dropdownRef}
                      className="fixed w-44 bg-white border border-[#e0e3e7] rounded-lg shadow-lg z-50 py-1 text-left"
                      style={{
                        top: `${dropdownCoords.top}px`,
                        left: `${dropdownCoords.left}px`,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFolderClick(folder);
                          closeDropdown();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[#5f6368]" />
                        Mở thư mục
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          closeDropdown();
                          setDialogConfig({
                            title: 'Rename',
                            showInput: true,
                            defaultValue: folder.name,
                            inputPlaceholder: 'Nhập tên mới cho thư mục',
                            confirmLabel: 'OK',
                            onConfirm: async (newName) => {
                              if (newName.trim()) {
                                try {
                                  await renameFolderOnBackend(folder.id, newName.trim());
                                  setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, name: newName.trim() } : f));
                                  toast.success('Đổi tên thư mục thành công.');
                                } catch (err: any) {
                                  console.error(err);
                                  toast.error(err.message || 'Không thể đổi tên thư mục.');
                                }
                              }
                              setDialogConfig(null);
                            }
                          });
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                      >
                        <Folder className="w-3.5 h-3.5 text-[#5f6368]" />
                        Đổi tên
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-[#202124] truncate group-hover:text-[#1967d2] transition-colors">
                  {folder.name}
                </h4>
                <p className="text-[11px] text-[#5f6368] mt-0.5 font-medium">
                  {folder.type === 'category' ? 'Drive của tôi' : 'Nhóm học tập'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Suggested Files Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b border-[#e0e3e7] pb-3">
          <h3 className="text-base font-bold text-[#202124] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5f6368]" />
            Tệp gợi ý
          </h3>

          {/* Layout Mode Toggles */}
          <div className="flex items-center gap-2">
            <div className="bg-[#f1f3f4] border border-[#e0e3e7] rounded-lg p-0.5 flex">
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${layoutMode === 'grid' ? 'bg-white text-[#1967d2] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
                title="Dạng lưới"
              >
                <Grid className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${layoutMode === 'list' ? 'bg-white text-[#1967d2] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
                title="Dạng danh sách"
              >
                <List className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {suggestedDocs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#e0e3e7]">
            <p className="text-sm text-[#5f6368]">Chưa có tài liệu nào gợi ý.</p>
            <button
              onClick={openUploadModal}
              className="text-xs text-[#1967d2] font-semibold underline mt-2 block mx-auto cursor-pointer"
            >
              Tải lên tài liệu mới ngay
            </button>
          </div>
        ) : layoutMode === 'grid' ? (
          /* GRID VIEW WITH FAVORITES DESIGN */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {suggestedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onOpenAIOverlay(doc)}
                className="bg-white border border-[#e0e3e7] hover:border-[#c7d2fe]/60 rounded-xl flex flex-col group transition-all duration-300 cursor-pointer hover:shadow-md relative overflow-hidden"
              >
                {/* 1. Cover Box */}
                <div className="relative h-40 bg-[#f1f3f4] overflow-hidden">
                  <img
                    alt={doc.title}
                    className="w-full h-full object-cover opacity-95 group-hover:scale-[1.03] group-hover:opacity-100 transition-all duration-500"
                    src={(doc as any).thumbnailUrl || DEFAULT_COVER}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_COVER;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent" />

                  {/* Star toggle */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(e, doc.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-red-50 backdrop-blur-md rounded-full transition-colors border border-[#e0e3e7] cursor-pointer"
                      title={doc.isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    >
                      <Star className={`w-4 h-4 ${doc.isFavorite ? 'fill-[#1967d2] text-[#1967d2]' : 'text-[#5f6368]'}`} />
                    </button>
                  </div>

                  {/* File ext badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-[#f1f3f4] text-[#5f6368] px-2 py-0.5 rounded text-[9px] font-bold border border-[#e0e3e7] uppercase tracking-widest">
                      {doc.type}
                    </span>
                  </div>

                  {/* Quick Action Overlay (Glassmorphic look) */}
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAIOverlay(doc);
                      }}
                      className="bg-[#1967d2] hover:bg-[#1557b0] text-white rounded-full p-2.5 shadow-md flex items-center justify-center transition-all cursor-pointer scale-90 group-hover:scale-100"
                      title="Xem AI tóm tắt"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDownload(e, doc)}
                      className="bg-white hover:bg-gray-100 text-[#5f6368] hover:text-[#202124] rounded-full p-2.5 shadow-md flex items-center justify-center transition-all cursor-pointer scale-90 group-hover:scale-100"
                      title="Tải xuống"
                      disabled={downloadingId === doc.id}
                    >
                      {downloadingId === doc.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-[#1967d2]" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Document Description Body */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-sm text-[#202124] group-hover:text-[#1967d2] line-clamp-2 leading-relaxed">
                      {doc.title}
                    </h3>

                    {/* Options Trigger */}
                    <div className="relative">
                      <button
                        onClick={(e) => toggleDropdown(e, doc.id, 'file')}
                        className="p-1 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] transition-colors shrink-0 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === doc.id && dropdownCoords && (
                        <div
                          ref={dropdownRef}
                          className="fixed w-48 bg-white border border-[#e0e3e7] rounded-lg shadow-lg z-50 py-1 text-left"
                          style={{
                            top: `${dropdownCoords.top}px`,
                            left: `${dropdownCoords.left}px`,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAIOverlay(doc);
                              closeDropdown();
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#1967d2]" />
                            Tóm tắt & Hỏi AI
                          </button>
                          <button
                            onClick={(e) => toggleFavorite(e, doc.id)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                          >
                            <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-[#ff9900] text-[#ff9900]' : 'text-[#5f6368]'}`} />
                            {doc.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                          </button>
                          <button
                            onClick={(e) => handleShare(e, doc)}
                            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              <UserPlus className="w-3.5 h-3.5 text-[#5f6368]" />
                              <span>Chia sẻ</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">Ctrl+Alt+A</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyShareLink(doc);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                          >
                            <Link className="w-3.5 h-3.5 text-[#5f6368]" />
                            <span>Sao chép liên kết</span>
                          </button>
                          <button
                            onClick={(e) => handleDownload(e, doc)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                            disabled={downloadingId === doc.id}
                          >
                            {downloadingId === doc.id ? (
                              <RefreshCw className="w-3.5 h-3.5 text-[#1967d2] animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-[#5f6368]" />
                            )}
                            {downloadingId === doc.id ? 'Đang tải xuống...' : 'Tải xuống'}
                          </button>
                          <button
                            onClick={(e) => handleRenameDocument(e, doc)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5 text-[#5f6368]" />
                            Đổi tên
                          </button>
                          <div className="border-t border-[#e0e3e7] my-1" />
                          <button
                            onClick={(e) => deleteDocument(e, doc.id)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            Xóa tài liệu
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags (if any) */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] bg-[#e8f0fe] text-[#1967d2] px-2 py-0.5 rounded-full font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description (Note) */}
                  {doc.description && doc.description.trim() && !['pdf', 'docx', 'pptx', 'txt'].includes(doc.description.trim().toLowerCase()) && (
                    <div className="flex items-start gap-1.5 bg-[#f8fafd] border-l-2 border-[#1967d2] rounded-r-md px-2.5 py-2 text-xs text-[#5f6368]">
                      <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0 text-[#1967d2]" />
                      <span className="line-clamp-2">{doc.description}</span>
                    </div>
                  )}

                  {/* Owner (Uploader) details */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#5f6368] select-none pt-1">
                    <img
                      src={getOwnerAvatar(doc)}
                      alt="Owner"
                      className="w-5 h-5 rounded-full border border-gray-200 object-cover shrink-0"
                    />
                    <span className="truncate">
                      {getOwnerName(doc) === 'tôi' ? 'Bạn đã tải lên' : `Được chia sẻ bởi ${getOwnerName(doc)}`}
                    </span>
                  </div>

                  {/* Footer metadata */}
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#e0e3e7]">
                    <span className="text-[11px] text-[#5f6368]/80">
                      {doc.size}
                    </span>
                    <span className="text-[11px] text-[#5f6368]/80">
                      {doc.lastModified}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW WITH ALL GOOGLE DRIVE COLUMNS */
          <div className="bg-white border border-[#e0e3e7] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#e0e3e7] text-xs text-[#5f6368] font-bold bg-[#f8fafd]/80 select-none">
                    <th className="py-3 px-4 font-semibold">Tên</th>
                    <th className="py-3 px-4 font-semibold">Lý do gợi ý</th>
                    <th className="py-3 px-4 font-semibold">Chủ sở hữu</th>
                    <th className="py-3 px-4 font-semibold">Vị trí</th>
                    <th className="py-3 px-4 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4] text-sm text-[#202124]">
                  {suggestedDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => onOpenAIOverlay(doc)}
                      className="hover:bg-[#f8fafd] transition-colors cursor-pointer group"
                    >
                      {/* Name Column */}
                      <td className="py-3 px-4 font-medium max-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-[9px]"
                            style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                          >
                            {doc.type.toUpperCase()}
                          </div>
                          <span className="truncate group-hover:text-[#1967d2] transition-colors" title={doc.title}>
                            {doc.title}
                          </span>
                        </div>
                      </td>

                      {/* Reason Column */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        {doc.lastModified === 'Vừa tải lên' ? 'Bạn đã tải lên gần đây' : `Được sửa đổi ${doc.lastModified.replace('Sửa ', '')}`}
                      </td>

                      {/* Owner Column */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        <div className="flex items-center gap-2">
                          <img
                            src={getOwnerAvatar(doc)}
                            alt="Avatar"
                            className="w-5 h-5 rounded-full border border-gray-200 object-cover"
                          />
                          <span>{getOwnerName(doc) === 'tôi' ? 'tôi' : getOwnerName(doc)}</span>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        <div className="flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5 text-[#5f6368] fill-gray-100" />
                          <span>{getDocLocation(doc)}</span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1">
                          {/* Star toggle */}
                          <button
                            onClick={(e) => toggleFavorite(e, doc.id)}
                            className="p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#ff9900]"
                          >
                            <Star className={`w-4 h-4 ${doc.isFavorite ? 'fill-[#ff9900] text-[#ff9900]' : ''}`} />
                          </button>

                          {/* Quick AI overlay open */}
                          <button
                            onClick={() => onOpenAIOverlay(doc)}
                            className="p-1.5 rounded-full text-[#1967d2] hover:bg-[#e8f0fe]"
                            title="AI Phân tích"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Settings menu dropdown */}
                          <div>
                            <button
                              onClick={(e) => toggleDropdown(e, doc.id, 'file')}
                              className="p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openDropdownId === doc.id && dropdownCoords && (
                              <div
                                ref={dropdownRef}
                                className="fixed w-48 bg-white border border-[#e0e3e7] rounded-lg shadow-lg z-50 py-1 text-left"
                                style={{
                                  top: `${dropdownCoords.top}px`,
                                  left: `${dropdownCoords.left}px`,
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenAIOverlay(doc);
                                    closeDropdown();
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#1967d2]" />
                                  Tóm tắt & Hỏi AI
                                </button>
                                <button
                                  onClick={(e) => toggleFavorite(e, doc.id)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                  <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-[#ff9900] text-[#ff9900]' : 'text-[#5f6368]'}`} />
                                  {doc.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                                </button>
                                <button
                                  onClick={(e) => handleShare(e, doc)}
                                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <UserPlus className="w-3.5 h-3.5 text-[#5f6368]" />
                                    <span>Chia sẻ</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-medium">Ctrl+Alt+A</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyShareLink(doc);
                                  }}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                  <Link className="w-3.5 h-3.5 text-[#5f6368]" />
                                  <span>Sao chép liên kết</span>
                                </button>
                                <button
                                  onClick={(e) => handleDownload(e, doc)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                                  disabled={downloadingId === doc.id}
                                >
                                  {downloadingId === doc.id ? (
                                    <RefreshCw className="w-3.5 h-3.5 text-[#1967d2] animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5 text-[#5f6368]" />
                                  )}
                                  {downloadingId === doc.id ? 'Đang tải xuống...' : 'Tải xuống'}
                                </button>
                                <button
                                  onClick={(e) => handleRenameDocument(e, doc)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5 text-[#5f6368]" />
                                  Đổi tên
                                </button>
                                <div className="border-t border-[#e0e3e7] my-1" />
                                <button
                                  onClick={(e) => deleteDocument(e, doc.id)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  Xóa tài liệu
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      {activeShareDoc && (
        <ShareModal
          isOpen={activeShareDoc !== null}
          documentId={activeShareDoc.id}
          documentTitle={activeShareDoc.title}
          onClose={() => setActiveShareDoc(null)}
        />
      )}
    </div>
  );
};

export default HomeView;
