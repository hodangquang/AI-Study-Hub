// Types for Chat APIs

export interface ChatSession {
  _id: string;
  solutionId: string;
  accountId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatSessionRequest {
  solutionId: string;
  title: string;
}

export interface CreateChatSessionResponse {
  message: string;
  data: ChatSession;
}

export interface GetChatSessionsResponse {
  message: string;
  data: ChatSession[];
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  role: 'user' | 'assistant' | string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendChatMessageRequest {
  content: string;
}

export interface SendChatMessageResponse {
  message: string;
  data: ChatMessage;
}

export interface GetChatMessagesResponse {
  message: string;
  data: ChatMessage[];
}
