import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Calendar,
  HardDrive,
  Brain,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  UserCheck2,
  Edit,
  Save,
  X,
  Camera,
  Eye,
  EyeOff,
  Lock
} from "lucide-react";
import { getCurrentUserProfile, updateUserProfile, changeUserPassword } from "@/services/authApi";
import type { UserProfile } from "@/types/auth";
import { toast } from "react-toastify";

interface ProfileViewProps {
  onUpdateUser?: (updatedFields: { fullName: string; username: string; avatarUrl?: string }) => void;
}

export default function ProfileView({ onUpdateUser }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Editing states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>("");
  const [editUsername, setEditUsername] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
      setEditFullName(data.fullName);
      setEditUsername(data.username);
    } catch (err: any) {
      console.error("Lỗi lấy thông tin hồ sơ:", err);
      setError(err.message || "Không thể lấy thông tin hồ sơ cá nhân.");
      toast.error(err.message || "Lỗi khi tải thông tin hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Clean up avatar preview URL
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreviewUrl(url);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim() || !editUsername.trim()) {
      toast.warning("Họ tên và Tên đăng nhập không được để trống!");
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = await updateUserProfile({
        fullName: editFullName.trim(),
        username: editUsername.trim(),
        avatarFile: selectedAvatarFile || undefined,
      });

      // Update local state profile
      setProfile((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          fullName: updatedData.fullName,
          username: updatedData.username,
          avatarUrl: updatedData.avatarUrl,
        };
      });

      // Synchronize changes to global App state / Topbar
      if (onUpdateUser) {
        onUpdateUser({
          fullName: updatedData.fullName,
          username: updatedData.username,
          avatarUrl: updatedData.avatarUrl,
        });
      }

      toast.success("Cập nhật thông tin hồ sơ thành công!");
      setIsEditing(false);
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl(null);
    } catch (err: any) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      toast.error(err.message || "Cập nhật thông tin thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warning("Vui lòng điền đầy đủ tất cả các trường mật khẩu!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning("Mật khẩu mới và Xác nhận mật khẩu mới không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.warning("Mật khẩu mới phải có tối thiểu 6 ký tự!");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Thay đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Lỗi thay đổi mật khẩu:", err);
      toast.error(err.message || "Thay đổi mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 select-none animate-pulse max-w-4xl">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded-lg w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded-lg w-2/5"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
          <div className="w-24 h-24 rounded-full bg-slate-200 shrink-0"></div>
          <div className="flex-1 space-y-3 w-full">
            <div className="h-6 bg-slate-200 rounded-lg w-1/3"></div>
            <div className="h-4 bg-slate-200 rounded-lg w-1/2"></div>
            <div className="flex gap-2">
              <div className="h-5 bg-slate-200 rounded-md w-16"></div>
              <div className="h-5 bg-slate-200 rounded-md w-24"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 h-56 shadow-sm"></div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 h-56 shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6 select-none max-w-4xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h2>
            <p className="text-sm text-slate-500 mt-1">Thông tin chi tiết tài khoản.</p>
          </div>
        </div>

        <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-200 space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <p className="text-base font-bold text-slate-800">Đã xảy ra lỗi khi tải hồ sơ</p>
            <p className="text-sm text-slate-500 mt-1">{error || "Không thể lấy thông tin."}</p>
          </div>
          <button
            onClick={fetchProfileData}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer border border-transparent shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const storageUsed = profile.storage?.usedBytes ?? 0;
  const storageTotal = profile.storage?.totalBytes ?? 1;
  const storagePercent = Math.min((storageUsed / storageTotal) * 100, 100);

  const aiUsed = profile.storage?.aiQueriesUsed ?? 0;
  const aiLimit = profile.storage?.aiQueriesLimit ?? 1;
  const aiPercent = Math.min((aiUsed / aiLimit) * 100, 100);

  return (
    <div className="space-y-6 select-none max-w-4xl animate-fade-in">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hồ sơ cá nhân</h2>
          <p className="text-sm text-slate-500 mt-1">Xem thông tin tài khoản và hạn mức sử dụng dịch vụ.</p>
        </div>
        <button
          onClick={fetchProfileData}
          title="Tải lại thông tin"
          className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 rounded-full transition-all text-slate-500 hover:text-slate-700 cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-6 shadow-sm">
        <div className="relative shrink-0 self-center md:self-start">
          <div
            onClick={isEditing ? handleAvatarClick : undefined}
            className={`w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 shadow-sm relative group ${isEditing ? 'cursor-pointer' : ''}`}
          >
            <img
              src={avatarPreviewUrl || profile.avatarUrl}
              alt={profile.fullName}
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 hover:bg-black/60 flex flex-col items-center justify-center transition-colors text-white text-[10px] font-bold">
                <Camera className="w-5 h-5 mb-0.5 text-white" />
                <span>Thay ảnh</span>
              </div>
            )}
          </div>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={isSaving}
          />
          {profile.isEmailVerified && !isEditing && (
            <span className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm border border-emerald-100">
              <CheckCircle className="w-5 h-5 text-emerald-500 fill-white" />
            </span>
          )}
        </div>

        <div className="flex-1 w-full space-y-3">
          {!isEditing ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2.5 justify-center md:justify-start">
                    <h3 className="text-xl font-bold text-slate-800">{profile.fullName}</h3>
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {profile.role === "admin" ? "Quản trị viên" : "Học viên"}
                      </span>
                      {profile.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600">
                          Ngưng hoạt động
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium mt-1">@{profile.username}</p>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setEditFullName(profile.fullName);
                      setEditUsername(profile.username);
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Chỉnh sửa hồ sơ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-500 max-w-xl border-t border-slate-100 pt-3 text-left">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email: <strong className="text-slate-700">{profile.email}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Ngày tạo: <strong className="text-slate-700">{formatDate(profile.createdAt)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Lần đăng nhập cuối: <strong className="text-slate-700">{formatDate(profile.lastLoginAt)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck2 className="w-4 h-4 text-slate-400" />
                  <span>Xác thực: <strong className="text-slate-700">{profile.isEmailVerified ? "Đã xác minh Email" : "Chưa xác minh Email"}</strong></span>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="w-full space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa thông tin</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 md:self-start">
                  {profile.role === "admin" ? "Quản trị viên" : "Học viên"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider text-left">Họ và tên</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    disabled={isSaving}
                    required
                    placeholder="Nhập họ và tên"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider text-left">Tên đăng nhập (Username)</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={isSaving}
                    required
                    placeholder="Nhập tên đăng nhập"
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedAvatarFile(null);
                    setAvatarPreviewUrl(null);
                  }}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-1.5 px-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Quotas & Limitations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Storage Info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-800">Dung lượng lưu trữ</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
              Gói {profile.storage?.plan}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs text-slate-500 font-medium">
              <span>Đã sử dụng</span>
              <span>
                <strong className="text-slate-800">{formatBytes(storageUsed)}</strong> / {formatBytes(storageTotal)} ({storagePercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-50">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${storagePercent}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Tải lên tối đa:</span>
              <span className="text-slate-700 font-semibold">{formatBytes(profile.storage?.maxFileSizeBytes ?? 0)} / tệp</span>
            </div>
            <div className="flex justify-between">
              <span>Giới hạn số lượng tệp:</span>
              <span className="text-slate-700 font-semibold">{profile.storage?.maxFilesCount ?? 0} tệp</span>
            </div>
          </div>
        </div>

        {/* AI Queries Limit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-800">Hạn mức câu hỏi AI (Gemini)</h4>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs text-slate-500 font-medium">
              <span>Truy vấn đã dùng</span>
              <span>
                <strong className="text-slate-800">{aiUsed}</strong> / {aiLimit} lượt ({aiPercent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-50">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${aiPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-2 pt-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Ngày đặt lại hạn mức:</span>
              <span className="text-slate-700 font-semibold">{formatDate(profile.storage?.quotaResetDate)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h4 className="font-bold text-sm text-slate-800">Thay đổi mật khẩu</h4>
        </div>

        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider text-left">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPassword}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider text-left">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPassword}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider text-left">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isChangingPassword}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isChangingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
