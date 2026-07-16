import { getAuthHeaders, handleUnauthorized } from '../lib/authStorage';
import type {
  CreateChatSessionRequest,
  CreateChatSessionResponse,
  GetChatSessionsResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
  GetChatMessagesResponse
} from '../types/chat';

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

/**
 * POST /chat/sessions
 * Create a new chat session
 */
export async function createChatSession(
  body: CreateChatSessionRequest
): Promise<CreateChatSessionResponse> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl('/chat/sessions'), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || 'Không thể tạo phiên chat mới.');
  }

  return response.json();
}

/**
 * GET /chat/sessions
 * Retrieve all chat sessions of current user
 */
export async function getChatSessions(): Promise<GetChatSessionsResponse> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl('/chat/sessions'), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      ...headers,
    }
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || 'Không thể lấy danh sách phiên chat.');
  }

  return response.json();
}

/**
 * DELETE /chat/sessions/:id
 * Delete a specific chat session
 */
export async function deleteChatSession(sessionId: string): Promise<{ message: string }> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/chat/sessions/${sessionId}`), {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      ...headers,
    }
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || 'Không thể xóa phiên chat.');
  }

  return response.json();
}

/**
 * GET /chat/sessions/:id/messages
 * Retrieve messages in a specific chat session
 */
export async function getChatMessages(sessionId: string): Promise<GetChatMessagesResponse> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/chat/sessions/${sessionId}/messages`), {
    method: 'GET',
    headers: {
      accept: 'application/json',
      ...headers,
    }
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || 'Không thể tải lịch sử tin nhắn.');
  }

  return response.json();
}

/**
 * POST /chat/sessions/:id/messages
 * Send a message inside a specific chat session
 */
export async function sendChatMessage(
  sessionId: string,
  body: SendChatMessageRequest,
  signal?: AbortSignal
): Promise<SendChatMessageResponse> {
  const headers = getAuthHeaders();
  const response = await fetch(apiUrl(`/chat/sessions/${sessionId}/messages`), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || 'Không thể gửi tin nhắn.');
  }

  return response.json();
}
