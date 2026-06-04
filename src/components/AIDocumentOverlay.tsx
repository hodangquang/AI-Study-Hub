import React, { useEffect, useState } from 'react';
import { StudyDocument } from '../types';
import { X, Sparkles, AlertCircle, RefreshCw, MessageSquare, BookOpen, Lightbulb, Heading, Eye, Download, Info } from 'lucide-react';
import { fetchDocumentDetail } from '../services/documentsApi';

interface AIDocumentOverlayProps {
  document: StudyDocument | null;
  onClose: () => void;
  onOpenChat: (doc: StudyDocument) => void;
}

interface AnalysisResult {
  summary: string;
  insights: string[];
  topics: string[];
  advice: string;
}

const AIDocumentOverlay: React.FC<AIDocumentOverlayProps> = ({ document, onClose, onOpenChat }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [detailDoc, setDetailDoc] = useState<StudyDocument | null>(document);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) {
      setDetailDoc(null);
      setAnalysis(null);
      return;
    }
    setDetailDoc(document);

    const analyzeDocument = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch real Swagger detail document first
        try {
          const detail = await fetchDocumentDetail(document.id);
          setDetailDoc(detail);
        } catch (detailErr) {
          console.warn("Lỗi tải chi tiết tài liệu từ Swagger:", detailErr);
        }

        // Fetch analysis details
        const response = await fetch('/api/gemini/analyze-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileTitle: document.title,
            fileType: document.type,
          }),
        });

        if (!response.ok) {
          throw new Error('Có lỗi xảy ra khi gọi dịch vụ phân tích tài liệu.');
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err: any) {
        console.error('Error analyzing:', err);
        setError(err.message || 'Không thể kết nối máy chủ phân tích.');
      } finally {
        setLoading(false);
      }
    };

    analyzeDocument();
  }, [document]);

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#000f21]/70 backdrop-blur-xs transition-opacity"
      ></div>

      {/* Slide-over Content Container */}
      <div className="relative w-full max-w-lg h-full bg-[#102034] border-l border-[#464554]/60 shadow-2xl flex flex-col z-10 transition-transform duration-300">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#464554]/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#c0c1ff]">
            <Sparkles className="w-5 h-5 text-[#ffb783]" />
            <h3 className="font-bold text-md text-[#d3e4fe]">Bản Phân Tích Trí Tuệ Nhân Tạo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#c7c4d7] hover:text-[#d3e4fe] rounded-full hover:bg-[#26364a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {/* File Quick Info */}
          <div className="p-4 bg-[#0b1c30]/70 border border-[#464554]/30 rounded-xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                className="text-md px-3 py-1.5 rounded-lg font-extrabold"
                style={{ backgroundColor: `${detailDoc?.iconBg || document.iconBg}20`, color: detailDoc?.iconBg || document.iconBg }}
              >
                {(detailDoc?.type || document.type).toUpperCase()}
              </span>
              <div className="overflow-hidden flex-1">
                <h4 className="text-sm font-semibold text-[#d3e4fe] truncate" title={detailDoc?.title || document.title}>
                  {detailDoc?.title || document.title}
                </h4>
                <p className="text-xs text-[#c7c4d7] mt-0.5">
                  {detailDoc?.size || document.size} • {detailDoc?.lastModified || document.lastModified}
                </p>
              </div>
            </div>

            {/* Detailed metadata metrics */}
            {detailDoc && (detailDoc.viewCount !== undefined || detailDoc.downloadCount !== undefined || detailDoc.pageCount !== undefined) && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#464554]/30 text-center select-none">
                <div className="bg-[#102034]/50 p-2 rounded-lg border border-[#464554]/15">
                  <span className="text-[10px] text-[#c7c4d7] block">Số trang</span>
                  <span className="text-xs font-bold text-[#d3e4fe] mt-0.5 inline-flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#ffb783]" />
                    {detailDoc.pageCount ?? '—'}
                  </span>
                </div>
                <div className="bg-[#102034]/50 p-2 rounded-lg border border-[#464554]/15">
                  <span className="text-[10px] text-[#c7c4d7] block">Lượt xem</span>
                  <span className="text-xs font-bold text-[#d3e4fe] mt-0.5 inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-[#c0c1ff]" />
                    {detailDoc.viewCount ?? 0}
                  </span>
                </div>
                <div className="bg-[#102034]/50 p-2 rounded-lg border border-[#464554]/15">
                  <span className="text-[10px] text-[#c7c4d7] block">Lượt tải</span>
                  <span className="text-xs font-bold text-[#d3e4fe] mt-0.5 inline-flex items-center gap-1">
                    <Download className="w-3 h-3 text-[#10B981]" />
                    {detailDoc.downloadCount ?? 0}
                  </span>
                </div>
              </div>
            )}

            {/* Description if present */}
            {detailDoc?.description && (
              <div className="pt-2 border-t border-[#464554]/30 text-xs text-[#c7c4d7] leading-relaxed">
                <span className="font-semibold text-[#d3e4fe] block mb-1">Mô tả tài liệu:</span>
                <p className="italic bg-[#102034]/20 p-2 rounded-lg border border-[#464554]/10">
                  "{detailDoc.description}"
                </p>
              </div>
            )}

            {/* Tags if present */}
            {detailDoc?.tags && detailDoc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {detailDoc.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] bg-[#1b2b3f] text-[#c0c1ff] border border-[#c0c1ff]/20 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Loader or Error or Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-[#c0c1ff] animate-spin" />
              <p className="text-sm text-[#c7c4d7]">AI Study Hub đang đọc và xử lý tài liệu...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#93000a]/10 border border-[#93000a]/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-[#ffb4ab]">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-semibold">Gặp lỗi phân tích</p>
              </div>
              <p className="text-xs text-[#ffb4ab]/80">{error}</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">

              {/* Keywords / Topics */}
              <div className="space-y-2">
                <span className="text-xs text-[#c7c4d7] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Heading className="w-3.5 h-3.5 text-[#ffb783]" />
                  <span>Chủ đề nổi bật</span>
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {analysis.topics.map((topic, i) => (
                    <span
                      key={i}
                      className="text-xs bg-[#c0c1ff]/10 text-[#c0c1ff] border border-[#c0c1ff]/20 px-2.5 py-1 rounded-full font-medium"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary Section */}
              <div className="space-y-2 bg-[#1b2b3f]/40 p-4 rounded-xl border border-[#464554]/20">
                <span className="text-[#ffb783] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-4 h-4 text-[#c0c1ff]" />
                  <span>Tóm tắt tài liệu bằng AI</span>
                </span>
                <p className="text-sm text-[#d3e4fe] leading-relaxed">
                  {analysis.summary}
                </p>
              </div>

              {/* Core Insights */}
              <div className="space-y-3">
                <span className="text-xs text-[#c7c4d7] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#ffb783]" />
                  <span>Khái niệm cốt lõi học được</span>
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {analysis.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[#0b1c30]/50 border border-[#464554]/20 rounded-lg text-xs leading-relaxed text-[#d3e4fe] flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#1b2b3f] text-[#c0c1ff] font-bold shrink-0 flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <p className="flex-1 shrink-0 pt-0.5">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Advise Block */}
              <div className="space-y-2 bg-[#571bc1]/10 p-4 rounded-xl border border-[#571bc1]/30">
                <span className="text-[#c4abff] font-bold text-xs uppercase tracking-wider block">
                  💡 Lời khuyên ôn tập hiệu quả
                </span>
                <p className="text-xs text-[#d3e4fe]/95 leading-relaxed">
                  {analysis.advice}
                </p>
              </div>

            </div>
          ) : (
            <p className="text-sm text-[#c7c4d7] text-center py-10">Không tìm thấy bản phân tích tài liệu.</p>
          )}

        </div>

        {/* Slide-over Footer */}
        <div className="p-4 bg-[#0b1c30] border-t border-[#464554]/40 flex gap-3">
          <button
            type="button"
            onClick={() => onOpenChat(document)}
            className="flex-1 bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Thảo luận cùng Chatbot AI</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIDocumentOverlay;
