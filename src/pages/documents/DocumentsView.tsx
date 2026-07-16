import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StudyDocument } from '@/types';
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
  ChevronDown,
  Info,
  X,
  UserPlus,
  FolderOpen,
  Layers,
  FileCheck,
  MoreHorizontal,
  Search,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Link
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  bookmarkDocumentOnBackend,
  unbookmarkDocumentOnBackend,
  deleteDocumentOnBackend,
  downloadDocumentFile,
  fetchDocumentsWithParams,
  fetchCategories,
  updateDocumentMetadata,
  createDocumentShareLink,
  renameFolderOnBackend,
  deleteFolderOnBackend,
  fetchFolderContents,
  fetchFolderBreadcrumb,
  moveFolderOnBackend,
  type FetchDocumentsMeta,
  type BackendCategory
} from '@/services/documentsApi';
import CustomDialog from '@/components/ui/CustomDialog';
import ShareModal from '@/components/modals/ShareModal';
import Loader from '@/components/Loader';
import MoveFolderModal from '@/components/modals/MoveFolderModal';

interface DocumentsViewProps {
  documents: StudyDocument[];
  searchQuery: string;
  setDocuments: React.Dispatch<React.SetStateAction<StudyDocument[]>>;
  folders: any[];
  setFolders: React.Dispatch<React.SetStateAction<any[]>>;
  onOpenAIOverlay: (doc: StudyDocument) => void;
  openUploadModal: () => void;
  currentUser: AuthUser | null;
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
}

interface MockFolder {
  id: string;
  name: string;
  owner: string;
  dateModified: string;
  size: string;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  searchQuery,
  setDocuments,
  folders,
  setFolders,
  onOpenAIOverlay,
  openUploadModal,
  currentUser,
  currentFolderId,
  setCurrentFolderId
}) => {

  // Layout state
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

  // Selection states
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'folder' | 'file' | null>(null);

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  // Download in-progress state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [moveFolderTarget, setMoveFolderTarget] = useState<{ id: string; name: string } | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);

  // ─── API-driven filter / sort / page states ────────────────────────────────
  const [localSearch, setLocalSearch] = useState(searchQuery);     // debounced input
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'title' | 'viewCount' | 'downloadCount'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const PAGE_LIMIT = 20;

  // Server-side results
  const [filteredDocs, setFilteredDocs] = useState<StudyDocument[]>([]);
  const [meta, setMeta] = useState<FetchDocumentsMeta>({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 });
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Folder contents navigation states
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [folderContentsFolders, setFolderContentsFolders] = useState<any[]>([]);

  // Categories for filter pill
  const [categories, setCategories] = useState<BackendCategory[]>([]);

  // UI Dropdowns
  const [activePillDropdown, setActivePillDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Load categories once ─────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => { });
  }, []);

  // ─── Keep localSearch in sync with outer searchQuery prop ─────────────────
  useEffect(() => { setLocalSearch(searchQuery); }, [searchQuery]);

  // ─── Debounce search → reset page ─────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 350);
    return () => clearTimeout(t);
  }, [localSearch]);

  // ─── Fetch from real API whenever filters change ───────────────────────────
  const loadDocs = useCallback(async () => {
    setApiLoading(true);
    setApiError('');
    try {
      if (currentFolderId) {
        const [contentsResult, breadcrumbsResult] = await Promise.all([
          fetchFolderContents({
            folderId: currentFolderId,
            q: localSearch.trim() || undefined,
            sortBy,
            order,
          }),
          fetchFolderBreadcrumb(currentFolderId).catch(() => [])
        ]);
        const myDocs = contentsResult.documents.filter(doc =>
          !currentUser || doc.uploaderId === currentUser.id
        );
        setFilteredDocs(myDocs);
        setFolderContentsFolders(contentsResult.folders.map((f, i) => ({
          id: f.id,
          name: f.name,
          owner: 'me',
          dateModified: 'Vừa tải',
          size: '—',
          color: ['#10b981', '#f59e0b', '#ffb783', '#c0c1ff', '#8b5cf6'][i % 5] || '#1967d2',
          bg: '#f0fdf4',
          type: 'folder',
          parentId: f.parentId
        })));
        setBreadcrumbs(breadcrumbsResult.length > 0 ? breadcrumbsResult : contentsResult.breadcrumbs);
        setMeta({ page: 1, limit: PAGE_LIMIT, total: myDocs.length, totalPages: 1 });
      } else {
        const result = await fetchDocumentsWithParams({
          q: localSearch.trim() || undefined,
          categoryId: filterCategoryId || undefined,
          sortBy,
          order,
          page,
          limit: PAGE_LIMIT,
        });
        const myDocs = result.docs.filter(doc =>
          (!currentUser || doc.uploaderId === currentUser.id) &&
          (localSearch.trim() || !doc.folderId)
        );
        setFilteredDocs(myDocs);
        setMeta({ ...result.meta, total: myDocs.length });
        setBreadcrumbs([]);
        setFolderContentsFolders([]);
        setDocuments(myDocs);
      }
    } catch (e: any) {
      setApiError(e.message || 'Lỗi khi tải tài liệu.');
    } finally {
      setTimeout(() => {
        setApiLoading(false);
      }, 1000);
    }
  }, [localSearch, filterCategoryId, sortBy, order, page, currentFolderId]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  useEffect(() => {
    loadDocs();
  }, [documents.length]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePillDropdown(null);
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

  // ─── Owner helpers ─────────────────────────────────────────────────────────
  const getOwnerName = (doc: StudyDocument) => {
    if (doc.ownerName) {
      if (currentUser && (doc.ownerName === currentUser.fullName || doc.uploaderId === currentUser.id)) return 'tôi';
      return doc.ownerName;
    }
    if (currentUser && doc.uploaderId === currentUser.id) return 'tôi';
    return 'tôi';
  };

  const getOwnerAvatar = (doc: StudyDocument) => {
    if (currentUser && (doc.ownerName === currentUser.fullName || doc.uploaderId === currentUser.id)) {
      return currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=8083ff&color=fff`;
    }
    if (doc.ownerAvatar) return doc.ownerAvatar;
    if (doc.ownerName) return `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.ownerName)}&background=8083ff&color=fff`;
    return `https://ui-avatars.com/api/?name=U&background=8083ff&color=fff`;
  };

  // Folders are still filtered client-side (from parent state or folder contents)
  const filteredFolders = currentFolderId
    ? folderContentsFolders.filter(fol =>
        fol.name.toLowerCase().includes(localSearch.toLowerCase())
      )
    : folders.filter(fol =>
        fol.name.toLowerCase().includes(localSearch.toLowerCase())
      );

  // State modification synchronizers
  const toggleFavorite = async (e: React.MouseEvent | React.TouchEvent, docId: string) => {
    e.stopPropagation();
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    try {
      if (doc.isFavorite) {
        await unbookmarkDocumentOnBackend(docId);
      } else {
        await bookmarkDocumentOnBackend(docId);
      }
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isFavorite: !d.isFavorite } : d));
    } catch (err) {
      console.error(err);
      toast.error('Không thể thực hiện tác vụ yêu thích trên máy chủ.');
    }
    closeDropdown();
  };

  const deleteDocument = (e: React.MouseEvent | React.TouchEvent, docId: string) => {
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
          if (selectedItemId === docId) {
            setSelectedItemId(null);
            setSelectedItemType(null);
          }
        } catch (err) {
          console.error(err);
          toast.error('Không thể xóa tài liệu trên máy chủ.');
        }
        setDialogConfig(null);
      }
    });
  };

  const deleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    closeDropdown();
    setDialogConfig({
      title: 'Xóa thư mục',
      message: 'Bạn có chắc chắn muốn xóa thư mục này?',
      confirmLabel: 'Xóa',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteFolderOnBackend(folderId);
          setFolders(prev => prev.filter(f => f.id !== folderId));
          setFolderContentsFolders(prev => prev.filter(f => f.id !== folderId));
          if (selectedItemId === folderId) {
            setSelectedItemId(null);
            setSelectedItemType(null);
          }
          if (currentFolderId === folderId || breadcrumbs.some(b => b.id === folderId)) {
            setCurrentFolderId(null);
          }
          toast.success('Xóa thư mục thành công.');
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || 'Không thể xóa thư mục trên máy chủ.');
        }
        setDialogConfig(null);
      }
    });
  };

  const handleMoveFolderConfirm = async (targetParentId: string | null) => {
    if (!moveFolderTarget) return;
    const { id, name } = moveFolderTarget;
    try {
      await moveFolderOnBackend(id, targetParentId);
      toast.success(`Đã di chuyển thư mục "${name}" thành công.`);
      loadDocs();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể di chuyển thư mục.');
      throw err;
    }
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

  const handleDownload = async (
    e: React.MouseEvent | React.TouchEvent,
    doc: StudyDocument
  ) => {
    e.stopPropagation();
    closeDropdown();
    if (downloadingId === doc.id) return; // already downloading
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
          setFilteredDocs(prev => prev.map(d => d.id === doc.id ? { ...d, title: updatedDoc.title } : d));
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || 'Không thể cập nhật tên tài liệu.');
        }
        setDialogConfig(null);
      }
    });
  };

  const handleSelect = (e: React.MouseEvent, id: string, type: 'folder' | 'file') => {
    e.stopPropagation();
    if (selectedItemId === id) {
      // Toggle off if clicked again
      setSelectedItemId(null);
      setSelectedItemType(null);
    } else {
      setSelectedItemId(id);
      setSelectedItemType(type);
    }
  };

  const handleClearSelection = () => {
    setSelectedItemId(null);
    setSelectedItemType(null);
  };

  const getSelectedName = () => {
    if (!selectedItemId) return '';
    if (selectedItemType === 'folder') {
      return folders.find(f => f.id === selectedItemId)?.name || '';
    } else {
      return documents.find(d => d.id === selectedItemId)?.title || '';
    }
  };

  const triggerSelectedAction = async (action: 'share' | 'download' | 'delete' | 'star') => {
    if (!selectedItemId) return;
    const name = getSelectedName();

    if (action === 'share') {
      if (selectedItemType === 'file') {
        const doc = documents.find(d => d.id === selectedItemId);
        if (doc) {
          setActiveShareDoc(doc);
        }
      } else {
        toast.info('Tính năng chia sẻ thư mục sẽ sớm ra mắt.');
      }
    } else if (action === 'download') {
      if (selectedItemType === 'file') {
        const doc = documents.find(d => d.id === selectedItemId);
        if (doc) {
          setDownloadingId(doc.id);
          try {
            await downloadDocumentFile(doc.id, `${doc.title}.${doc.type}`);
          } catch (err: any) {
            toast.error(err.message || 'Không thể tải xuống.');
          } finally {
            setDownloadingId(null);
          }
        }
      }
    } else if (action === 'delete') {
      if (selectedItemType === 'folder') {
        setDialogConfig({
          title: 'Xóa thư mục',
          message: `Bạn có chắc muốn xóa thư mục "${name}"?`,
          confirmLabel: 'Xóa',
          isDanger: true,
          onConfirm: async () => {
            try {
              await deleteFolderOnBackend(selectedItemId);
              setFolders(prev => prev.filter(f => f.id !== selectedItemId));
              setFolderContentsFolders(prev => prev.filter(f => f.id !== selectedItemId));
              if (currentFolderId === selectedItemId || breadcrumbs.some(b => b.id === selectedItemId)) {
                setCurrentFolderId(null);
              }
              setSelectedItemId(null);
              setSelectedItemType(null);
              toast.success('Xóa thư mục thành công.');
            } catch (err: any) {
              console.error(err);
              toast.error(err.message || 'Không thể xóa thư mục trên máy chủ.');
            }
            setDialogConfig(null);
          }
        });
      } else {
        setDialogConfig({
          title: 'Xóa tài liệu',
          message: `Bạn có chắc muốn di chuyển tài liệu "${name}" vào Thùng rác?`,
          confirmLabel: 'Xóa',
          isDanger: true,
          onConfirm: async () => {
            try {
              await deleteDocumentOnBackend(selectedItemId);
              setDocuments(prev => prev.map(d => d.id === selectedItemId ? { ...d, isDeleted: true } : d));
              setSelectedItemId(null);
              setSelectedItemType(null);
            } catch (err) {
              console.error(err);
              toast.error('Không thể xóa tài liệu trên máy chủ.');
            }
            setDialogConfig(null);
          }
        });
      }
    } else if (action === 'star') {
      if (selectedItemType === 'file') {
        const doc = documents.find(d => d.id === selectedItemId);
        if (!doc) return;
        try {
          if (doc.isFavorite) {
            await unbookmarkDocumentOnBackend(selectedItemId);
          } else {
            await bookmarkDocumentOnBackend(selectedItemId);
          }
          setDocuments(prev => prev.map(d => d.id === selectedItemId ? { ...d, isFavorite: !d.isFavorite } : d));
        } catch (err) {
          console.error(err);
          toast.error('Không thể cập nhật yêu thích trên máy chủ.');
        }
      } else {
        toast.info('Tính năng yêu thích thư mục sẽ sớm ra mắt.');
      }
    }
  };

  // Previews matching HomeView.tsx
  const renderDocPreviewMockup = (doc: StudyDocument) => {
    switch (doc.type) {
      case 'pdf':
        return (
          <div className="w-full h-full bg-[#fafafa] flex flex-col justify-between p-3 select-none relative overflow-hidden border-b border-[#e0e3e7]">
            <div className="flex items-center gap-1.5 border-b border-red-100 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
              <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider">PDF DOCUMENT</span>
            </div>
            <div className="flex-1 py-3.5 space-y-2">
              <div className="h-2.5 bg-gray-200/80 rounded w-[85%]"></div>
              <div className="h-2 bg-gray-150 rounded w-[95%]"></div>
              <div className="h-2 bg-gray-150 rounded w-[60%]"></div>
              <div className="pt-2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center text-[8px] text-red-500 font-extrabold">PDF</div>
                <div className="h-1.5 bg-gray-150 rounded w-[45%]"></div>
              </div>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] text-red-500">
              <FileText className="w-28 h-28" />
            </div>
          </div>
        );
      case 'docx':
        return (
          <div className="w-full h-full bg-[#fafafa] flex flex-col justify-between p-3 select-none relative overflow-hidden border-b border-[#e0e3e7]">
            <div className="flex items-center gap-1.5 border-b border-blue-100 pb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
              <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider">WORD DOCUMENT</span>
            </div>
            <div className="flex-1 py-3.5 space-y-2">
              <div className="h-2 bg-gray-200/85 rounded w-[90%]"></div>
              <div className="h-2 bg-gray-150 rounded w-[80%]"></div>
              <div className="h-2 bg-gray-150 rounded w-[85%]"></div>
              <div className="h-2 bg-gray-150 rounded w-[40%]"></div>
            </div>
            <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06] text-blue-500">
              <FileCheck className="w-28 h-28" />
            </div>
          </div>
        );
      case 'pptx':
        return (
          <div className="w-full h-full bg-[#201830] flex flex-col justify-between p-3 select-none relative overflow-hidden border-b border-[#e0e3e7] text-white">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-1.5">
              <span className="text-[9px] font-bold text-[#c0c1ff] tracking-wider">PRESENTATION</span>
              <span className="text-[8px] text-purple-300 font-medium">SLIDE 1/5</span>
            </div>
            <div className="flex-1 py-3 flex gap-2 items-center">
              <div className="flex-1 space-y-2">
                <div className="h-2 bg-[#d3e4fe] rounded w-[75%]"></div>
                <div className="h-1 bg-purple-300/40 rounded w-[90%]"></div>
                <div className="h-1 bg-purple-300/40 rounded w-[60%]"></div>
              </div>
              <div className="w-10 h-10 rounded-full border-4 border-purple-500/40 border-t-purple-400 flex items-center justify-center shrink-0">
                <span className="text-[8px] text-purple-300 font-bold">75%</span>
              </div>
            </div>
            <div className="absolute right-[-5px] bottom-[-5px] opacity-[0.08] text-purple-300">
              <Layers className="w-24 h-24" />
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-[#fafafa] flex items-center justify-center border-b border-[#e0e3e7]">
            <FileText className="w-12 h-12 text-gray-300" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" ref={containerRef} onClick={handleClearSelection}>
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <h2 className="text-xl font-semibold text-[#202124] flex items-center gap-1.5 py-1 px-2.5 flex-wrap">
            <span 
              className={`cursor-pointer hover:text-[#1967d2] hover:underline transition-colors ${currentFolderId ? 'text-[#5f6368]' : ''}`}
              onClick={() => setCurrentFolderId(null)}
            >
              Tài liệu của tôi
            </span>
            {breadcrumbs.map((b) => (
              <React.Fragment key={b.id}>
                <span className="text-[#80868b] font-normal mx-1">/</span>
                <span 
                  className={`cursor-pointer hover:text-[#1967d2] hover:underline transition-colors ${b.id === currentFolderId ? '' : 'text-[#5f6368]'}`}
                  onClick={() => setCurrentFolderId(b.id)}
                >
                  {b.name}
                </span>
              </React.Fragment>
            ))}
          </h2>
          {meta.total > 0 && (
            <span className="text-xs bg-[#e8f0fe] text-[#1967d2] font-semibold px-2 py-0.5 rounded-full">
              {meta.total} tài liệu
            </span>
          )}
        </div>

        {/* Layout + Refresh Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); loadDocs(); }}
            className="p-2 text-[#5f6368] hover:bg-[#eceff1] rounded-full transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${apiLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="bg-[#f1f3f4] border border-[#e0e3e7] rounded-lg p-0.5 flex">
            <button
              onClick={(e) => { e.stopPropagation(); setLayoutMode('grid'); }}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${layoutMode === 'grid' ? 'bg-white text-[#1967d2] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
              title="Dạng lưới"
            >
              <Grid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLayoutMode('list'); }}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${layoutMode === 'list' ? 'bg-white text-[#1967d2] shadow-sm' : 'text-[#5f6368] hover:text-[#202124]'}`}
              title="Dạng danh sách"
            >
              <List className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search + Filter + Sort Bar */}
      <div className="flex flex-wrap items-center gap-2 select-none">

        {/* Search box */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9aa0a6]" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm kiếm tài liệu..."
            className="w-full bg-white border border-[#e0e3e7] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#202124] placeholder:text-[#9aa0a6] focus:outline-none focus:border-[#1967d2] focus:ring-1 focus:ring-[#1967d2]/20"
          />
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setActivePillDropdown(activePillDropdown === 'category' ? null : 'category'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-all ${filterCategoryId ? 'bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]' : 'bg-white text-[#5f6368] hover:bg-[#eceff1] border-[#e0e3e7]'
                }`}
            >
              Danh mục: {filterCategoryId ? (categories.find(c => c.id === filterCategoryId)?.name ?? 'Tất cả') : 'Tất cả'}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {activePillDropdown === 'category' && (
              <div className="absolute left-0 mt-1 w-48 bg-white border border-[#e0e3e7] rounded-lg shadow-lg z-50 py-1 text-xs max-h-60 overflow-y-auto">
                <button
                  onClick={() => { setFilterCategoryId(''); setPage(1); setActivePillDropdown(null); }}
                  className="w-full px-3 py-2 text-left hover:bg-[#f1f3f4] text-[#202124] font-medium"
                >
                  Tất cả danh mục
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setFilterCategoryId(cat.id); setPage(1); setActivePillDropdown(null); }}
                    className="w-full px-3 py-2 text-left hover:bg-[#f1f3f4] text-[#202124] font-medium"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sort By */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setActivePillDropdown(activePillDropdown === 'sort' ? null : 'sort'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-all ${sortBy !== 'createdAt' ? 'bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]' : 'bg-white text-[#5f6368] hover:bg-[#eceff1] border-[#e0e3e7]'
              }`}
          >
            Sắp xếp: {{
              createdAt: 'Ngày tạo', updatedAt: 'Ngày sửa',
              title: 'Tên', viewCount: 'Lượt xem', downloadCount: 'Lượt tải'
            }[sortBy]}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {activePillDropdown === 'sort' && (
            <div className="absolute left-0 mt-1 w-48 bg-white border border-[#e0e3e7] rounded-lg shadow-lg z-50 py-1 text-xs">
              {([
                ['createdAt', 'Ngày tạo'],
                ['updatedAt', 'Ngày sửa đổi'],
                ['title', 'Tên A→Z'],
                ['viewCount', 'Lượt xem'],
                ['downloadCount', 'Lượt tải xuống'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setSortBy(val); setPage(1); setActivePillDropdown(null); }}
                  className={`w-full px-3 py-2 text-left hover:bg-[#f1f3f4] font-medium ${sortBy === val ? 'text-[#1967d2]' : 'text-[#202124]'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setOrder(o => o === 'desc' ? 'asc' : 'desc'); setPage(1); }}
          className="p-1.5 rounded-lg border border-[#e0e3e7] bg-white text-[#5f6368] hover:bg-[#eceff1] cursor-pointer transition-colors"
          title={order === 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'}
        >
          {order === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
        </button>

        {/* Reset */}
        {(filterCategoryId || sortBy !== 'createdAt' || order !== 'desc') && (
          <button
            onClick={() => { setFilterCategoryId(''); setSortBy('createdAt'); setOrder('desc'); setPage(1); }}
            className="text-xs text-[#1967d2] hover:underline font-semibold px-2 cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 3. Selection Action Bar (Google Drive Style) */}
      {selectedItemId && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-between bg-[#e8f0fe] border border-[#d2e3fc] rounded-2xl py-2 px-4 shadow-sm animate-slide-down select-none"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleClearSelection}
              className="p-1 rounded-full hover:bg-black/5 text-[#1967d2] cursor-pointer"
              title="Hủy chọn"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <span className="text-sm font-semibold text-[#1967d2]">1 đã chọn</span>
            <span className="text-xs text-[#5f6368] font-medium max-w-[200px] sm:max-w-md truncate border-l border-[#d2e3fc] pl-3">
              {getSelectedName()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Share action */}
            <button
              onClick={() => triggerSelectedAction('share')}
              className="p-2 rounded-full hover:bg-[#dbeafe] text-[#1967d2] transition-colors cursor-pointer"
              title="Chia sẻ liên kết"
            >
              <UserPlus className="w-4.5 h-4.5" />
            </button>

            {/* Star action (only for files) */}
            {selectedItemType === 'file' && (
              <button
                onClick={() => triggerSelectedAction('star')}
                className="p-2 rounded-full hover:bg-[#dbeafe] text-[#1967d2] transition-colors cursor-pointer"
                title="Thêm yêu thích"
              >
                <Star className="w-4.5 h-4.5" />
              </button>
            )}

            {/* Download action */}
            <button
              onClick={() => triggerSelectedAction('download')}
              className="p-2 rounded-full hover:bg-[#dbeafe] text-[#1967d2] transition-colors cursor-pointer"
              title="Tải xuống"
            >
              <Download className="w-4.5 h-4.5" />
            </button>

            {/* Move to folder action */}
            <button
              onClick={() => {
                if (selectedItemType === 'folder') {
                  setMoveFolderTarget({ id: selectedItemId, name: getSelectedName() });
                } else {
                  toast.info('Tính năng di chuyển tệp đang được phát triển.');
                }
              }}
              className="p-2 rounded-full hover:bg-[#dbeafe] text-[#1967d2] transition-colors cursor-pointer"
              title="Di chuyển"
            >
              <FolderOpen className="w-4.5 h-4.5" />
            </button>

            {/* Trash/Delete action */}
            <button
              onClick={() => triggerSelectedAction('delete')}
              className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
              title="Xóa"
            >
              <Trash2 className="w-4.5 h-4.5 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {apiError}
        </div>
      )}
      {/* 4. Display Layouts */}
      {!apiLoading && !apiError && filteredDocs.length === 0 && filteredFolders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#e0e3e7]">
          <Search className="w-10 h-10 text-[#dadce0] mx-auto mb-3" />
          <p className="text-sm text-[#5f6368] font-medium">Không tìm thấy tài liệu nào.</p>
          <p className="text-xs text-[#9aa0a6] mt-1">Thử thay đổi từ khóa hoặc xóa bộ lọc.</p>
          <button
            onClick={openUploadModal}
            className="text-xs text-[#1967d2] font-semibold underline mt-3 block mx-auto cursor-pointer"
          >
            Tải lên tài liệu mới ngay
          </button>
        </div>
      ) : apiLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader />
        </div>
      ) : layoutMode === 'grid' ? (
        /* ======================== GRID MODE ======================== */
        <div className="space-y-8 select-none">
          {/* Folders block */}
          {filteredFolders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider pl-1">Thư mục</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFolders.map((fol) => {
                  const isSelected = selectedItemId === fol.id;
                  return (
                    <div
                      key={fol.id}
                      onClick={(e) => handleSelect(e, fol.id, 'folder')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setCurrentFolderId(fol.id);
                      }}
                      className={`border rounded-xl p-3.5 flex items-center justify-between group cursor-pointer transition-all duration-150 ${isSelected
                        ? 'bg-[#e8f0fe] border-[#1967d2] shadow-sm'
                        : 'bg-white border-[#e0e3e7] hover:border-[#c7d2fe] hover:shadow-xs'
                        }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Folder className={`w-5.5 h-5.5 shrink-0 ${isSelected ? 'text-[#1967d2]' : 'text-[#5f6368]'} fill-gray-100`} />
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-[#174ea6]' : 'text-[#202124]'}`} title={fol.name}>
                          {fol.name}
                        </span>
                      </div>

                      {/* Dropdown triggers */}
                      <div>
                        <button
                          onClick={(e) => toggleDropdown(e, fol.id, 'folder')}
                          className="p-1 rounded-full text-[#5f6368] hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === fol.id && dropdownCoords && (
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
                                setCurrentFolderId(fol.id);
                                closeDropdown();
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
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
                                  defaultValue: fol.name,
                                  inputPlaceholder: 'Nhập tên mới cho thư mục',
                                  confirmLabel: 'OK',
                                  onConfirm: async (newName) => {
                                    if (newName.trim()) {
                                      try {
                                        await renameFolderOnBackend(fol.id, newName.trim());
                                        setFolders(prev => prev.map(f => f.id === fol.id ? { ...f, name: newName.trim() } : f));
                                        setFolderContentsFolders(prev => prev.map(f => f.id === fol.id ? { ...f, name: newName.trim() } : f));
                                        setBreadcrumbs(prev => prev.map(b => b.id === fol.id ? { ...b, name: newName.trim() } : b));
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
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5 text-[#5f6368]" />
                              Đổi tên
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                closeDropdown();
                                setMoveFolderTarget({ id: fol.id, name: fol.name });
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                            >
                              <Folder className="w-3.5 h-3.5 text-[#5f6368]" />
                              Di chuyển
                            </button>
                            <div className="border-t border-[#e0e3e7] my-1" />
                            <button
                              onClick={(e) => deleteFolder(e, fol.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Xóa thư mục
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files block */}
          {filteredDocs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#5f6368] uppercase tracking-wider pl-1">Tệp</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filteredDocs.map((doc) => {
                  const isSelected = selectedItemId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={(e) => handleSelect(e, doc.id, 'file')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onOpenAIOverlay(doc);
                      }}
                      className={`border rounded-xl flex flex-col group transition-all duration-150 cursor-pointer relative ${isSelected
                        ? 'bg-[#e8f0fe] border-[#1967d2] shadow-sm'
                        : 'bg-white border-[#e0e3e7] hover:border-[#c7d2fe] hover:shadow-md'
                        }`}
                    >
                      {/* Document Preview Thumbnail */}
                      <div className="h-36 bg-gray-50 flex items-center justify-center relative rounded-t-xl overflow-hidden">
                        {renderDocPreviewMockup(doc)}

                        {/* Interactive overlay shortcuts */}
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAIOverlay(doc);
                            }}
                            className="bg-[#1967d2] hover:bg-[#1557b0] text-white rounded-full p-2.5 shadow-md flex items-center justify-center cursor-pointer transition-all scale-90 group-hover:scale-100"
                            title="Tóm tắt & Hỏi AI"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownload(e, doc)}
                            className="bg-white hover:bg-gray-100 text-[#5f6368] rounded-full p-2.5 shadow-md flex items-center justify-center cursor-pointer transition-all scale-90 group-hover:scale-100"
                            title="Tải xuống"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Document Meta Description */}
                      <div className="p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className="p-1.5 rounded-lg text-xs font-black flex items-center justify-center shrink-0"
                              style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                            >
                              <span className="text-[9px] tracking-wider">{doc.type.toUpperCase()}</span>
                            </div>
                            <h4 className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-[#174ea6] font-bold' : 'text-[#202124] group-hover:text-[#1967d2]'}`} title={doc.title}>
                              {doc.title}
                            </h4>
                          </div>

                          {/* Trigger context options dropdown */}
                          <div>
                            <button
                              onClick={(e) => toggleDropdown(e, doc.id, 'file')}
                              className="p-1 rounded-full text-[#5f6368] hover:bg-black/5 transition-colors"
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
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#1967d2]" />
                                  Tóm tắt & Hỏi AI
                                </button>
                                <button
                                  onClick={(e) => toggleFavorite(e, doc.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                                >
                                  <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-[#ff9900] text-[#ff9900]' : 'text-[#5f6368]'}`} />
                                  {doc.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                                </button>
                                <button
                                  onClick={(e) => handleShare(e, doc)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
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
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors text-left"
                                >
                                  <Link className="w-3.5 h-3.5 text-[#5f6368]" />
                                  <span>Sao chép liên kết</span>
                                </button>
                                <button
                                  onClick={(e) => handleDownload(e, doc)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#5f6368]" />
                                  Tải xuống tệp
                                </button>
                                <button
                                  onClick={(e) => handleRenameDocument(e, doc)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5 text-[#5f6368]" />
                                  Đổi tên tài liệu
                                </button>
                                <div className="border-t border-[#e0e3e7] my-1" />
                                <button
                                  onClick={(e) => deleteDocument(e, doc.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                  Xóa tài liệu
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Owner & Modified details */}
                        <div className="flex items-center justify-between text-xs text-[#5f6368] pt-1.5 border-t border-[#f1f3f4] select-none">
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <img
                              src={getOwnerAvatar(doc)}
                              alt="Owner"
                              className="w-5 h-5 rounded-full border border-gray-150 object-cover shrink-0"
                            />
                            <span className="truncate">
                              {getOwnerName(doc) === 'tôi' ? 'tôi' : getOwnerName(doc)}
                            </span>
                          </div>
                          <span className="shrink-0 text-[#8b909a] text-[10.5px]">
                            {doc.lastModified}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================== LIST MODE ======================== */
        <div className="bg-white border border-[#e0e3e7] rounded-xl overflow-hidden shadow-sm select-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#e0e3e7] text-xs text-[#5f6368] font-bold bg-[#f8fafd]/80">
                  <th className="py-3.5 px-4 font-semibold">Tên</th>
                  <th className="py-3.5 px-4 font-semibold">Chủ sở hữu</th>
                  <th className="py-3.5 px-4 font-semibold">Ngày sửa đổi</th>
                  <th className="py-3.5 px-4 font-semibold">Kích thước tệp</th>
                  <th className="py-3.5 px-4 font-semibold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4] text-sm text-[#202124]">

                {/* 1. Folders rows first */}
                {filteredFolders.map((fol) => {
                  const isSelected = selectedItemId === fol.id;
                  return (
                    <tr
                      key={fol.id}
                      onClick={(e) => handleSelect(e, fol.id, 'folder')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setCurrentFolderId(fol.id);
                      }}
                      className={`transition-colors cursor-pointer group ${isSelected ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8fafd]'}`}
                    >
                      {/* Name */}
                      <td className="py-3 px-4 font-medium max-w-[300px]">
                        <div className="flex items-center gap-3">
                          <Folder className={`w-5 h-5 shrink-0 ${isSelected ? 'text-[#1967d2]' : 'text-[#5f6368]'} fill-gray-100`} />
                          <span className={`truncate ${isSelected ? 'text-[#174ea6] font-bold' : ''}`} title={fol.name}>
                            {fol.name}
                          </span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-[9px]">H</div>
                          <span>me</span>
                        </div>
                      </td>

                      {/* Date Modified */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        {fol.dateModified}
                      </td>

                      {/* File Size */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        {fol.size}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1">
                          <button
                            onClick={(e) => toggleDropdown(e, fol.id, 'folder')}
                            className="p-1 rounded-full text-[#5f6368] hover:bg-black/5"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdownId === fol.id && dropdownCoords && (
                            <div
                              ref={dropdownRef}
                              className="fixed w-44 bg-white border border-[#e0e3e7] rounded-lg shadow-lg z-50 py-1 text-left"
                              style={{
                                top: `${dropdownCoords.top}px`,
                                left: `${dropdownCoords.left}px`,
                              }}
                            >
                              <button
                                onClick={() => {
                                  setCurrentFolderId(fol.id);
                                  closeDropdown();
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-[#5f6368]" />
                                Mở thư mục
                              </button>
                              <button
                                onClick={() => {
                                  closeDropdown();
                                  setDialogConfig({
                                    title: 'Rename',
                                    showInput: true,
                                    defaultValue: fol.name,
                                    inputPlaceholder: 'Nhập tên mới',
                                    confirmLabel: 'OK',
                                    onConfirm: async (name) => {
                                      if (name.trim()) {
                                        try {
                                          await renameFolderOnBackend(fol.id, name.trim());
                                          setFolders(prev => prev.map(f => f.id === fol.id ? { ...f, name: name.trim() } : f));
                                          setFolderContentsFolders(prev => prev.map(f => f.id === fol.id ? { ...f, name: name.trim() } : f));
                                          setBreadcrumbs(prev => prev.map(b => b.id === fol.id ? { ...b, name: name.trim() } : b));
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
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5 text-[#5f6368]" />
                                Đổi tên
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeDropdown();
                                  setMoveFolderTarget({ id: fol.id, name: fol.name });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                              >
                                <Folder className="w-3.5 h-3.5 text-[#5f6368]" />
                                Di chuyển
                              </button>
                              <div className="border-t border-[#e0e3e7] my-1" />
                              <button
                                onClick={(e) => deleteFolder(e, fol.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                Xóa thư mục
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* 2. Files rows next */}
                {filteredDocs.map((doc) => {
                  const isSelected = selectedItemId === doc.id;
                  return (
                    <tr
                      key={doc.id}
                      onClick={(e) => handleSelect(e, doc.id, 'file')}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onOpenAIOverlay(doc);
                      }}
                      className={`transition-colors cursor-pointer group ${isSelected ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8fafd]'}`}
                    >
                      {/* Name */}
                      <td className="py-3 px-4 font-medium max-w-[300px]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-[9px]"
                            style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                          >
                            {doc.type.toUpperCase()}
                          </div>
                          <span className={`truncate ${isSelected ? 'text-[#174ea6] font-bold' : 'group-hover:text-[#1967d2] transition-colors'}`} title={doc.title}>
                            {doc.title}
                          </span>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        <div className="flex items-center gap-2">
                          <img
                            src={getOwnerAvatar(doc)}
                            alt="Owner"
                            className="w-5 h-5 rounded-full border border-gray-200 object-cover"
                          />
                          <span>{getOwnerName(doc) === 'tôi' ? 'me' : getOwnerName(doc)}</span>
                        </div>
                      </td>

                      {/* Date Modified */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        {doc.lastModified.replace('Sửa ', '')}
                      </td>

                      {/* File Size */}
                      <td className="py-3 px-4 text-xs text-[#5f6368]">
                        {doc.size}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1.5">
                          {/* Star toggle */}
                          <button
                            onClick={(e) => toggleFavorite(e, doc.id)}
                            className="p-1.5 rounded-full text-[#5f6368] hover:bg-black/5 hover:text-[#ff9900]"
                          >
                            <Star className={`w-4 h-4 ${doc.isFavorite ? 'fill-[#ff9900] text-[#ff9900]' : ''}`} />
                          </button>

                          {/* Quick AI overlay open */}
                          <button
                            onClick={() => onOpenAIOverlay(doc)}
                            className="p-1.5 rounded-full text-[#1967d2] hover:bg-black/5"
                            title="Tóm tắt & Hỏi AI"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Dropdown Options trigger */}
                          {/* Trigger context options dropdown */}
                          <div>
                            <button
                              onClick={(e) => toggleDropdown(e, doc.id, 'file')}
                              className="p-1.5 rounded-full text-[#5f6368] hover:bg-black/5"
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
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#1967d2]" />
                                  Tóm tắt & Hỏi AI
                                </button>
                                <button
                                  onClick={(e) => toggleFavorite(e, doc.id)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
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
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#5f6368]" />
                                  Tải xuống tệp
                                </button>
                                <button
                                  onClick={(e) => handleRenameDocument(e, doc)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5 text-[#5f6368]" />
                                  Đổi tên tài liệu
                                </button>
                                <div className="border-t border-[#e0e3e7] my-1" />
                                <button
                                  onClick={(e) => deleteDocument(e, doc.id)}
                                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors font-medium"
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
                  );
                })}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 select-none">
          <p className="text-xs text-[#5f6368]">
            Trang <strong>{meta.page}</strong> / {meta.totalPages} &nbsp;·&nbsp; {meta.total} tài liệu
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#e0e3e7] bg-white text-[#5f6368] hover:bg-[#eceff1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, meta.totalPages - 4));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${p === page
                    ? 'bg-[#1967d2] text-white border-[#1967d2]'
                    : 'bg-white text-[#5f6368] border-[#e0e3e7] hover:bg-[#eceff1]'
                    }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#e0e3e7] bg-white text-[#5f6368] hover:bg-[#eceff1] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      {moveFolderTarget && (
        <MoveFolderModal
          isOpen={moveFolderTarget !== null}
          folderId={moveFolderTarget.id}
          folderName={moveFolderTarget.name}
          folders={folders}
          onConfirm={handleMoveFolderConfirm}
          onClose={() => setMoveFolderTarget(null)}
        />
      )}
    </div>
  );
};

export default DocumentsView;
