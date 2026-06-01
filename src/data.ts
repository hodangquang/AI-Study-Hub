import { StudyDocument, StudyGroup } from './types';

export const INITIAL_DOCUMENTS: StudyDocument[] = [
  {
    id: 'doc-1',
    title: 'Giáo trình Cơ sở Dữ liệu.pdf',
    type: 'pdf',
    size: '2.4 MB',
    category: 'chuyên ngành',
    status: 'ready',
    lastModified: 'Sửa 2 ngày trước',
    isFavorite: true,
    iconBg: '#EF4444' // red
  },
  {
    id: 'doc-2',
    title: 'Đề cương ôn tập.docx',
    type: 'docx',
    size: '1.1 MB',
    category: ' đại cương',
    status: 'ready',
    lastModified: 'Vừa tải lên',
    isFavorite: false,
    iconBg: '#3B82F6' // blue
  },
  {
    id: 'doc-3',
    title: 'Bài thuyết trình.pptx',
    type: 'pptx',
    size: '5.6 MB',
    category: 'chuyên ngành',
    status: 'ready',
    lastModified: 'Sửa 1 tuần trước',
    isFavorite: false,
    iconBg: '#8B5CF6' // purple
  },
  {
    id: 'doc-4',
    title: 'Giải tích 1 - Bài tập ôn thi cuối kỳ.pdf',
    type: 'pdf',
    size: '4.2 MB',
    category: ' đại cương',
    status: 'ready',
    lastModified: 'Sửa 2 giờ trước',
    isFavorite: true,
    iconBg: '#EF4444'
  },
  {
    id: 'doc-5',
    title: 'Cấu trúc dữ liệu và Giải thuật - Ghi chú.docx',
    type: 'docx',
    size: '1.8 MB',
    category: 'chuyên ngành',
    status: 'ready',
    lastModified: 'Sửa hôm qua',
    isFavorite: true,
    iconBg: '#3B82F6'
  },
  {
    id: 'doc-6',
    title: 'Trí tuệ nhân tạo - Bài giảng tuần 5.pptx',
    type: 'pptx',
    size: '8.5 MB',
    category: 'chuyên ngành',
    status: 'ready',
    lastModified: 'Sửa 3 ngày trước',
    isFavorite: true,
    iconBg: '#8B5CF6'
  },
  {
    id: 'doc-7',
    title: 'Kinh tế vĩ mô - Tổng hợp công thức.pdf',
    type: 'pdf',
    size: '3.1 MB',
    category: ' đại cương',
    status: 'ready',
    lastModified: 'Sửa 5 ngày trước',
    isFavorite: true,
    iconBg: '#EF4444'
  },
  {
    id: 'doc-8',
    title: 'Hóa học hữu cơ - Báo cáo thí nghiệm.pdf',
    type: 'pdf',
    size: '2.9 MB',
    category: ' đại cương',
    status: 'ready',
    lastModified: 'Sửa 1 tuần trước',
    isFavorite: true,
    iconBg: '#EF4444'
  }
];

export const INITIAL_GROUPS: StudyGroup[] = [
  {
    id: 'group-1',
    name: 'CNTT K22',
    type: 'Class',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNQKu0KcMER-9yoVFPSG7bZ8AlMpf2vy20JCpoKa-tALAYbkR5fUEfdhkkffHQaym-dlH6hpfC8xW4diWBNrsGkkt6oYSTHfl_kXtf6JkXFZK_ycPGXax2t61apGGNGKmjv4e11nUW3TSF7jNBuWirKsniCbfgln3Jd1ky2BLDreKmYTrKzXBstjf5WeT4hP4ygrvKym8fHPskmcWy7h4z54rsVzieWLLqDspyKYgiKAag5XbBoFHDuRQedS3U5LRPoqFOYvDBalc',
    description: 'Nơi trao đổi tài liệu, bài giảng và thảo luận các môn học chuyên ngành Khoa học máy tính khóa 22.',
    membersCount: 45,
    membersCountBadge: '+42',
    folderCount: 128,
    mockMembers: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDsQCm4zAGFdAxBch1jEAeTmQid4YD6qNBw_MMHoWo9KTiDsGRyYJYevSg9JKBC5CsUw_60ABOywRRz69IicyyK-uqJpH9YTRKdxUypOve878SQ-b56LFdGgtIG_fGLNQDCTCc1q9jr8gdubP3460gsDyrUdJgUngET-RZuEjEmzSsXYbnvcvpE0dbX7a4H2s5QVVmHPNQZpoZ7ZKNNdUB-88ZrfOQR84MCIXBi5LQhp9b3qM4yCZlDN3t3N1IIQ3pSNRMXy1GF-2U',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCCCdeHkoe4vljNR27exkvrdKxvf5kGOR4FwvVCGiDl5sQ-z1RYTRNgfWW6nHiL22bpf0KdCGOtXvM_w0APlwL7XZYlbT1D-nFeCjbtXM5txrircex1itrb5L_zQ1r7Z7giqqnjGCPBS3cjW2rEeeTj8QTIkwtdmq7VYclfzCW_D8xrXR3WSLd6QZajpQDhi1jfL309cNa4NtX9Q5YR3o-7JSTQn-1ZK1KN0uT17Wwu2JTuBZQcUhfA1jyrzBNc2sYb4oYK8YVaR-c',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAA1rvkATLHVp8842z9TxkTbHRyjqsNW0Oyae7rY7Baf14ncdfWoZUTy5M2EY8Cpkjg4wztJFH3D6CzIIO2PY9Xm0VygKhjyEBqH4n0czkZW7vqHSk4LKfedqHloI1QHuwym8lYjmLjFiF3fB8msDQR90g9QoiavzXnFMJq0ZDv0zkxJ2Q_aeP9ptyM9oEYut90hWrho0Kv4AoV1NHedv071p-4DrIonWEYY3sET-_QzpjuWdHcUdS26RXwpwAoZa9vg0OS4lHZx_U'
    ]
  },
  {
    id: 'group-2',
    name: 'Đồ án Tốt nghiệp',
    type: 'Project',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCOyiwhzbwg19MX86U0lL35odvNJn9ojWwu1-N849IqtXolCgEue4RALvSu6uQ3NlLYMh5VUxhZMn3DU-ZYmTf2vqrTkF2ceBMGSnMh_btp_0ZRCm4ctRVg3fjV7w5F2Zi-Cv1Fas-rxbdBf5sHbyi6qI0E7jd5AslSd9trvSvquNudzJE2mY9OwWXv48ILDJ08Yc6dVEN6QHSEButUrJv-QE6fOEKihU17w42xoNM8ZftjbXKpKMH56GCoiEY5mnffRi7b9qbNRo',
    description: 'Nhóm nghiên cứu phát triển hệ thống RAG cho quản lý tri thức nội bộ. Cập nhật tiến độ hàng tuần.',
    membersCount: 4,
    membersCountBadge: '4',
    folderCount: 45,
    mockMembers: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCurRcJlaif8Yhf6hIhG67akxJQyYFcLaj1CwxQceRp1c8UN0goWFuTOxbWgEOv5_RqOp06QWJg_xlAYtdkbRYtP-Eyvr3lsiXLKtBf8bF-ajOTvTtGeSsHQEdVPz2PY_L_M3bpZbujM9D5GQKXbTSD1-Bc4xFYpMpJKOuW7jlR28Aq82DAYU9R_ClyujlWegPif_mRbDDn8ByAM4q2gWDXfFmJa9cL6_DI4s1xx1yueaErBQyWagoOaKS8u3Kyk0S_5DX2CC9xInk',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA3HYXuWWTn7jSIDWlrTgoq4PQWYN-aGjV2PRZbKpjG3ZMVqMpuAbf_OY6xypldOBquFNCQAOPsXyJa9TJSDfkHxPHUFolHGiRJj8EYHnNFeTbYjQovEB8TnbSyPU_6kZ-jVyyEYHPS4aIgSS19s6N3e7iIwnlYDsFAyi44y_LGx_dW_APYjRorfdbtEehNtD5ccaq61dC97YRWSn4rhJvNQMeKvLO7iAE566jTYBsvOdyfkobt7r2Bg6BcSj824kpECD269AObSDM',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHUPaauyDVgDQJWkzRYr2y38I5L05niI6ReElSSq4LZYAdNZU_eZmaRl0Q4vbkDV3pBAedH8HuFIqZOUvbXlnl4rFrpw-u9htSCqNkugUMmwvquHYCCCCx9C8v-0F6KNfioYaZz_8wh6hFTPx4xYg1zaLvgIJMqDWx00IUOMh_mlOT8_k7srSUgPi9bs6PBzhVFR3k2DmWkPtRZk3Hn-R_bJXZU9gxGroWFQsmRXCwhpVhXEL4bKrQTjSPadbTCkbNyKQs-TnUYmc'
    ]
  },
  {
    id: 'group-3',
    name: 'Marketing Team',
    type: 'Project',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZY6Jm4g7O74rKP0UmsoH1xON6dHd1fFFTnfgce0jpChvaI4s0yKUPHA15m8JpXl2-AaWeYG9CiyMiqjLqbO85aVNsuSItH1DfdtD-wIj-TZ2x7QPD4Dc2GhE3a0YFPCte5ITW8XWLs7KEllOAwWPOxK9GhnOUDAqn17YGVq_l5WxEBqPyMDmW7CELyhs0NBUcdMzfn6yJnGPukgfXQIaehD1AL-t2GljI3rPnRCXjxnumFQ9qIuQ2Nj-yhXk26J_yGZtdp5DfcGo',
    description: 'Tài nguyên thiết kế, kế hoạch truyền thông và báo cáo hiệu suất chiến dịch quý 3.',
    membersCount: 10,
    membersCountBadge: '+8',
    folderCount: 89,
    mockMembers: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSIhgVNxgQjCKXyGvbP05IbEgqJjEFc-I4e-XW0RpjMsaM_feg-dwIsBzgb3PxVXb1SCbuP1L8kUPU2UHV15NjSedDW79CPPgjNSQicYXe8c4HjZWvSLpbv3JMud8Idz5Rqg2ZuuBoW1mNzKGbukVlEoSPuN9_gYQfsm6FogSEfSl248bTpNuFggB9YES0qbw8Y7fJmQBiFVPVMdMZDC-8XciQaThDbC4uGuquLZfTXmiPnt7CS6qzr5yGrE1LR91LDZkJBU5gDh0',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA5XpzCISUn-J_D9GQeDjbbW_Kcn5vztlaJfp1_E-4PPlX_4aHeXWOHqR6niEmdXpG3baq6GPC1ig7nqX2uhbuU4ySnvOK8vyQFk66f5EUiUMlQTJtF58sgqbHBS3G2MlkBlssSFBXNbyGPNAGjXXT6-_4Jv5X8gJB_DUVixFKwnkwx3fKfTCxcZ83GKdPYlp1ZhCDJ_4RLmmFDEkroKeDp11tIXVlnGAWhg2OpMhT-dPvVOxgS3fftFOAeLM5bwSzGtAWPb6_1dTQ'
    ]
  }
];

export const MOCK_CHATS_BY_DOC: Record<string, string[]> = {
  'doc-1': [
    'Giáo trình Cơ sở Dữ liệu cung cấp kiến thức nền tảng về thiết kế CSDL quan hệ, chuẩn hóa (1NF, 2NF, 3NF, BCNF) và truy vấn SQL nâng cao.',
    'Có chủ đề nào cụ thể trong giáo trình này bạn muốn tìm hiểu không?'
  ],
  'doc-4': [
    'Tài liệu Giải tích 1 tóm tắt toàn bộ lý thuyết về giới hạn, đạo hàm, vi phân và tích phân một biến số, đi kèm các dạng bài tập thi kỳ mẫu cực kỳ chi tiết.',
    'Tôi có thể giải đáp các công thức biến đổi tích phân từng phần hoặc đổi biến số cho bạn!'
  ]
};
