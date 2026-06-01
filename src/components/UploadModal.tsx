import React, { useState } from 'react';
import { StudyDocument, FileType } from '../types';
import { X, Cloud, Sliders, CheckSquare, RefreshCw } from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (newDoc: StudyDocument) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUploadSuccess }) => {
  const [fileTitle, setFileTitle] = useState('');
  const [fileType, setFileType] = useState<FileType>('pdf');
  const [category, setCategory] = useState<' đại cương' | 'chuyên ngành'>(' đại cương');
  const [loading, setLoading] = useState(false);
  const [fileSize, setFileSize] = useState('1.5 MB');

  const handleVirtualUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileTitle.trim()) {
      alert('Vui lòng nhập tên tài liệu hoặc kéo thả tệp!');
      return;
    }

    setLoading(true);
    
    // Simulate AI parsing progress
    setTimeout(() => {
      const extension = fileType === 'pdf' ? '.pdf' : fileType === 'docx' ? '.docx' : '.pptx';
      const cleanTitle = fileTitle.endsWith(extension) ? fileTitle : `${fileTitle}${extension}`;
      
      const newDocument: StudyDocument = {
        id: `uploaded-${Date.now()}`,
        title: cleanTitle,
        type: fileType,
        size: fileSize,
        category: category,
        status: 'ready',
        lastModified: 'Vừa tải lên',
        isFavorite: false,
        iconBg: fileType === 'pdf' ? '#EF4444' : fileType === 'docx' ? '#3B82F6' : '#8B5CF6'
      };

      onUploadSuccess(newDocument);
      setLoading(false);
      onClose();
    }, 2000);
  };

  const handleFileDropMock = (e: React.DragEvent) => {
    e.preventDefault();
    // Simulate dropping files
    setFileTitle('Giáo án Giải thuật Nâng cao');
    setFileType('docx');
    setFileSize('2.8 MB');
    setCategory('chuyên ngành');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-[#000f21]/78 backdrop-blur-xs"></div>

      {/* Modal Card */}
      <div className="relative bg-[#102034] border border-[#464554]/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl z-10 transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#464554]/40 flex items-center justify-between">
          <h3 className="font-bold text-lg text-[#d3e4fe]">Tải lên tài liệu học tập</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-[#c7c4d7] hover:text-[#d3e4fe] p-1.5 rounded-full hover:bg-[#26364a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleVirtualUpload} className="p-6 space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <RefreshCw className="w-10 h-10 text-[#c0c1ff] animate-spin" />
              <div className="text-center">
                <p className="text-md font-bold text-[#d3e4fe]">Đang kích hoạt Trí tuệ Nhân tạo...</p>
                <p className="text-xs text-[#c7c4d7] mt-1">Hệ thống đang cấu trúc hóa kiến thức và tóm tắt tự động.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Drag n Drop Box */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDropMock}
                className="border-2 border-dashed border-[#464554] bg-[#0b1c30]/40 hover:bg-[#0b1c30]/70 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#26364a] text-[#c0c1ff] flex items-center justify-center mb-3">
                  <Cloud className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#d3e4fe]">Kéo thả tài liệu bài học vào đây</p>
                <p className="text-xs text-[#c7c4d7] mt-1 max-w-sm">Hỗ trợ PDF, DOCX, PPTX (Tối đa 50MB/tệp)</p>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                    Tên tài liệu
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] placeholder:text-[#c7c4d7]/50 focus:outline-none focus:border-[#c0c1ff]"
                    placeholder="ví dụ: Đề cương Giải tích nâng cao, slide bài giảng"
                    value={fileTitle}
                    onChange={(e) => setFileTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Format */}
                  <div>
                    <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                      Định dạng
                    </label>
                    <select
                      className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] focus:outline-none focus:border-[#c0c1ff]"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value as FileType)}
                    >
                      <option value="pdf">Tài liệu PDF (.pdf)</option>
                      <option value="docx">Văn bản Word (.docx)</option>
                      <option value="pptx">Bài thuyết trình (.pptx)</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                      Chuyên học phần
                    </label>
                    <select
                      className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] focus:outline-none focus:border-[#c0c1ff]"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                    >
                      <option value=" đại cương">Môn Đại cương</option>
                      <option value="chuyên ngành">Chuyên ngành</option>
                    </select>
                  </div>
                </div>

                {/* Simulated file info */}
                {fileTitle && (
                  <div className="text-xs text-[#c7c4d7]">
                    Kích thước dự kiến: <strong>{fileSize}</strong> • AI sẽ phân tích và lập chỉ mục ngay sau khi nhấn nút.
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#464554]/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-transparent hover:bg-[#26364a] text-[#c7c4d7] hover:text-[#d3e4fe] font-semibold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#c0c1ff] hover:bg-[#e1e0ff] text-[#1000a9] font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md shadow-indigo-400/5 hover:scale-[1.01] cursor-pointer"
                >
                  Bắt đầu phân tích & Tải lên
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
