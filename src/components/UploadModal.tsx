import React, { useState, useRef, useEffect } from 'react';
import { StudyDocument } from '@/types';
import { X, Cloud, RefreshCw, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import { uploadDocumentFile, fetchCategories, fetchDocumentUploadStatus, BackendCategory } from '@/services/documentsApi';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newDoc: StudyDocument) => void;
  folderId?: string | null;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const ACCEPTED_MIME = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess, folderId }) => {
  const [fileTitle, setFileTitle]         = useState('');
  const [description, setDescription]    = useState('');
  const [selectedFile, setSelectedFile]  = useState<File | null>(null);
  const [fileError, setFileError]        = useState('');
  const [isDragging, setIsDragging]      = useState(false);

  // Category (folder) states — loaded from real API
  const [categories, setCategories]       = useState<BackendCategory[]>([]);
  const [categoryId, setCategoryId]       = useState('');
  const [catLoading, setCatLoading]       = useState(true);

  // Upload state
  const [loading, setLoading]  = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Processing status states
  const [ocrStatus, setOcrStatus] = useState<'pending' | 'processing' | 'ready' | 'failed' | null>(null);
  const [aiStatus, setAiStatus] = useState<'pending' | 'processing' | 'ready' | 'failed' | null>(null);
  const [processingError, setProcessingError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load real categories from backend on mount
  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, []);

  const isValidFile = (file: File): string => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      return 'Chỉ chấp nhận PDF, DOCX hoặc TXT. Vui lòng chọn lại.';
    }
    if (file.size > 50 * 1024 * 1024) {
      return 'Tệp vượt quá giới hạn 50MB.';
    }
    return '';
  };

  const applyFile = (file: File) => {
    const err = isValidFile(file);
    setFileError(err);
    if (!err) {
      setSelectedFile(file);
      if (!fileTitle) setFileTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    // reset so same file can be re-picked
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Vui lòng chọn hoặc kéo thả một tệp PDF / DOCX / TXT.');
      return;
    }
    if (!fileTitle.trim()) return;

    setLoading(true);
    setUploadError('');
    setProcessingError('');
    setOcrStatus(null);
    setAiStatus(null);

    try {
      const newDoc = await uploadDocumentFile(
        selectedFile,
        fileTitle.trim(),
        categoryId || undefined,
        undefined,
        false,
        description.trim() || undefined,
        folderId
      );
      setUploaded(true);
      setLoading(false); // finish upload, start polling status

      // Poll status every 2 seconds (up to 20 times = 40s total)
      let attempts = 0;
      const maxAttempts = 20;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const status = await fetchDocumentUploadStatus(newDoc.id);
          setOcrStatus(status.ocrStatus);
          setAiStatus(status.aiStatus);

          if (status.ocrStatus === 'ready' && status.aiStatus === 'ready') {
            clearInterval(interval);
            setTimeout(() => {
              onUploadSuccess({ ...newDoc, status: 'ready' });
              onClose();
            }, 1500);
          } else if (status.ocrStatus === 'failed' || status.aiStatus === 'failed') {
            clearInterval(interval);
            setProcessingError(status.aiErrorMessage || status.ocrErrorMessage || 'Lỗi xử lý tài liệu.');
          }
        } catch (err: any) {
          console.error("Lỗi khi kiểm tra trạng thái xử lý:", err);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          // If timeout, just close and add it as-is
          onUploadSuccess(newDoc);
          onClose();
        }
      }, 2000);
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi khi tải tài liệu lên máy chủ.');
      setLoading(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />

      {/* Modal Card */}
      <div className="relative bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl z-10 animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">Tải lên tài liệu học tập</h3>
          <button type="button" onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
              <div className="text-center">
                <p className="text-md font-bold text-slate-800">Đang tải lên và kích hoạt AI...</p>
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống đang cấu trúc hóa kiến thức và tóm tắt tự động.
                </p>
              </div>
            </div>
          )}

          {/* Success & Processing state */}
          {uploaded && !loading && (
            <div className="flex flex-col items-center justify-center py-10 space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-md font-bold text-slate-800">Tải lên tệp thành công!</p>
                  <p className="text-xs text-slate-500">Đang bắt đầu lập chỉ mục tài liệu...</p>
                </div>
              </div>

              {/* Status indicators */}
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 max-w-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">1. Nhận dạng chữ viết (OCR):</span>
                  <span className={`font-semibold inline-flex items-center gap-1.5 ${
                    ocrStatus === 'ready' ? 'text-emerald-600' :
                    ocrStatus === 'failed' ? 'text-red-500' :
                    'text-amber-600'
                  }`}>
                    {ocrStatus === 'ready' ? '✓ Xong' :
                     ocrStatus === 'failed' ? '✗ Lỗi' :
                     ocrStatus === 'processing' ? 'Đang đọc...' : 'Đang chờ...'}
                    {(ocrStatus !== 'ready' && ocrStatus !== 'failed') && <RefreshCw className="w-3 h-3 animate-spin" />}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">2. Trí tuệ nhân tạo (AI):</span>
                  <span className={`font-semibold inline-flex items-center gap-1.5 ${
                    aiStatus === 'ready' ? 'text-emerald-600' :
                    aiStatus === 'failed' ? 'text-red-500' :
                    'text-amber-600'
                  }`}>
                    {aiStatus === 'ready' ? '✓ Sẵn sàng' :
                     aiStatus === 'failed' ? '✗ Lỗi' :
                     aiStatus === 'processing' ? 'Đang tóm tắt...' : 'Đang chờ...'}
                    {(aiStatus !== 'ready' && aiStatus !== 'failed') && <RefreshCw className="w-3 h-3 animate-spin" />}
                  </span>
                </div>
              </div>

              {/* Processing error */}
              {processingError && (
                <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center">
                  Lỗi: {processingError}
                  <button 
                    type="button"
                    onClick={onClose}
                    className="mt-2 block mx-auto text-xs font-semibold underline text-indigo-600 hover:text-indigo-700"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              )}

              {!processingError && (ocrStatus !== 'ready' || aiStatus !== 'ready') && (
                <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed animate-pulse">
                  Vui lòng không đóng cửa sổ này khi AI đang thiết lập dữ liệu học tập...
                </p>
              )}

              {!processingError && ocrStatus === 'ready' && aiStatus === 'ready' && (
                <p className="text-xs text-emerald-600 font-semibold text-center animate-bounce">
                  🎉 Tất cả đã sẵn sàng! Đang chuẩn bị chuyển hướng...
                </p>
              )}
            </div>
          )}

          {/* Normal form */}
          {!loading && !uploaded && (
            <>
              {/* Hidden file input — PDF/DOCX/TXT only */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.txt"
              />

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-50/50'
                    : fileError
                    ? 'border-red-500 bg-red-50/5'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/5'
                    : 'border-slate-300 hover:border-indigo-400'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                  fileError ? 'bg-red-50 text-red-500' :
                  selectedFile ? 'bg-emerald-50 text-emerald-500' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {fileError
                    ? <AlertCircle className="w-5 h-5" />
                    : selectedFile
                    ? <CheckCircle className="w-5 h-5" />
                    : <Cloud className="w-5 h-5" />}
                </div>

                {fileError ? (
                  <p className="text-sm font-semibold text-red-500">{fileError}</p>
                ) : selectedFile ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-600">✓ {selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatSize(selectedFile.size)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-800">
                      Kéo thả hoặc nhấn để chọn tệp
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Chỉ hỗ trợ <strong className="text-indigo-600 font-semibold">PDF · DOCX · TXT</strong> · Tối đa 50MB
                    </p>
                  </>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tên tài liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                  placeholder="ví dụ: Đề cương Giải tích nâng cao"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                />
              </div>

              {/* Description (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Mô tả <span className="text-slate-400 font-normal normal-case">(tuỳ chọn)</span>
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 resize-none"
                  placeholder="Mô tả ngắn về nội dung tài liệu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Category — loaded from real API */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Thư mục / Danh mục <span className="text-red-500">*</span>
                </label>
                {catLoading ? (
                  <div className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-sm text-slate-400 animate-pulse">
                    Đang tải danh mục...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="w-full bg-amber-50 border border-amber-100 rounded-xl py-2.5 px-4 text-sm text-amber-600">
                    Không có danh mục nào. Tài liệu sẽ không gắn vào thư mục.
                  </div>
                ) : (
                  <select
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Upload error */}
              {uploadError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              {/* Footer actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm transition-all border border-slate-200 cursor-pointer shadow-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || !!fileError}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 hover:scale-[1.01] cursor-pointer"
                >
                  Tải lên & Phân tích AI
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
