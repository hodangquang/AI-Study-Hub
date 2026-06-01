export type FileType = 'pdf' | 'docx' | 'pptx';

export interface StudyDocument {
  id: string;
  title: string;
  type: FileType;
  size: string;
  category: ' đại cương' | 'chuyên ngành' | 'gần đây' | 'khác';
  status: 'ready' | 'processing';
  lastModified: string;
  isFavorite: boolean;
  downloadUrl?: string;
  iconBg: string;
  isDeleted?: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  type: 'Class' | 'Project';
  coverUrl: string;
  description: string;
  membersCount: number;
  membersCountBadge: string;
  folderCount: number;
  mockMembers: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  documentId?: string; // If asking about a specific document
}
