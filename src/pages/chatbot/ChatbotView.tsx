import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as LocalChatMessage, StudyDocument } from '@/types';
import { AuthUser } from '@/types/auth';
import { 
  Send, Bot, User, Paperclip, MessageSquare, RefreshCw, Plus, Trash2, StopCircle
} from 'lucide-react';
import { 
  createChatSession, 
  getChatSessions, 
  getChatMessages, 
  sendChatMessage, 
  deleteChatSession 
} from '@/services/chatService';
import { ChatSession, ChatMessage as ApiChatMessage } from '@/types/chat';
import { toast } from 'react-toastify';
import CustomDialog from '@/components/ui/CustomDialog';

interface ChatbotViewProps {
  documents: StudyDocument[];
  initialSelectedDoc: StudyDocument | null;
  currentUser: AuthUser | null;
}

const ChatbotView: React.FC<ChatbotViewProps> = ({ documents, initialSelectedDoc, currentUser }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);



  // Suggested prompts
  const samplePrompts = [
    { text: 'Tóm tắt lý thuyết Chuẩn hóa CSDL (1NF, 2NF, 3NF)', label: 'Chu chuẩn hóa CSDL' },
    { text: 'Giải thích bản chất tích phân từng phần môn Giải tích 1', label: 'Tích phân từng phần' },
    { text: 'Lập dàn ý thiết kế hệ thống RAG cho báo cáo tốt nghiệp', label: 'Thiết kế RAG' },
  ];

  // Load chat sessions on mount
  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await getChatSessions();
      setSessions(res.data || []);
      
      // If there was an initialSelectedDoc, check if a session for it already exists
      if (initialSelectedDoc) {
        setSelectedDocId(initialSelectedDoc.id);
        const existingSession = res.data?.find(s => s.solutionId === initialSelectedDoc.id);
        if (existingSession) {
          setSelectedSessionId(existingSession._id);
        } else {
          // If no session exists, we will create one on the first message
          setMessages([
            {
              id: `greet-${Date.now()}`,
              role: 'model',
              text: `Chào bạn! Tôi đã nạp tài liệu **"${initialSelectedDoc.title}"** vào bộ nhớ phân tích. Bạn hãy gửi câu hỏi đầu tiên để chúng ta bắt đầu cuộc trò chuyện nhé! 🤔`,
              timestamp: new Date().toISOString(),
              documentId: initialSelectedDoc.id
            }
          ]);
        }
      } else if (res.data && res.data.length > 0) {
        // Otherwise, select the most recent session
        setSelectedSessionId(res.data[0]._id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể tải danh sách cuộc trò chuyện.');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [initialSelectedDoc]);

  // Load messages when selected session changes
  useEffect(() => {
    if (!selectedSessionId) {
      if (!initialSelectedDoc) {
        const displayName = currentUser?.fullName || 'bạn';
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            text: `Xin chào ${displayName}! Tôi là **Trợ lý AI Học tập** của bạn. Hãy chọn một tài liệu ở danh sách đính kèm, hoặc chọn cuộc trò chuyện cũ bên trái để tiếp tục ôn tập nhé!`,
            timestamp: new Date().toISOString()
          }
        ]);
      }
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      try {
        const res = await getChatMessages(selectedSessionId);
        const session = sessions.find(s => s._id === selectedSessionId);
        
        // Map backend messages to UI model
        const mapped: LocalChatMessage[] = (res.data || []).map((m: ApiChatMessage) => ({
          id: m._id,
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.content || '',
          timestamp: m.createdAt,
          documentId: session?.solutionId
        }));
        setMessages(mapped);

        // Update selected document dropdown if the session has a solutionId
        if (session?.solutionId) {
          setSelectedDocId(session.solutionId);
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Lỗi khi tải lịch sử tin nhắn.');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedSessionId, sessions]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    let currentSessionId = selectedSessionId;

    setLoading(true);
    setInput('');

    // Create a fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. If there's no active session, we must create one first
      if (!currentSessionId) {
        if (!selectedDocId) {
          // If no document selected, either prompt or pick the first available document
          const availableDoc = documents.find(d => !d.isDeleted);
          if (!availableDoc) {
            throw new Error('Bạn cần tải lên ít nhất một tài liệu để bắt đầu chat ôn tập.');
          }
          setSelectedDocId(availableDoc.id);
          toast.info(`Tự động đính kèm tài liệu: "${availableDoc.title}"`);
          
          const title = textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '');
          const newSessionRes = await createChatSession({ solutionId: availableDoc.id, title });
          currentSessionId = newSessionRes.data._id;
          setSessions(prev => [newSessionRes.data, ...prev]);
          setSelectedSessionId(newSessionRes.data._id);
        } else {
          const doc = documents.find(d => d.id === selectedDocId);
          const title = doc?.title || 'Cuộc trò chuyện mới';
          const newSessionRes = await createChatSession({ solutionId: selectedDocId, title });
          currentSessionId = newSessionRes.data._id;
          setSessions(prev => [newSessionRes.data, ...prev]);
          setSelectedSessionId(newSessionRes.data._id);
        }
      }

      // Add user message to UI immediately for optimistic UI feel
      const userMsg: LocalChatMessage = {
        id: `usr-temp-${Date.now()}`,
        role: 'user',
        text: textToSend,
        timestamp: new Date().toISOString(),
        documentId: selectedDocId || undefined
      };
      setMessages(prev => [...prev, userMsg]);

      // 2. Send message using currentSessionId (pass signal for abort support)
      const sendRes = await sendChatMessage(currentSessionId!, { content: textToSend }, controller.signal);
      
      // 3. Reload messages to get updated state (including assistant answer)
      const reloadRes = await getChatMessages(currentSessionId!);
      const sessionObj = sessions.find(s => s._id === currentSessionId);
      const updatedMapped: LocalChatMessage[] = (reloadRes.data || []).map((m: ApiChatMessage) => ({
        id: m._id,
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.content || '',
        timestamp: m.createdAt,
        documentId: sessionObj?.solutionId
      }));
      setMessages(updatedMapped);

    } catch (error: any) {
      // Ignore AbortError — user intentionally stopped generation
      if (error?.name === 'AbortError') {
        console.log('Request aborted by user.');
      } else {
        console.error('Chat API Error:', error);
        toast.error(error.message || 'Lỗi gửi tin nhắn.');
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
  const handleCreateNewSessionBtn = () => {
    setSelectedSessionId(null);
    setMessages([
      {
        id: 'new-prompt',
        role: 'model',
        text: 'Vui lòng đính kèm một tài liệu bên dưới và nhập tin nhắn để tạo cuộc trò chuyện mới!',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessionToDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDeleteId) return;
    const id = sessionToDeleteId;
    setSessionToDeleteId(null);
    try {
      await deleteChatSession(id);
      setSessions(prev => prev.filter(s => s._id !== id));
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
      toast.success('Đã xóa cuộc trò chuyện.');
    } catch (err: any) {
      toast.error('Không thể xóa cuộc trò chuyện.');
    }
  };

  const selectedDocInfo = documents.find(d => d.id === selectedDocId);

  return (
    <div className="flex flex-1 min-h-0 bg-white border border-[#e0e3e7] rounded-xl overflow-hidden select-none">
      
      {/* Left Sidebar - Chat Sessions */}
      <div className="w-64 border-r border-[#e0e3e7] flex flex-col bg-slate-50 shrink-0">
        <div className="p-4 border-b border-[#e0e3e7] flex justify-between items-center bg-white">
          <span className="font-semibold text-xs text-slate-700 uppercase tracking-wider">Hội thoại ôn tập</span>
          <button
            onClick={handleCreateNewSessionBtn}
            className="p-1.5 bg-[#e8f0fe] hover:bg-[#dbeafe] text-[#1967d2] rounded-lg transition-all cursor-pointer"
            title="Tạo hội thoại mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessionsLoading ? (
            <div className="text-center py-6 text-slate-400 text-xs">Đang tải cuộc trò chuyện...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">Chưa có hội thoại nào</div>
          ) : (
            sessions.map((session) => {
              const isActive = session._id === selectedSessionId;
              const relatedDoc = documents.find(d => d.id === session.solutionId);
              return (
                <div
                  key={session._id}
                  onClick={() => setSelectedSessionId(session._id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' 
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1967d2]' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate font-medium">{session.title || 'Cuộc trò chuyện'}</p>
                      {relatedDoc && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          Tài liệu: {relatedDoc.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(e, session._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300 rounded text-slate-500 hover:text-red-600 transition-all ml-1 shrink-0"
                    title="Xóa cuộc trò chuyện"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Pane */}
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Top chat controls */}
        <div className="px-6 py-3 bg-white border-b border-[#e0e3e7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#1967d2]" />
            <div>
              <h3 className="font-semibold text-sm text-slate-800">Phòng Hỗ trợ Ôn tập cùng AI</h3>
              <p className="text-[11px] text-slate-500">Mô hình: Gemini RAG Agent</p>
            </div>
          </div>

          {/* Attach Document selector dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Paperclip className="w-4 h-4 text-[#c7c4d7]" />
            <select
              className="w-full sm:w-60 bg-white border border-[#e0e3e7] rounded-lg py-1.5 px-3 text-xs text-[#202124] focus:outline-none focus:border-[#c7d2fe]"
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                // If we select a new document, load or prompt creation of a new session
                if (e.target.value && selectedSessionId) {
                  const matchingSession = sessions.find(s => s.solutionId === e.target.value);
                  if (matchingSession) {
                    setSelectedSessionId(matchingSession._id);
                  } else {
                    handleCreateNewSessionBtn();
                  }
                }
              }}
            >
              <option value="">-- Không đính kèm tài liệu --</option>
              {documents.filter(d => !d.isDeleted).map(d => (
                <option key={d.id} value={d.id}>
                  [{d.type.toUpperCase()}] {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30">
          {messages.map((msg) => {
            const isAI = msg.role === 'model';
            return (
              <div 
                key={msg.id} 
                className={`flex items-start gap-3.5 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAI ? 'bg-[#e8f0fe] text-[#1967d2]' : 'bg-[#f1f3f4] text-[#202124] border border-[#e0e3e7]'}`}>
                  {isAI ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>

                <div className="space-y-1">
                  {/* Active attached document tag if referenced */}
                  {msg.documentId && documents.find(d => d.id === msg.documentId) && (
                    <span className="inline-flex text-[10px] bg-[#e8f0fe] text-[#1967d2] font-semibold px-2 py-0.5 rounded-sm select-none">
                      🎯 Đang trao đổi về: {documents.find(d => d.id === msg.documentId)?.title}
                    </span>
                  )}

                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isAI
                      ? 'bg-white border border-[#e0e3e7] text-[#202124] shadow-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-[#e83e8c] prose-code:text-xs prose-pre:bg-slate-900 prose-pre:text-slate-100'
                      : 'bg-[#e8f0fe] text-[#1967d2] shadow-sm whitespace-pre-wrap'
                  }`}>
                    {isAI ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator loader animation */}
          {loading && (
            <div className="flex items-start gap-3.5 mr-auto max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1967d2] flex items-center justify-center shrink-0 border border-[#e0e3e7]">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="bg-white border border-[#e0e3e7] p-4 rounded-2xl text-sm text-[#5f6368] flex items-center gap-2 shadow-sm">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1967d2]" />
                <span>Trợ lý AI đang phản hồi...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom control input box */}
        <div className="p-4 bg-white border-t border-[#e0e3e7] space-y-3">
          {/* Quick click educational prompts if there's no major history, or as floating assist */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 select-none">
              {samplePrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => handleSendMessage(e, p.text)}
                  className="text-xs bg-[#f1f3f4] hover:bg-[#eceff1] text-[#202124] border border-[#e0e3e7] px-3 py-1.5 rounded-lg transition-transform hover:scale-[1.01] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-white border border-[#e0e3e7] rounded-xl py-3 px-4 text-sm text-[#202124] placeholder:text-[#5f6368]/70 focus:outline-none focus:border-[#c7d2fe] transition-all disabled:bg-slate-50"
              placeholder={
                loading 
                  ? 'Trợ lý AI đang phản hồi...'
                  : selectedDocInfo 
                    ? `Hỏi bất kỳ điều gì về tài liệu "${selectedDocInfo.title}"...` 
                    : 'Đính kèm tài liệu ở trên và đặt câu hỏi ôn tập...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            {loading ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="w-12 h-11 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer border border-red-200"
                title="Dừng tạo văn bản"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-12 h-11 bg-[#e8f0fe] hover:bg-[#dbeafe] text-[#1967d2] rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-[#e8f0fe] shrink-0 cursor-pointer"
                title="Gửi tin nhắn"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      </div>

      {sessionToDeleteId && (
        <CustomDialog
          isOpen={sessionToDeleteId !== null}
          title="Xóa cuộc trò chuyện"
          message="Bạn có chắc chắn muốn xóa cuộc trò chuyện này?"
          confirmLabel="Xóa"
          cancelLabel="Cancel"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onClose={() => setSessionToDeleteId(null)}
        />
      )}
    </div>
  );
};

export default ChatbotView;
