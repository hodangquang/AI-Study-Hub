import React, { useState } from 'react';
import { StudyDocument } from '@/types';
import { Trash2, RotateCcw, ShieldCheck, AlertCircle, Settings, User, Bell, HardDrive, Key, HelpCircle } from 'lucide-react';
import CustomDialog from '@/components/ui/CustomDialog';
import { toast } from 'react-toastify';

/* TRASH VIEW */
interface TrashViewProps {
  documents: StudyDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<StudyDocument[]>>;
}

export const TrashView: React.FC<TrashViewProps> = ({ documents, setDocuments }) => {
  const deletedDocs = documents.filter((d) => d.isDeleted);
  
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

  const handleRestore = (docId: string) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isDeleted: false } : d));
    toast.success('Đã khôi phục tài liệu thành công!');
  };

  const handlePermanentDelete = (docId: string) => {
    setDialogConfig({
      title: 'Xóa vĩnh viễn',
      message: 'Bạn có đồng ý xóa vĩnh viễn tài liệu này khỏi hệ thống? Thao tác này không thể thu hồi.',
      confirmLabel: 'Xóa vĩnh viễn',
      isDanger: true,
      onConfirm: () => {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        setDialogConfig(null);
      }
    });
  };

  const handleEmptyTrash = () => {
    setDialogConfig({
      title: 'Dọn sạch thùng rác',
      message: 'Dọn sạch hệ thống thùng rác? Tất cả tệp dữ liệu sẽ bị hủy bỏ vĩnh viễn.',
      confirmLabel: 'Dọn sạch',
      isDanger: true,
      onConfirm: () => {
        setDocuments(prev => prev.filter(d => !d.isDeleted));
        setDialogConfig(null);
      }
    });
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Thùng rác</h2>
          <p className="text-sm text-slate-500 mt-1">Nơi lưu trữ các tài liệu đã bị xóa trong 30 ngày qua trước khi biến mất.</p>
        </div>
        {deletedDocs.length > 0 && (
          <button 
            type="button"
            onClick={handleEmptyTrash}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-red-500/15"
          >
            Dọn sạch Thùng rác
          </button>
        )}
      </div>

      {deletedDocs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-sm">
          <Trash2 className="w-10 h-10 text-slate-400 mx-auto opacity-70" />
          <p className="text-sm text-slate-500">Thư mục thùng rác hiện tại trống rỗng.</p>
        </div>
      ) : (
        <div className="space-y-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          {deletedDocs.map((doc) => (
            <div 
              key={doc.id}
              className="flex items-center justify-between p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50/5 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-10 rounded-lg text-xs font-black tracking-widest flex items-center justify-center shrink-0"
                  style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                >
                  {doc.type.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 truncate max-w-xs">{doc.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.size} • Đã xóa gần đây</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleRestore(doc.id)}
                  className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="Khôi phục tài liệu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục</span>
                </button>
                <button 
                  onClick={() => handlePermanentDelete(doc.id)}
                  className="text-xs font-semibold py-1.5 px-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Xóa vĩnh viễn
                </button>
              </div>
            </div>
          ))}
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
    </div>
  );
};


/* SETTINGS VIEW */
export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 select-none max-w-4xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Cài đặt</h2>
        <p className="text-sm text-slate-500 mt-1">Cấu hình hồ sơ, gói đăng ký và cài đặt AI cá nhân.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation panel */}
        <div className="space-y-1 md:col-span-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold text-left">
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium text-left transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span>Thông báo</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium text-left transition-colors cursor-pointer">
            <HardDrive className="w-4 h-4" />
            <span>Không gian lưu trữ</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium text-left transition-colors cursor-pointer">
            <Key className="w-4 h-4" />
            <span>Bảo mật hệ thống</span>
          </button>
        </div>

        {/* Content detail panels */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:col-span-2 space-y-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Hồ sơ sinh viên</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Họ và tên</p>
              <input 
                type="text" 
                readOnly 
                value="Nguyễn Văn A" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm text-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Mã sinh viên (MSSV)</p>
              <input 
                type="text" 
                readOnly 
                value="SE202611" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm text-slate-700 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1.5">Email học tập</p>
              <input 
                type="text" 
                readOnly 
                value="testuser@gmail.com" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">🔒 API Key quản lý nâng cao</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
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
    <div className="space-y-6 select-none max-w-4xl animate-fade-in">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-7 h-7 text-indigo-600" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Bảng Quản trị viên</h2>
          <p className="text-sm text-slate-500 mt-1">Thống kê hoạt động, kiểm tra tài nguyên và giám sát hạn mức.</p>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Thông tin hệ thống:</strong> Bảng điều khiển này cung cấp khả năng quan sát lượng yêu cầu tải lên, hoạt động thảo luận nhóm và đo lường tần suất sử dụng Trí tuệ Nhân tạo của AI Study Hub.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Stat Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Tần suất dùng AI</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span>Số yêu cầu tóm tắt bằng Gemini</span>
                <span>85% (170/200 lần)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                <span>Số yêu cầu chat trực tiếp</span>
                <span>45% (225/500 lần)</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Status System Logs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-3">Hồ sơ nhật ký hệ thống</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 border-b border-slate-50 pb-2 text-[11px]">
              <span className="text-emerald-600 font-semibold">[SUCCESS] AI read "Cơ sở Dữ liệu.pdf"</span>
              <span className="text-slate-400">Vừa xong</span>
            </div>
            <div className="flex justify-between text-slate-600 border-b border-slate-50 pb-2 text-[11px]">
              <span className="font-semibold text-slate-700">[INFO] Nhóm CNTT K22 thêm 4 tệp mới</span>
              <span className="text-slate-400">3 giờ trước</span>
            </div>
            <div className="flex justify-between text-slate-600 pb-0 text-[11px]">
              <span className="font-semibold text-slate-700">[AUTH] Đăng nhập gói Premium</span>
              <span className="text-slate-400">Hôm qua</span>
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
    <div className="space-y-6 select-none max-w-3xl animate-fade-in">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-7 h-7 text-amber-500" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Trợ giúp học tập</h2>
          <p className="text-sm text-slate-500 mt-1">Câu hỏi thường gặp và điều khoản vận hành dịch vụ AI Study Hub.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            1. Làm thế nào để Trí tuệ Nhân tạo phân tích tự động?
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
            Ngay khi bạn tải lên bất kỳ tệp tài liệu nào (PDF, DOCX, PPTX), AI Study Hub sẽ kích hoạt mô hình <strong>Gemini 3.5 Flash</strong> ở phía máy chủ, đọc hiểu tiêu đề và cấu trúc để đưa ra bảng tóm tắt lý thuyết, chủ đề cốt lõi cũng như lời khuyên học hỏi.
          </p>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            2. Làm thế nào để chat hoặc thảo luận cùng tài liệu ôn thi?
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed pl-3.5">
            Bạn hãy di chuyển sang mục <strong>AI Chatbot</strong> bằng menu bên trái, sau đó chọn tài liệu đã tải lên trong hộp công cụ đính kèm và đặt câu hỏi. AI sẽ trích xuất lý thuyết và trả lời chuẩn xác.
          </p>
        </div>
      </div>
    </div>
  );
};
