import React, { useState } from 'react';
import { StudyGroup } from '@/types';
import { Folder, Plus, Search, MessageSquare, PlusCircle, Check, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';

interface GroupsViewProps {
  groups: StudyGroup[];
  setGroups: React.Dispatch<React.SetStateAction<StudyGroup[]>>;
  searchQuery: string;
}

const GroupsView: React.FC<GroupsViewProps> = ({ groups, setGroups, searchQuery }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'joined' | 'managed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Group fields
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'Class' | 'Project'>('Class');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupDesc.trim()) {
      toast.warn('Vui lòng điền đầy đủ tên nhóm và mô tả!');
      return;
    }

    const defaultCovers = {
      Class: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNQKu0KcMER-9yoVFPSG7bZ8AlMpf2vy20JCpoKa-tALAYbkR5fUEfdhkkffHQaym-dlH6hpfC8xW4diWBNrsGkkt6oYSTHfl_kXtf6JkXFZK_ycPGXax2t61apGGNGKmjv4e11nUW3TSF7jNBuWirKsniCbfgln3Jd1ky2BLDreKmYTrKzXBstjf5WeT4hP4ygrvKym8fHPskmcWy7h4z54rsVzieWLLqDspyKYgiKAag5XbBoFHDuRQedS3U5LRPoqFOYvDBalc',
      Project: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCOyiwhzbwg19MX86U0lL35odvNJn9ojWwu1-N849IqtXolCgEue4RALvSu6uQ3NlLYMh5VUxhZMn3DU-ZYmTf2vqrTkF2ceBMGSnMh_btp_0ZRCm4ctRVg3fjV7w5F2Zi-Cv1Fas-rxbdBf5sHbyi6qI0E7jd5AslSd9trvSvquNudzJE2mY9OwWXv48ILDJ08Yc6dVEN6QHSEButUrJv-QE6fOEKihU17w42xoNM8ZftjbXKpKMH56GCoiEY5mnffRi7b9qbNRo'
    };

    const newGroup: StudyGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      type: newGroupType,
      coverUrl: defaultCovers[newGroupType],
      description: newGroupDesc,
      membersCount: 1,
      membersCountBadge: '1',
      folderCount: 0,
      mockMembers: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDeIu6X_afgo0vR2SyhbuSVUPmFvww6JkOg3XzHDAjc643Po6akVAWkf66j78HU4nMeWT_zYrV7G3ubOiXfCJ6NTTm-Eyg8NOvdnON7q3-g1sqdByG54wr0mNMVmq4wPacZPkx-SJ9GA0yFopr8NLjGyFSG6U18oe6FmeEpapgkWoTwM7BLBIF2fiv6m8GaZ1iBYccOQ3Tw0-ZBxRaI5uqBFfq64ptKenlRLQE5bpJ27Tog19EvrhNoC8oI7Qnw8tZU309Xs5lfnGM'
      ]
    };

    setGroups(prev => [newGroup, ...prev]);
    toast.success(`Đã khởi tạo không gian nhóm học tập "${newGroupName}" thành công!`);

    // Reset fields
    setNewGroupName('');
    setNewGroupDesc('');
    setShowCreateModal(false);
  };

  const filteredGroups = groups.filter(g => {
    // Search filter
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'joined') return matchesSearch && g.id !== 'group-2'; // Mock selection
    if (activeTab === 'managed') return matchesSearch && g.id === 'group-2'; // Mock managed
    return matchesSearch;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#202124]">Nhóm học tập</h2>
          <p className="text-sm text-[#5f6368] mt-1">Quản lý không gian cộng tác và chia sẻ tài liệu cùng lớp.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#1967d2] hover:bg-[#1557b0] text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.01] active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo nhóm mới</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex gap-6 border-b border-[#e0e3e7] overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('all')}
          className={`text-sm pb-2 px-1 transition-all font-semibold ${activeTab === 'all' ? 'text-[#1967d2] border-b-2 border-[#1967d2]' : 'text-[#5f6368] hover:text-[#202124]'}`}
        >
          Tất cả nhóm
        </button>
        <button
          onClick={() => setActiveTab('joined')}
          className={`text-sm pb-2 px-1 transition-all font-semibold ${activeTab === 'joined' ? 'text-[#1967d2] border-b-2 border-[#1967d2]' : 'text-[#5f6368] hover:text-[#202124]'}`}
        >
          Đang tham gia
        </button>
        <button
          onClick={() => setActiveTab('managed')}
          className={`text-sm pb-2 px-1 transition-all font-semibold ${activeTab === 'managed' ? 'text-[#1967d2] border-b-2 border-[#1967d2]' : 'text-[#5f6368] hover:text-[#202124]'}`}
        >
          Quản lý
        </button>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGroups.map((g) => (
          <div
            key={g.id}
            className="group bg-white border border-[#e0e3e7] rounded-xl overflow-hidden hover:border-[#c7d2fe]/60 hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer relative"
          >
            {/* Cover photo with blended overlay */}
            <div className="h-32 bg-[#fafafa] relative overflow-hidden">
              <img
                alt={`${g.name} Cover`}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                src={g.coverUrl}
              />
              <div className="absolute top-3 right-3 flex gap-1">
                <span className="bg-white/90 backdrop-blur-md border border-[#e0e3e7] text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1.5 shadow-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${g.type === 'Class' ? 'bg-[#ffb783]' : 'bg-[#8b5cf6]'}`}></span>
                  {g.type}
                </span>
              </div>
            </div>

            {/* Title and stats detail */}
            <div className="p-4 flex flex-col flex-1 bg-white border-t border-[#f1f3f4]">
              <h3 className="text-sm font-semibold text-[#202124] group-hover:text-[#1967d2] transition-colors mb-1.5">
                {g.name}
              </h3>
              <p className="text-xs text-[#5f6368] line-clamp-2 leading-relaxed mb-4">
                {g.description}
              </p>

              {/* Members Avatars list and Document folders stats */}
              <div className="mt-auto pt-3 border-t border-[#f1f3f4] flex items-center justify-between">
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {g.mockMembers.map((url, index) => (
                    <img
                      key={index}
                      alt="thành viên"
                      className="w-6 h-6 rounded-full border border-white object-cover shrink-0"
                      src={url}
                    />
                  ))}
                  {g.membersCount > 3 && (
                    <div className="w-6 h-6 rounded-full border border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-[#5f6368] tracking-tight hover:text-[#202124] shrink-0 font-sans">
                      {g.membersCountBadge}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[#5f6368] text-xs font-semibold">
                  <Folder className="w-4 h-4 text-[#5f6368]/70" />
                  <span>{g.folderCount} mục</span>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* CREATE NEW STUDY GROUP DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-black/45 backdrop-blur-xs"></div>

          {/* Form */}
          <div className="relative bg-white border border-[#e0e3e7] rounded-xl w-full max-w-md overflow-hidden shadow-2xl z-10 text-slate-800">
            <div className="px-6 py-4 border-b border-[#e0e3e7] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#202124]">Tạo nhóm học tập mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#5f6368] hover:text-[#202124] p-1 rounded-full hover:bg-slate-150 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5f6368] mb-1.5 uppercase tracking-wider">Tên nhóm / Lớp học</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Đại số tuyến tinh K22, Đồ án Hệ thống thông tin"
                  className="w-full bg-white border border-[#e0e3e7] rounded-lg py-2.5 px-3 text-xs text-[#202124] focus:outline-none focus:border-[#1967d2] focus:ring-1 focus:ring-[#1967d2]/20"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5f6368] mb-1.5 uppercase tracking-wider">Loại hình</label>
                <select
                  className="w-full bg-white border border-[#e0e3e7] rounded-lg py-2.5 px-3 text-xs text-[#202124] focus:outline-none focus:border-[#1967d2] focus:ring-1 focus:ring-[#1967d2]/20"
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value as any)}
                >
                  <option value="Class">Học phần trực tiếp (Class)</option>
                  <option value="Project">Dự án khoa học / Bài tập lớn (Project)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5f6368] mb-1.5 uppercase tracking-wider">Mô tả mục tiêu</label>
                <textarea
                  required
                  rows={3}
                  placeholder="chia sẻ giáo trình, giải bài thi hay chuẩn bị slide tự học..."
                  className="w-full bg-white border border-[#e0e3e7] rounded-lg py-2 px-3 text-xs text-[#202124] focus:outline-none focus:border-[#1967d2] focus:ring-1 focus:ring-[#1967d2]/20 resize-none"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-[#e0e3e7] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs font-semibold py-2 px-4 rounded-lg text-[#5f6368] hover:bg-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#1967d2] hover:bg-[#1557b0] text-white font-semibold text-xs py-2 px-4 rounded-lg transition-all"
                >
                  Khởi tạo không gian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupsView;
