import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { createDocumentShareLink, getDocumentShareLinks, revokeDocumentShareLink, CreateShareLinkPayload } from '../../services/documentsApi';

interface ShareModalProps {
  isOpen: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  documentId,
  documentTitle,
  onClose,
}) => {
  const [permissionLevel, setPermissionLevel] = useState<'viewer' | 'editor'>('viewer');
  const [canDownload, setCanDownload] = useState(true);
  const [canComment, setCanComment] = useState(true);
  const [requiresLogin, setRequiresLogin] = useState(true);
  const [password, setPassword] = useState('');
  const [maxUses, setMaxUses] = useState(0);
  const [expiresInDays, setExpiresInDays] = useState(0);
  const [note, setNote] = useState('');

  const [existingLinks, setExistingLinks] = useState<any[]>([]);
  const [isFetchingLinks, setIsFetchingLinks] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !documentId) return;

    const loadExistingLinks = async () => {
      setIsFetchingLinks(true);
      setError('');
      try {
        const links = await getDocumentShareLinks(documentId);
        setExistingLinks(links);
        
        // If an existing link is found, pre-populate the form with its settings
        if (links.length > 0) {
          const activeLink = links[0];
          setPermissionLevel(activeLink.permissionLevel ?? 'viewer');
          setCanDownload(activeLink.canDownload ?? true);
          setCanComment(activeLink.canComment ?? true);
          setRequiresLogin(activeLink.requiresLogin ?? true);
          setMaxUses(activeLink.maxUses ?? 0);
          setExpiresInDays(activeLink.expiresInDays ?? 0);
          setNote(activeLink.note ?? '');
        }
      } catch (err: any) {
        console.error('Error fetching share links:', err);
      } finally {
        setIsFetchingLinks(false);
      }
    };

    loadExistingLinks();
  }, [isOpen, documentId]);

  const handleCopyLinkText = async (shareUrl: string, index: number) => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedIndex(index);
    toast.success('Đã sao chép liên kết chia sẻ!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRevokeLink = async (shareId: string) => {
    const toastId = toast.loading('Đang hủy bỏ liên kết chia sẻ...');
    try {
      await revokeDocumentShareLink(documentId, shareId);
      setExistingLinks((prev) => prev.filter((link) => link._id !== shareId));
      toast.update(toastId, {
        render: 'Đã hủy bỏ liên kết chia sẻ thành công!',
        type: 'success',
        isLoading: false,
        autoClose: 3000
      });
    } catch (err: any) {
      console.error(err);
      toast.update(toastId, {
        render: err.message || 'Lỗi khi hủy bỏ liên kết chia sẻ.',
        type: 'error',
        isLoading: false,
        autoClose: 3000
      });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload: CreateShareLinkPayload = {
      permissionLevel,
      canDownload,
      canComment,
      requiresLogin,
      passwordHash: password ? password : undefined, // sending plain password here as backend parameter passwordHash
      maxUses: Number(maxUses),
      expiresInDays: Number(expiresInDays),
      note: note ? note : undefined,
    };

    try {
      const result = await createDocumentShareLink(documentId, payload);
      
      // Determine sharing URL (Render public resolver link or local page resolver)
      // Since Render's endpoint is GET /shared/{token}, we construct the link pointing to it, 
      // or to the web app's route resolver if it existed. The sidebar resolves any link containing /shared/
      const shareUrl = `${window.location.origin}/shared/${result.token}`;
      
      await navigator.clipboard.writeText(shareUrl);
      toast.success(`Đã tạo và sao chép liên kết chia sẻ cho "${documentTitle}"!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tạo liên kết chia sẻ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 text-[#d3e4fe]">
      {/* Backdrop */}
      <div 
        onClick={() => !loading && onClose()} 
        className="absolute inset-0 bg-[#000f21]/78 backdrop-blur-xs" 
      />

      {/* Modal Box */}
      <div className="relative bg-[#102034] border border-[#464554]/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#464554]/40 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-[#d3e4fe]">Chia sẻ tài liệu</h3>
            <p className="text-xs text-[#c7c4d7] truncate max-w-[320px] mt-0.5">{documentTitle}</p>
          </div>
          <button 
            type="button" 
            disabled={loading}
            onClick={onClose}
            className="text-[#c7c4d7] hover:text-[#d3e4fe] p-1.5 rounded-full hover:bg-[#26364a] disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {loading || isFetchingLinks ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-10 h-10 text-[#c0c1ff] animate-spin" />
              <p className="text-sm font-bold text-[#d3e4fe]">
                {loading ? 'Đang tạo cấu hình chia sẻ...' : 'Đang tải liên kết chia sẻ...'}
              </p>
            </div>
          ) : (
            <>
              {/* Existing Links list */}
              {existingLinks.length > 0 && (
                <div className="bg-[#1b2b3f]/60 border border-[#464554]/40 rounded-xl p-4 space-y-2">
                  <span className="block text-xs font-semibold text-[#c7c4d7]/90 uppercase tracking-wider">
                    Liên kết chia sẻ hiện tại
                  </span>
                  <div className="space-y-2">
                    {existingLinks.map((link, idx) => {
                      const shareUrl = `${window.location.origin}/shared/${link.token}`;
                      return (
                        <div key={link._id || idx} className="flex items-center justify-between gap-3 bg-[#102034] border border-[#464554]/30 rounded-lg p-2.5">
                          <span className="text-xs text-[#d3e4fe] truncate flex-1 select-all font-mono" title={shareUrl}>
                            {shareUrl}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyLinkText(shareUrl, idx)}
                              className="text-[#c0c1ff] hover:text-[#e1e0ff] p-1.5 rounded hover:bg-[#26364a] cursor-pointer"
                              title="Sao chép"
                            >
                              {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                            {link._id && (
                              <button
                                type="button"
                                onClick={() => handleRevokeLink(link._id)}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 cursor-pointer"
                                title="Thu hồi liên kết"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Permission Level */}
              <div>
                <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                  Quyền truy cập
                </label>
                <select
                  value={permissionLevel}
                  onChange={(e) => setPermissionLevel(e.target.value as any)}
                  className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] focus:outline-none focus:border-[#c0c1ff]"
                >
                  <option value="viewer">Người xem (Viewer)</option>
                  <option value="editor">Người chỉnh sửa (Editor)</option>
                </select>
              </div>

              {/* Checkboxes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <label className="flex items-center gap-2.5 text-xs text-[#c7c4d7] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={canDownload}
                    onChange={(e) => setCanDownload(e.target.checked)}
                    className="w-4 h-4 rounded border-[#464554]/60 bg-[#1b2b3f] text-[#8083ff] focus:ring-0 cursor-pointer"
                  />
                  <span>Cho phép tải xuống</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#c7c4d7] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={canComment}
                    onChange={(e) => setCanComment(e.target.checked)}
                    className="w-4 h-4 rounded border-[#464554]/60 bg-[#1b2b3f] text-[#8083ff] focus:ring-0 cursor-pointer"
                  />
                  <span>Cho phép bình luận</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#c7c4d7] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requiresLogin}
                    onChange={(e) => setRequiresLogin(e.target.checked)}
                    className="w-4 h-4 rounded border-[#464554]/60 bg-[#1b2b3f] text-[#8083ff] focus:ring-0 cursor-pointer"
                  />
                  <span>Yêu cầu đăng nhập</span>
                </label>
              </div>

              {/* Limits / Expirations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                    Lượt sử dụng tối đa <span className="text-[10px] text-[#c7c4d7]/60">(0 = không giới hạn)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] focus:outline-none focus:border-[#c0c1ff]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                    Hết hạn sau số ngày <span className="text-[10px] text-[#c7c4d7]/60">(0 = không hết hạn)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] focus:outline-none focus:border-[#c0c1ff]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider font-sans">
                  Mật khẩu bảo vệ <span className="text-[#c7c4d7]/50 font-normal normal-case">(tuỳ chọn)</span>
                </label>
                <input
                  type="password"
                  placeholder="Để trống nếu không đặt mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] placeholder:text-[#c7c4d7]/40 focus:outline-none focus:border-[#c0c1ff]"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-[#c7c4d7]/90 mb-1.5 uppercase tracking-wider">
                  Ghi chú chia sẻ <span className="text-[#c7c4d7]/50 font-normal normal-case">(tuỳ chọn)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về liên kết này..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-[#1b2b3f] border border-[#464554]/60 rounded-xl py-2.5 px-4 text-sm text-[#d3e4fe] placeholder:text-[#c7c4d7]/40 focus:outline-none focus:border-[#c0c1ff] resize-none"
                />
              </div>

              {/* Error Info */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-xs text-red-400">
                  Lỗi: {error}
                </div>
              )}

              {/* Footer */}
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
                  className="bg-[#c0c1ff] hover:bg-[#e1e0ff] text-[#1000a9] font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-md cursor-pointer"
                >
                  Tạo & Sao chép liên kết
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ShareModal;
