import React from 'react';
import { StudyDocument, StudyGroup } from '../types';
import { FileText, Users, Bot, Star, Activity, Sparkles, BookOpen } from 'lucide-react';

interface DashboardViewProps {
  documents: StudyDocument[];
  groups: StudyGroup[];
  setActiveTab: (tab: string) => void;
  openUploadModal: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  groups,
  setActiveTab,
  openUploadModal,
}) => {
  const totalDocs = documents.length;
  const totalGroups = groups.length;
  const favDocs = documents.filter((d) => d.isFavorite).length;

  // Render recent documents
  const recentDocs = documents.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="bg-gradient-to-r from-[#102034] to-[#26364a] border border-[#464554]/50 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BookOpen className="w-40 h-40 text-[#c0c1ff]" />
        </div>
        <div className="max-w-xl space-y-2 z-10 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8083ff]/20 text-[#c0c1ff] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Study Hub Premium</span>
          </div>
          <h2 className="text-2xl font-bold text-[#d3e4fe]">Chào mừng trở lại, Nguyễn Minh Khôi!</h2>
          <p className="text-sm text-[#c7c4d7] leading-relaxed">
            Hôm nay bạn muốn tích lũy kiến thức gì nào? Hệ thống đã sẵn sàng hỗ trợ tóm tắt tài liệu, 
            giải toán Cao cấp và đồng hành cùng nhóm học tập của bạn.
          </p>
          <div className="pt-3 flex gap-3">
            <button
              onClick={openUploadModal}
              className="bg-[#c0c1ff] hover:bg-[#e1e0ff] text-[#1000a9] text-xs font-semibold px-4 py-2 rounded-lg transition-transform duration-100 hover:scale-[1.02] cursor-pointer"
            >
              Tải tài liệu mới
            </button>
            <button
              onClick={() => setActiveTab('chatbot')}
              className="bg-[#26364a] hover:bg-[#1b2b3f] text-[#c0c1ff] border border-[#464554]/40 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Hỏi Trợ lý AI
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 hover:border-[#c0c1ff]/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-sm font-semibold">Live</span>
          </div>
          <p className="text-xs text-[#c7c4d7]/80 uppercase tracking-wider font-semibold">Tổng tài liệu</p>
          <p className="text-2xl font-bold text-[#d3e4fe] mt-1">{totalDocs}</p>
          <p className="text-xs text-[#c7c4d7] mt-1.5">+2 tệp tải lên tuần này</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 hover:border-[#c0c1ff]/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#c7c4d7]/80 uppercase tracking-wider font-semibold">Nhóm tham gia</p>
          <p className="text-2xl font-bold text-[#d3e4fe] mt-1">{totalGroups}</p>
          <p className="text-xs text-[#c7c4d7] mt-1.5">3 nhóm học tập tích cực</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 hover:border-[#c0c1ff]/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#8083ff] bg-[#8083ff]/10 px-2 py-0.5 rounded-sm font-semibold">Active</span>
          </div>
          <p className="text-xs text-[#c7c4d7]/80 uppercase tracking-wider font-semibold">AI phân tích</p>
          <p className="text-2xl font-bold text-[#d3e4fe] mt-1">100%</p>
          <p className="text-xs text-[#c7c4d7] mt-1.5">Tự động hóa học tập</p>
        </div>

        {/* Card 4 */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 hover:border-[#c0c1ff]/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
              <Star className="w-5 h-5 flex justify-center text-center font-bold" />
            </div>
          </div>
          <p className="text-xs text-[#c7c4d7]/80 uppercase tracking-wider font-semibold">Tài liệu yêu thích</p>
          <p className="text-2xl font-bold text-[#d3e4fe] mt-1">{favDocs}</p>
          <p className="text-xs text-[#c7c4d7] mt-1.5">Ôn tập nhanh nhanh chóng</p>
        </div>
      </div>

      {/* Main Grid: Recent Activities & Study Activity Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Uploads & Quick Look */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#c0c1ff]" />
              <h3 className="font-semibold text-[#d3e4fe]">Tài liệu gần đây</h3>
            </div>
            <button 
              onClick={() => setActiveTab('documents')}
              className="text-xs text-[#c0c1ff] hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {recentDocs.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => setActiveTab('documents')}
                className="flex items-center justify-between p-3.5 bg-[#0b1c30]/70 rounded-xl border border-[#464554]/20 hover:border-[#c0c1ff]/20 transition-all hover:translate-x-1 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 bg-[#EF4444]/10 rounded-lg text-lg flex items-center justify-center font-bold" 
                    style={{ color: doc.iconBg, backgroundColor: `${doc.iconBg}15` }}
                  >
                    <span>{doc.type.toUpperCase()}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#d3e4fe] max-w-[250px] sm:max-w-sm truncate group-hover:text-[#c0c1ff]">
                      {doc.title}
                    </h4>
                    <span className="text-xs text-[#c7c4d7] flex items-center gap-2 mt-0.5">
                      <span>{doc.size}</span>
                      <span className="w-1 h-1 bg-[#464554] rounded-full"></span>
                      <span>{doc.lastModified}</span>
                    </span>
                  </div>
                </div>

                <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                  <span>AI Sẵn sàng</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Study Activity / Daily Streak tracker */}
        <div className="bg-[#102034] border border-[#464554]/45 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[#ffb783]" />
              <h3 className="font-semibold text-[#d3e4fe]">Tiến độ học tập</h3>
            </div>

            {/* Daily Streak visual */}
            <div className="p-4 bg-[#0b1c30]/60 border border-[#464554]/25 rounded-xl text-center space-y-1">
              <span className="text-3xl">🔥</span>
              <p className="text-2xl font-bold text-[#ffdcc5]">5 ngày liên tiếp!</p>
              <p className="text-xs text-[#c7c4d7]">Duy trì phong độ học tập tuyệt vời của bạn.</p>
            </div>

            {/* Simulated Week Chart */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs text-[#c7c4d7] font-medium px-1">
                <span>Thứ 2</span>
                <span>Thứ 3</span>
                <span>Thứ 4</span>
                <span>Thứ 5</span>
                <span>Thứ 6</span>
                <span>Thứ 7</span>
                <span>CN</span>
              </div>
              <div className="flex justify-between items-end h-16 px-2 pt-2">
                <div className="w-6 bg-[#3B82F6]/60 hover:bg-[#3B82F6] h-10 rounded-sm transition-all" title="40 phút"></div>
                <div className="w-6 bg-[#3B82F6]/60 hover:bg-[#3B82F6] h-14 rounded-sm transition-all" title="65 phút"></div>
                <div className="w-6 bg-[#3B82F6]/60 hover:bg-[#3B82F6] h-8 rounded-sm transition-all" title="30 phút"></div>
                <div className="w-6 bg-[#3B82F6]/60 hover:bg-[#3B82F6] h-12 rounded-sm transition-all" title="55 phút"></div>
                <div className="w-6 bg-[#8083ff] h-16 rounded-sm transition-all" title="75 phút"></div>
                <div className="w-6 bg-[#1b2b3f] h-3 rounded-sm"></div>
                <div className="w-6 bg-[#1b2b3f] h-2 rounded-sm"></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#464554]/20 mt-4 text-center">
            <span className="text-xs text-[#c7c4d7]">
              Mục tiêu học tuần: <strong>225 / 300 phút</strong>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardView;
