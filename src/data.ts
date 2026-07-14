// Không còn dữ liệu ảo. Tất cả dữ liệu được tải từ API thật.
import { StudyDocument, StudyGroup } from './types';

export const INITIAL_DOCUMENTS: StudyDocument[] = [];
export const INITIAL_GROUPS: StudyGroup[] = [];
export const MOCK_CHATS_BY_DOC: Record<string, string[]> = {};
