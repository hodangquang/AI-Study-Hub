import React, { useState } from 'react';
import { StudyDocument } from '../types';
import { Grid, List, Download, Share2, MoreVertical, Star, HelpCircle, FileText, CheckCircle, RefreshCw } from 'lucide-react';

interface DocumentsViewProps {
  documents: StudyDocument[];
  searchQuery: string;
  setDocuments: React.Dispatch<React.SetStateAction<StudyDocument[]>>;
  onOpenAIOverlay: (doc: StudyDocument) => void;
  openUploadModal: () => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  searchQuery,
  setDocuments,
  onOpenAIOverlay,
  openUploadModal
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'recent' | ' đại cương' | 'chuyên ngành'>('all');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  const toggleFavorite = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isFavorite: !d.isFavorite } : d));
  };

  const deleteDocument = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này vào Thùng rác?')) {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isDeleted: true } : d));
    }
  };

  const handleShare = (e: React.MouseEvent, docTitle: string) => {
    e.stopPropagation();
    alert(`Đã sao chép liên kết chia sẻ của tài liệu: "${docTitle}"`);
  };

  // Filter logic
  const filteredDocs = documents.filter(doc => {
    if (doc.isDeleted) return false;

    // Search filter
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category tabs filter
    if (activeCategory === 'all') return matchesSearch;
    if (activeCategory === 'recent') return matchesSearch && doc.lastModified === 'Vừa tải lên';
    return matchesSearch && doc.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#d3e4fe]">Tài liệu của tôi</h2>
          <p className="text-sm text-[#c7c4d7] mt-1">Quản lý và tổng hợp tài liệu học tập thông minh của bạn.</p>
        </div>
        
        {/* Layout Modifiers */}
        <div className="flex items-center gap-2">
          <div className="bg-[#102034] border border-[#464554]/50 rounded-lg p-0.5 flex">
            <button 
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${layoutMode === 'grid' ? 'bg-[#26364a] text-[#d3e4fe]' : 'text-[#c7c4d7] hover:text-[#d3e4fe]'}`}
              title="Dạng lưới"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-md transition-colors ${layoutMode === 'list' ? 'bg-[#26364a] text-[#d3e4fe]' : 'text-[#c7c4d7] hover:text-[#d3e4fe]'}`}
              title="Dạng danh sách"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2 select-none">
        <button 
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            activeCategory === 'all' 
              ? 'bg-[#571bc1] text-[#c4abff] border-[#571bc1]' 
              : 'bg-transparent text-[#c7c4d7] hover:bg-[#26364a] border-[#464554]/60'
          }`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setActiveCategory('recent')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            activeCategory === 'recent' 
              ? 'bg-[#571bc1] text-[#c4abff] border-[#571bc1]' 
              : 'bg-transparent text-[#c7c4d7] hover:bg-[#26364a] border-[#464554]/60'
          }`}
        >
          Gần đây
        </button>
        <button 
          onClick={() => setActiveCategory(' đại cương')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            activeCategory === ' đại cương' 
              ? 'bg-[#571bc1] text-[#c4abff] border-[#571bc1]' 
              : 'bg-transparent text-[#c7c4d7] hover:bg-[#26364a] border-[#464554]/60'
          }`}
        >
          Môn Đại cương
        </button>
        <button 
          onClick={() => setActiveCategory('chuyên ngành')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            activeCategory === 'chuyên ngành' 
              ? 'bg-[#571bc1] text-[#c4abff] border-[#571bc1]' 
              : 'bg-transparent text-[#c7c4d7] hover:bg-[#26364a] border-[#464554]/60'
          }`}
        >
          Chuyên ngành
        </button>
      </div>

      {/* Documents Grid / List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-[#102034]/50 rounded-xl border border-[#464554]/30">
          <p className="text-sm text-[#c7c4d7]">Không tìm thấy tài liệu nào phù hợp với bộ lọc lọc của bạn.</p>
          <button 
            onClick={openUploadModal}
            className="text-xs text-[#c0c1ff] underline mt-2 block mx-auto cursor-pointer"
          >
            Tải lên tài liệu mới ngay
          </button>
        </div>
      ) : layoutMode === 'grid' ? (
        /* GRID LAYOUT */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => onOpenAIOverlay(doc)}
              className="bg-[#031427] border border-[#464554]/60 rounded-xl p-4 flex flex-col group hover:border-[#c0c1ff] transition-all cursor-pointer relative overflow-hidden saturate-95 hover:saturate-100 shadow-md"
            >
              <div className="flex justify-between items-start mb-3 select-none">
                <div 
                  className="p-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center tracking-wider"
                  style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                >
                  {doc.type.toUpperCase()}
                </div>
                {/* Actions overlay */}
                <div className="flex gap-1.5">
                  <button 
                    onClick={(e) => toggleFavorite(e, doc.id)}
                    className="p-1 rounded-full text-[#c7c4d7] hover:text-[#ffdcc5] hover:bg-[#26364a]"
                    title={doc.isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    <Star className={`w-4 h-4 ${doc.isFavorite ? 'fill-[#ffb783] text-[#ffb783]' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => deleteDocument(e, doc.id)}
                    className="p-1 rounded-full text-[#c7c4d7] hover:text-[#ffb4ab] hover:bg-[#26364a] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa tài liệu"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[#d3e4fe] group-hover:text-[#c0c1ff] transition-colors truncate mb-1">
                {doc.title}
              </h3>

              <div className="flex items-center gap-2 mb-4 select-none">
                {doc.status === 'ready' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> AI Sẵn sàng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-sm">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Đang xử lý AI
                  </span>
                )}
                <span className="text-xs text-[#c7c4d7]/70 font-medium">{doc.size}</span>
              </div>

              <div className="mt-auto border-t border-[#464554]/30 pt-3 flex justify-between items-center select-none">
                <span className="text-xs text-[#c7c4d7]">{doc.lastModified}</span>
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); alert('Đang bắt đầu tải tệp về máy...'); }}
                    className="p-1 rounded-md text-[#c7c4d7] hover:bg-[#26364a] hover:text-[#c0c1ff] transition-colors"
                    title="Tải xuống"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleShare(e, doc.title)}
                    className="p-1 rounded-md text-[#c7c4d7] hover:bg-[#26364a] hover:text-[#c0c1ff] transition-colors"
                    title="Chia sẻ"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST LAYOUT */
        <div className="space-y-2 bg-[#102034]/30 border border-[#464554]/20 rounded-xl p-3">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id}
              onClick={() => onOpenAIOverlay(doc)}
              className="flex items-center justify-between p-3 hover:bg-[#26364a]/30 rounded-lg transition-colors cursor-pointer group border-b border-[#464554]/10 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-10 rounded-lg text-xs font-black tracking-widest flex items-center justify-center shrink-0"
                  style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                >
                  {doc.type.toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-sm font-semibold text-[#d3e4fe] group-hover:text-[#c0c1ff] truncate max-w-[240px] sm:max-w-md">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#c7c4d7]">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span className="text-xs text-[#c7c4d7]/70">{doc.category.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-[#c7c4d7] hidden md:inline-block">{doc.lastModified}</span>
                
                {doc.status === 'ready' ? (
                  <span className="text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-sm">
                    AI Sẵn sàng
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-sm">
                    Đang xử lý
                  </span>
                )}

                <div className="flex gap-1">
                  <button 
                    onClick={(e) => toggleFavorite(e, doc.id)}
                    className="p-1 rounded text-[#c7c4d7] hover:text-[#ffb783]"
                  >
                    <Star className={`w-4 h-4 ${doc.isFavorite ? 'fill-[#ffb783] text-[#ffb783]' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteDocument(e, doc.id); }}
                    className="p-1 rounded text-[#c7c4d7] hover:text-[#ffb4ab]"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Beautiful Bento style Drop Drag box serving as quick drag uploading on view */}
      <div 
        onClick={openUploadModal}
        className="border border-dashed border-[#464554] bg-[#102034]/30 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-[#102034]/50 hover:border-[#c0c1ff]/50 transition-colors cursor-pointer min-h-[170px]"
      >
        <div className="w-11 h-11 rounded-full bg-[#1b2b3f] text-[#c7c4d7] flex items-center justify-center mb-3">
          <CloudIcon />
        </div>
        <h4 className="font-semibold text-sm text-[#d3e4fe] mb-1">Kéo thả thêm tài liệu học liệu khác của bạn</h4>
        <p className="text-xs text-[#c7c4d7] max-w-sm leading-relaxed">
          Tải lên Giáo trình Đại số, slide Hoạt động Ngoại thương hay tài liệu ôn tập để AI phân tích chuẩn bị hệ thống thông minh.
        </p>
      </div>

    </div>
  );
};

// Simple standalone icon helpers inside view file
const CloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cloud-upload">
    <path d="M12 13v8M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M8 17l4-4 4 4"/>
  </svg>
);

const Trash2Icon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
  </svg>
);

export default DocumentsView;
