import React from 'react';
import { StudyDocument } from '../types';
import { Trash2, RotateCcw, ShieldCheck, AlertCircle, Settings, User, Bell, HardDrive, Key, HelpCircle } from 'lucide-react';

/* TRASH VIEW */
interface TrashViewProps {
  documents: StudyDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<StudyDocument[]>>;
}

export const TrashView: React.FC<TrashViewProps> = ({ documents, setDocuments }) => {
  const deletedDocs = documents.filter((d) => d.isDeleted);

  const handleRestore = (docId: string) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isDeleted: false } : d));
    alert('Đã khôi phục tài liệu thành công!');
  };

  const handlePermanentDelete = (docId: string) => {
    if (confirm('Bạn có đồng ý xóa vĩnh viễn tài liệu này khỏi hệ thống? Thao tác này không thể thu hồi.')) {
      setDocuments(prev => prev.filter(d => d.id !== docId));
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Dọn sạch hệ thống thùng rác? Tất cả tệp dữ liệu sẽ bị hủy bỏ vĩnh viễn.')) {
      setDocuments(prev => prev.filter(d => !d.isDeleted));
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#d3e4fe]">Thùng rác</h2>
          <p className="text-sm text-[#c7c4d7] mt-1">Nơi lưu trữ các tài liệu đã bị xóa trong 30 ngày qua trước khi biến mất.</p>
        </div>
        {deletedDocs.length > 0 && (
          <button 
            type="button"
            onClick={handleEmptyTrash}
            className="bg-[#EF4444] hover:bg-[#ffb4ab] text-[#d3e4fe] hover:text-[#690005] font-semibold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
          >
            Dọn sạch Thùng rác
          </button>
        )}
      </div>

      {deletedDocs.length === 0 ? (
        <div className="text-center py-20 bg-[#102034]/50 rounded-xl border border-[#464554]/30 space-y-3">
          <Trash2 className="w-10 h-10 text-[#c7c4d7] mx-auto opacity-70" />
          <p className="text-sm text-[#c7c4d7]">Thư mục thùng rác hiện tại trống rỗng.</p>
        </div>
      ) : (
        <div className="space-y-3 bg-[#102034]/30 border border-[#464554]/20 rounded-xl p-4">
          {deletedDocs.map((doc) => (
            <div 
              key={doc.id}
              className="flex items-center justify-between p-3.5 bg-[#0b1c30]/70 rounded-xl border border-[#464554]/20 hover:border-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-10 rounded-lg text-xs font-black tracking-widest flex items-center justify-center shrink-0"
                  style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                >
                  {doc.type.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#d3e4fe] truncate max-w-xs">{doc.title}</h4>
                  <p className="text-xs text-[#c7c4d7] mt-0.5">{doc.size} • Đã xóa gần đây</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleRestore(doc.id)}
                  className="flex items-center gap-1 bg-[#1b2b3f] hover:bg-[#26364a] text-[#c0c1ff] font-semibold text-xs py-1.5 px-3 rounded-lg border border-[#464554]/30 transition-colors cursor-pointer"
                  title="Khôi phục tài liệu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục</span>
                </button>
                <button 
                  onClick={() => handlePermanentDelete(doc.id)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg text-[#ffb4ab] hover:bg-[#93000a]/20 transition-colors cursor-pointer"
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


/* SETTINGS VIEW */
export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 select-none max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-[#d3e4fe]">Cài đặt</h2>
        <p className="text-sm text-[#c7c4d7] mt-1">Cấu hình hồ sơ, gói đăng ký và cài đặt AI cá nhân.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation panel */}
        <div className="space-y-1 md:col-span-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#571bc1] text-[#c4abff] rounded-lg text-sm font-semibold text-left">
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#c7c4d7] hover:bg-[#26364a] rounded-lg text-sm font-medium text-left">
            <Bell className="w-4 h-4" />
            <span>Thông báo</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#c7c4d7] hover:bg-[#26364a] rounded-lg text-sm font-medium text-left">
            <HardDrive className="w-4 h-4" />
            <span>Không gian lưu trữ</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#c7c4d7] hover:bg-[#26364a] rounded-lg text-sm font-medium text-left">
            <Key className="w-4 h-4" />
            <span>Bảo mật hệ thống</span>
          </button>
        </div>

        {/* Content detail panels */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 md:col-span-2 space-y-5">
          <h3 className="font-semibold text-sm text-[#d3e4fe] border-b border-[#464554]/30 pb-2">Hồ sơ sinh viên</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#c7c4d7] font-semibold uppercase tracking-wider mb-1">Họ và tên</p>
              <input 
                type="text" 
                readOnly 
                value="Nguyễn Minh Khôi" 
                className="w-full bg-[#1b2b3f] border border-[#464554]/40 rounded-lg py-2 px-3 text-sm text-[#d3e4fe]"
              />
            </div>
            <div>
              <p className="text-xs text-[#c7c4d7] font-semibold uppercase tracking-wider mb-1">Mã sinh viên (MSSV)</p>
              <input 
                type="text" 
                readOnly 
                value="SE202611" 
                className="w-full bg-[#1b2b3f] border border-[#464554]/40 rounded-lg py-2 px-3 text-sm text-[#d3e4fe]"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-[#c7c4d7] font-semibold uppercase tracking-wider mb-1">Email học tập</p>
              <input 
                type="text" 
                readOnly 
                value="khoinm.se202611@fpt.edu.vn" 
                className="w-full bg-[#1b2b3f] border border-[#464554]/40 rounded-lg py-2 px-3 text-sm text-[#d3e4fe]"
              />
            </div>
          </div>

          <div className="p-4 bg-[#8083ff]/10 border border-[#8083ff]/30 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold text-[#c0c1ff] uppercase tracking-wider">🔒 API Key quản lý nâng cao</h4>
            <p className="text-xs text-[#d3e4fe]">
              Dịch vụ sử dụng Gemini API Key server-side để xử lý thông tin bảo mật tối đa. Bạn có thể thay đổi hoặc update khóa bảo mật trong phần <strong>Settings &gt; Secrets</strong> trên giao diện tổng quan Google AI Studio.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};


/* ADMIN VIEW */
export const AdminView: React.FC = () => {
  return (
    <div className="space-y-6 select-none max-w-4xl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-7 h-7 text-[#c0c1ff]" />
        <div>
          <h2 className="text-2xl font-bold text-[#d3e4fe]">Bảng Quản trị viên</h2>
          <p className="text-sm text-[#c7c4d7] mt-1">Thống kê hoạt động, kiểm tra tài nguyên và giám sát hạn mức.</p>
        </div>
      </div>

      <div className="p-4 bg-[#1b2b3f]/30 border border-[#464554]/30 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#ffb783] shrink-0 mt-0.5" />
        <p className="text-xs text-[#c7c4d7] leading-relaxed">
          <strong>Thông tin hệ thống:</strong> Bảng điều khiển này cung cấp khả năng quan sát lượng yêu cầu tải lên, hoạt động thảo luận nhóm và đo lường tần suất sử dụng Trí tuệ Nhân tạo của AI Study Hub.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Stat Panel */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm text-[#d3e4fe] border-b border-[#464554]/35 pb-2">Tần suất dùng AI</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-[#c7c4d7] mb-1">
                <span>Số yêu cầu tóm tắt bằng Gemini</span>
                <span>85% (170/200 lần)</span>
              </div>
              <div className="w-full bg-[#1b2b3f] h-2 rounded-full overflow-hidden">
                <div className="bg-[#8083ff] h-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-[#c7c4d7] mb-1">
                <span>Số yêu cầu chat trực tiếp</span>
                <span>45% (225/500 lần)</span>
              </div>
              <div className="w-full bg-[#1b2b3f] h-2 rounded-full overflow-hidden">
                <div className="bg-[#8083ff] h-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Status System Logs */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 space-y-3">
          <h3 className="font-semibold text-sm text-[#d3e4fe] border-b border-[#464554]/35 pb-2">Hồ sơ nhật ký hệ thống</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#c7c4d7] border-b border-[#464554]/10 pb-1.5 text-[11px]">
              <span className="text-[#10B981] font-semibold">[SUCCESS] AI read "Cơ sở Dữ liệu.pdf"</span>
              <span className="text-[#c7c4d7]/50">Vừa xong</span>
            </div>
            <div className="flex justify-between text-[#c7c4d7] border-b border-[#464554]/10 pb-1.5 text-[11px]">
              <span className="font-semibold">[INFO] Nhóm CNTT K22 thêm 4 tệp mới</span>
              <span className="text-[#c7c4d7]/50">3 giờ trước</span>
            </div>
            <div className="flex justify-between text-[#c7c4d7] pb-0 text-[11px]">
              <span className="font-semibold">[AUTH] Đăng nhập gói Premium</span>
              <span className="text-[#c7c4d7]/50">Hôm qua</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


/* SUPPORT / HELP VIEW */
export const HelpView: React.FC = () => {
  return (
    <div className="space-y-6 select-none max-w-3xl">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-7 h-7 text-[#ffb783]" />
        <div>
          <h2 className="text-2xl font-bold text-[#d3e4fe]">Trợ giúp học tập</h2>
          <p className="text-sm text-[#c7c4d7] mt-1">Câu hỏi thường gặp và điều khoản vận hành dịch vụ AI Study Hub.</p>
        </div>
      </div>

      <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 space-y-4">
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold text-[#d3e4fe]">1. Làm thế nào để Trí tuệ Nhân tạo phân tích tự động?</h4>
          <p className="text-xs text-[#c7c4d7] leading-relaxed">
            Ngay khi bạn tải lên bất kỳ tệp tài liệu nào (PDF, DOCX, PPTX), AI Study Hub sẽ kích hoạt mô hình <strong>Gemini 3.5 Flash</strong> ở phía máy chủ, đọc hiểu tiêu đề và cấu trúc để đưa ra bảng tóm tắt lý thuyết, chủ đề cốt lõi cũng như lời khuyên học hỏi.
          </p>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold text-[#d3e4fe]">2. Làm thế nào để chat hoặc thảo luận cùng tài liệu ôn thi?</h4>
          <p className="text-xs text-[#c7c4d7] leading-relaxed">
            Bạn hãy di chuyển sang mục <strong>AI Chatbot</strong> bằng menu bên trái, sau đó chọn tài liệu đã tải lên trong hộp công cụ đính kèm và đặt câu hỏi. AI sẽ trích xuất lý thuyết và trả lời chuẩn xác.
          </p>
        </div>
      </div>
    </div>
  );
};
