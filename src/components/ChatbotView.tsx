import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, StudyDocument } from '../types';
import { Send, Bot, User, Sparkles, Paperclip, MessageSquare, RefreshCw } from 'lucide-react';

interface ChatbotViewProps {
  documents: StudyDocument[];
  initialSelectedDoc: StudyDocument | null;
}

const ChatbotView: React.FC<ChatbotViewProps> = ({ documents, initialSelectedDoc }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested prompts
  const samplePrompts = [
    { text: 'Tóm tắt lý thuyết Chuẩn hóa CSDL (1NF, 2NF, 3NF)', label: 'Chu chuẩn hóa CSDL' },
    { text: 'Giải thích bản chất tích phân từng phần môn Giải tích 1', label: 'Tích phân từng phần' },
    { text: 'Lập dàn ý thiết kế hệ thống RAG cho báo cáo tốt nghiệp', label: 'Thiết kế RAG' },
  ];

  useEffect(() => {
    if (initialSelectedDoc) {
      setSelectedDocId(initialSelectedDoc.id);
      // Greet user with context of the selected document
      setMessages([
        {
          id: `greet-${Date.now()}`,
          role: 'model',
          text: `Chào bạn! Tôi đã nạp tài liệu **"${initialSelectedDoc.title}"** vào bộ nhớ phân tích. Bạn có câu hỏi nào cần giải đáp về nội dung hoặc bài tập trong tài liệu này không? 🤔`,
          timestamp: new Date().toISOString(),
          documentId: initialSelectedDoc.id
        }
      ]);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: 'Xin chào Nguyễn Minh Khôi! Tôi là **Trợ lý AI Học tập** của bạn. Bạn muốn tôi giúp giải thích công thức Giải tích, ôn tập Cơ sở Dữ liệu hay tạo dàn ý học tập hôm nay?',
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [initialSelectedDoc]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    // Create user message object
    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
      documentId: selectedDocId || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Reference document title if any
      let promptPayload = textToSend;
      if (selectedDocId) {
        const doc = documents.find(d => d.id === selectedDocId);
        if (doc) {
          promptPayload = `[Tôi đang nghiên cứu và xem tài liệu: ${doc.title}]\n\nCâu hỏi: ${textToSend}`;
        }
      }

      const payloadMessages = [...messages, { ...userMessage, text: promptPayload }];

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: payloadMessages.map(m => ({
            role: m.role,
            text: m.text
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Dịch vụ AI đang bận hoặc lỗi kết nối. Vui lòng thử lại sau giây lát!');
      }

      const botResult = await response.json();
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: botResult.role,
        text: botResult.text,
        timestamp: botResult.timestamp,
        documentId: selectedDocId || undefined
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
      console.error('Chat API Error:', error);
      
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'model',
          text: `⚠️ **Lỗi kết nối**: ${error.message || 'Không thể liên lạc với máy chủ AI.'}\n\nHãy kiểm tra xem server đã khởi động và GEMINI_API_KEY đã được thiết lập đúng trong Secrets chưa!`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedDocInfo = documents.find(d => d.id === selectedDocId);

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] bg-white border border-[#e0e3e7] rounded-xl overflow-hidden select-none">
      
      {/* Top chat controls */}
      <div className="px-6 py-3 bg-white border-b border-[#e0e3e7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#1967d2]" />
          <div>
            <h3 className="font-semibold text-sm text-[#d3e4fe]">Phòng Hỗ trợ Ôn tập cùng AI</h3>
            <p className="text-[11px] text-[#c7c4d7]/70">Mô hình: Gemini 3.5 Flash</p>
          </div>
        </div>

        {/* Attach Document selector dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Paperclip className="w-4 h-4 text-[#c7c4d7]" />
          <select
            className="w-full sm:w-60 bg-white border border-[#e0e3e7] rounded-lg py-1.5 px-3 text-xs text-[#202124] focus:outline-none focus:border-[#c7d2fe]"
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
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
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
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

                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  isAI
                    ? 'bg-[#f1f3f4] border border-[#e0e3e7] text-[#202124]'
                    : 'bg-[#e8f0fe] text-[#1967d2] shadow-sm'
                }`}>
                  {msg.text}
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
          <div className="bg-[#f1f3f4] border border-[#e0e3e7] p-4 rounded-2xl text-sm text-[#5f6368] flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1967d2]" />
              <span>Trợ lý AI đang nghiên cứu tài liệu và gõ câu trả lời...</span>
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
          className="flex-1 bg-white border border-[#e0e3e7] rounded-xl py-3 px-4 text-sm text-[#202124] placeholder:text-[#5f6368]/70 focus:outline-none focus:border-[#c7d2fe] transition-all"
            placeholder={
              selectedDocInfo 
                ? `Hỏi bất kỳ điều gì về tài liệu "${selectedDocInfo.title}"...` 
                : 'Đưa ra định lý, yêu cầu soạn tài liệu học tập...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
          className="w-12 h-11 bg-[#e8f0fe] hover:bg-[#dbeafe] text-[#1967d2] rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-[#e8f0fe] shrink-0 cursor-pointer"
            title="Gửi tin nhắn"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatbotView;
