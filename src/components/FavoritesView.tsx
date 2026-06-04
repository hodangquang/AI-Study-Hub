import React from 'react';
import { StudyDocument } from '../types';
import { Star, FileText, ArrowUpDown, Filter, HelpCircle, PlusCircle } from 'lucide-react';
import { unbookmarkDocumentOnBackend } from '../services/documentsApi';
import { toast } from 'react-toastify';

interface FavoritesViewProps {
  documents: StudyDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<StudyDocument[]>>;
  searchQuery: string;
  setActiveTab: (tab: string) => void;
  onOpenAIOverlay: (doc: StudyDocument) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({
  documents,
  setDocuments,
  searchQuery,
  setActiveTab,
  onOpenAIOverlay
}) => {
  const favoriteDocs = documents.filter((d) => d.isFavorite && !d.isDeleted && d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleRemoveFavorite = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      await unbookmarkDocumentOnBackend(docId);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isFavorite: false } : d));
    } catch (err) {
      console.error(err);
      toast.error('Không thể bỏ yêu thích tài liệu trên máy chủ.');
    }
  };

  // Pre-sourced beautiful illustrations for vellum covers to match mock exactly
  const coverUrls: Record<string, string> = {
    'doc-1': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNQKu0KcMER-9yoVFPSG7bZ8AlMpf2vy20JCpoKa-tALAYbkR5fUEfdhkkffHQaym-dlH6hpfC8xW4diWBNrsGkkt6oYSTHfl_kXtf6JkXFZK_ycPGXax2t61apGGNGKmjv4e11nUW3TSF7jNBuWirKsniCbfgln3Jd1ky2BLDreKmYTrKzXBstjf5WeT4hP4ygrvKym8fHPskmcWy7h4z54rsVzieWLLqDspyKYgiKAag5XbBoFHDuRQedS3U5LRPoqFOYvDBalc',
    'doc-4': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbbfocjEbKOTSLbClyGfNcRHx-H896PSMtke6hQIXBawzeKwhv-EUXyRzlFl8fUiC8P5iu1kTqN479491dS4-KkH7C-FVedKwXdJQID_pive5sCEt9aKJ9ZqJ9_qogM4gmOXLNwnJTtYHpIXbBBC5Gw876d67hYrNTZSZQbc3cqeNa7bRpdeKY_owqRW7Xf6DQ7AD7LJU6rdWuawmmgYj3kE8gP-N6sMNj395nlFOVyko6CJwZV4YzFjeB2-4snqAFXY40vzWS2NY',
    'doc-5': 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4m23JrtTWVQSooMLqS6tYJMh4A31ds82Pv05jPAR2J9R7rDZ_FYObaus-qPRNm4mn46EuUSHi-3bdh4knqBcSvGcId3IXWoe9Jq35Ziz10ESdVEfKSgZLf76vuJwB_38dNSbC1PVauVgMgofCN75S7juJdT81sFk0S26Uvo9Z8NSZb1nPI_MF2fXINvl0ixpPxI8olikcKND3qiSE1X7Sla0UmLIupPf8mAwUvl-UFcBgAQg7Lx48Dbdnn0jrRlQyM9gJfouWJ5M',
    'doc-6': 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4vY1Vevdg8mlyhw-kxxPWcQ7ntHvfZYRmX6EIU0v_-bFfI3o6mdh_GOHEQSua0Av6RdMrWEVNrqL49gvoCf9gqUVrGy_3DHpIJ8e7QVQIcjITgVqwItNbpF-BW4Af3AqvGGdnhv_g3gzZJ5pz8W_ShuQlOJvZfHiFvW3FWxK9kWnpj4OuAaNZJqD98wJzOa8MJaCYborR_sca7p7rn9EIfILb22Lg7Fgu5MMoBzirDxvA7-P6ym__A9WTxOnhCEo38z7drU9hZt4',
    'doc-7': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPHaFOPSnwLMq2FVJL8KxbtqLDpFb0-ao6Ua2f6FeNOciLY3yPBoSew_Zgdc2KKfjuS7Kv9S6CGdlTtazXoSyg9NST1H_1jFDvL51UBf_vAyYTcBvl3xR8j-GBMXyy_BFlV9mc3FmkcQxtWPZIsMIjSkIDxHQd-fWKBwUIq8rS7eVK4jLFuoo9wYMnwMvayY2BX1BOevCTH77DFzr0a0vsGFqJ0RkMiUDletqnFK3mUlItpfvJRRs3yANEQGiT_4w0kNHKQ6g508I',
    'doc-8': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOqP4dNeQriHhi3qOIe1QG2kB0nZvFadJ8xbjHFYVXz2OsuM4XaeUzUTrDY2fSuoZsv3pfstslpS88UBTkZPG7wTtqqt-7G4qntffEMe_JjgTmZOH--aZRGr8xbd5BH4IRD6iUJlmkVNdR8IWlNbvgKWT2iKkS0j_oi6bO-D46LGVTdHXrnwM2SQ7b8f95ZzzOGgnTrxMwK0N5Vw-k_ZUH-TryGb8mz-JJlyHPp3BHWuTiC6SU42TBLwL66LHdg_bLpUqd7uiKorM'
  };

  const defaultCover = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbbfocjEbKOTSLbClyGfNcRHx-H896PSMtke6hQIXBawzeKwhv-EUXyRzlFl8fUiC8P5iu1kTqN479491dS4-KkH7C-FVedKwXdJQID_pive5sCEt9aKJ9ZqJ9_qogM4gmOXLNwnJTtYHpIXbBBC5Gw876d67hYrNTZSZQbc3cqeNa7bRpdeKY_owqRW7Xf6DQ7AD7LJU6rdWuawmmgYj3kE8gP-N6sMNj395nlFOVyko6CJwZV4YzFjeB2-4snqAFXY40vzWS2NY';

  return (
    <div className="space-y-6 select-none">

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#202124]">Tài liệu yêu thích</h2>
          <p className="text-sm text-[#5f6368] mt-1">Quản lý và ôn tập các tài liệu quan trọng đã được lưu trữ.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.info('Đang lọc danh sách...')}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e0e3e7] rounded-lg text-xs font-semibold text-[#202124] hover:bg-[#eceff1] cursor-pointer"
          >
            <Filter className="w-4 h-4 text-[#5f6368]/70" />
            <span>Bộ lọc</span>
          </button>
          <button
            onClick={() => toast.info('Đang sắp xếp danh sách...')}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#e0e3e7] rounded-lg text-xs font-semibold text-[#202124] hover:bg-[#eceff1] cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4 text-[#5f6368]/70" />
            <span>Sắp xếp</span>
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {favoriteDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => onOpenAIOverlay(doc)}
            className="group bg-white border border-[#e0e3e7] rounded-xl overflow-hidden hover:border-[#c7d2fe]/60 transition-all duration-300 flex flex-col cursor-pointer shadow-sm"
          >
            {/* Visual Book Cover preview section */}
            <div className="relative h-40 bg-[#f1f3f4] overflow-hidden">
              <img
                alt={`${doc.title} Preview`}
                className="w-full h-full object-cover opacity-95 group-hover:scale-[1.03] group-hover:opacity-100 transition-all duration-500"
                src={coverUrls[doc.id] || defaultCover}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 to-transparent"></div>

              {/* Star Button overlay */}
              <div className="absolute top-3 right-3 select-none">
                <button
                  onClick={(e) => handleRemoveFavorite(e, doc.id)}
                  className="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-[#e8f0fe] backdrop-blur-md rounded-full text-[#1967d2] hover:text-[#1967d2] transition-colors border border-[#e0e3e7] cursor-pointer"
                  title="Bỏ yêu thích"
                >
                  <Star className="w-4 h-4 fill-[#1967d2] text-[#1967d2]" />
                </button>
              </div>

              {/* Format Badge */}
              <div className="absolute bottom-3 left-3 select-none">
                <span className="bg-[#f1f3f4] text-[#5f6368] px-2 py-0.5 rounded text-[9px] font-bold border border-[#e0e3e7] uppercase tracking-widest">
                  {doc.type}
                </span>
              </div>
            </div>

            {/* Title body & state status */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-sm text-[#202124] group-hover:text-[#1967d2] line-clamp-2 leading-relaxed mb-3">
                {doc.title}
              </h3>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1 mb-4 select-none">
                <span className="text-[9px] bg-[#e8eaed] text-[#202124] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider">
                  {doc.category.trim()}
                </span>
                <span className="text-[9px] bg-[#e8eaed] text-[#202124] px-2 py-0.5 rounded-full font-medium">
                  {doc.size}
                </span>
              </div>

              {/* AI Sẵn sàng and last modified info */}
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#e0e3e7] select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <span className="text-[11px] font-semibold text-[#202124]">AI Sẵn sàng</span>
                </div>
                <span className="text-[11px] text-[#5f6368]/80">{doc.lastModified}</span>
              </div>
            </div>

          </div>
        ))}

        {/* Empty list quick add simulation card */}
        <div
          onClick={() => setActiveTab('documents')}
          className="border-2 border-dashed border-[#e0e3e7] bg-white rounded-xl flex flex-col items-center justify-center p-6 gap-3 group hover:bg-[#f1f3f4] hover:border-[#c7d2fe]/60 transition-all cursor-pointer min-h-[220px]"
        >
          <div className="w-11 h-11 rounded-full bg-[#f1f3f4] flex items-center justify-center group-hover:bg-[#e8f0fe]/80 transition-all border border-[#e0e3e7]">
            <span className="text-[#5f6368] group-hover:text-[#1967d2] font-bold text-xl">+</span>
          </div>
          <p className="text-xs text-[#5f6368]/80 text-center font-medium max-w-[160px] leading-relaxed">
            Thêm tài liệu vào danh sách yêu thích
          </p>
        </div>

      </div>

    </div>
  );
};

export default FavoritesView;
