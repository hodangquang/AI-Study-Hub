import { useState, useEffect } from "react";
import { INITIAL_GROUPS } from "./data";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StudyDocument, StudyGroup } from "./types";
import { fetchDocuments, fetchCategories, resolveShareToken, uploadDocumentFile } from "./services/documentsApi";

// Component imports
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import HomeView from "./components/HomeView";
import DocumentsView from "./components/DocumentsView";
import GroupsView from "./components/GroupsView";
import FavoritesView from "./components/FavoritesView";
import ChatbotView from "./components/ChatbotView";
import AIDocumentOverlay from "./components/AIDocumentOverlay";
import UploadModal from "./components/UploadModal";
import LoginView from "./components/LoginView";
import RegisterView from "./components/RegisterView";
import {
  TrashView,
  SettingsView,
  AdminView,
  HelpView,
} from "./components/SecondaryViews";
import type { AuthSession, AuthUser } from "./types/auth";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  isTokenExpired,
  registerSessionExpiredHandler,
} from "./lib/authStorage";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // App primary states
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);

  // Modal & Slideover navigation states
  const [selectedDocForAI, setSelectedDocForAI] =
    useState<StudyDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [initialSelectedDocForChat, setInitialSelectedDocForChat] =
    useState<StudyDocument | null>(null);

  useEffect(() => {
    // Register global 401 handler so any API call can trigger logout
    registerSessionExpiredHandler(() => {
      setUser(null);
      setDocuments([]);
      setFolders([]);
      // Small delay so state settles before UI re-renders
      setTimeout(() => {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }, 100);
    });

    const session = loadAuthSession();
    if (session?.user) {
      // Check if token is expired before restoring session
      if (isTokenExpired()) {
        clearAuthSession();
        // Don't restore — force re-login
      } else {
        setUser(session.user);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      // 1. Tải tệp thật
      fetchDocuments()
        .then((docs) => setDocuments(docs))
        .catch((err) => {
          console.error("Lỗi tải tài liệu từ API thật:", err);
          setDocuments([]);
        });

      // 2. Tải thư mục danh mục thật
      fetchCategories()
        .then((cats) => {
          if (cats.length > 0) {
            setFolders(cats.map((c, i) => ({
              id: c.id,
              name: c.name,
              owner: 'me',
              dateModified: 'Vừa tải',
              size: '—',
              color: ['#ffb783', '#c0c1ff', '#8b5cf6', '#10b981', '#f59e0b'][i % 5] || '#1967d2',
              bg: '#fff7f2',
              type: 'category'
            })));
          } else {
            setFolders([]);
          }
        })
        .catch((err) => {
          console.error("Lỗi tải danh mục từ API thật:", err);
          setFolders([]);
        });
    } else {
      setDocuments([]);
      setFolders([]);
    }
  }, [user]);

  // Auto-import shared document from URL pathname on boot
  useEffect(() => {
    if (!user) return;

    const pathname = window.location.pathname;
    if (pathname.startsWith('/shared/')) {
      const token = pathname.split('/shared/')[1]?.split('?')[0];
      if (token) {
        const importSharedDoc = async () => {
          const toastId = toast.loading('Đang xử lý liên kết chia sẻ và nhập tài liệu vào tài khoản...');
          try {
            // 1. Resolve token
            const sharedDoc = await resolveShareToken(token);
            
            // 2. Download file blob
            const fileRes = await fetch(sharedDoc.downloadUrl);
            if (!fileRes.ok) throw new Error('Không thể tải tệp tin chia sẻ từ máy chủ.');
            const blob = await fileRes.blob();
            
            const fileTitle = sharedDoc.solution?.title || sharedDoc.title || 'Tài liệu chia sẻ';
            const fileExt = sharedDoc.solution?.fileExtension?.replace(/^\./, '') || 'pdf';
            const file = new File([blob], sharedDoc.solution?.fileName || sharedDoc.fileName || `${fileTitle}.${fileExt}`, {
              type: blob.type
            });
            
            // 3. Upload under user's space
            const newDoc = await uploadDocumentFile(
              file,
              fileTitle,
              undefined,
              sharedDoc.solution?.tags?.join(',') || sharedDoc.tags?.join(','),
              true,
              sharedDoc.solution?.description || sharedDoc.description
            );

            // 4. Update documents state and open AI overlay
            setDocuments((prev) => [newDoc, ...prev]);
            setSelectedDocForAI(newDoc);
            
            toast.update(toastId, {
              render: `Đã nhập tài liệu "${fileTitle}" thành công!`,
              type: 'success',
              isLoading: false,
              autoClose: 4000
            });
          } catch (err: any) {
            console.error(err);
            toast.update(toastId, {
              render: err.message || 'Lỗi khi nhập tài liệu chia sẻ.',
              type: 'error',
              isLoading: false,
              autoClose: 4000
            });
          } finally {
            // Clear route path
            window.history.replaceState({}, '', '/');
          }
        };
        importSharedDoc();
      }
    }
  }, [user]);

  const handleLogin = (session: AuthSession) => {
    saveAuthSession(session);
    setUser(session.user);
    setActiveTab("home");
  };

  const handleRegister = (payload: {
    fullName: string;
    email: string;
    avatarUrl: string;
  }) => {
    const newUser: AuthUser = {
      id: `local-${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email,
      username: payload.email.split("@")[0],
      avatarUrl: payload.avatarUrl,
      role: "user",
    };
    const session: AuthSession = {
      user: newUser,
      accessToken: "",
      tokenType: "Bearer",
      expiresIn: 0,
    };
    saveAuthSession(session);
    setUser(newUser);
    setActiveTab("home");
  };

  const handleLogout = () => {
    setUser(null);
    clearAuthSession();
    setActiveTab("home");
  };

  // Handles adding new uploads
  const handleUploadSuccess = (newDoc: StudyDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    toast.success(
      `Tải lên tài liệu "${newDoc.title}" thành công. AI đã lập chỉ mục và tóm tắt lý thuyết.`
    );
  };

  // Navigates directly from Doc AI Overlay into chat with this document loaded
  const handleOpenChatWithDoc = (doc: StudyDocument) => {
    setInitialSelectedDocForChat(doc);
    setSelectedDocForAI(null);
    setActiveTab("chatbot");
  };

  // Content selector
  const renderMainContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView
            documents={documents}
            setDocuments={setDocuments}
            folders={folders}
            setFolders={setFolders}
            groups={groups}
            setActiveTab={setActiveTab}
            onOpenAIOverlay={(doc) => setSelectedDocForAI(doc)}
            openUploadModal={() => setShowUploadModal(true)}
            currentUser={user}
          />
        );
      case "documents":
        return (
          <DocumentsView
            documents={documents}
            searchQuery={searchQuery}
            setDocuments={setDocuments}
            folders={folders}
            setFolders={setFolders}
            onOpenAIOverlay={(doc) => setSelectedDocForAI(doc)}
            openUploadModal={() => setShowUploadModal(true)}
            currentUser={user}
          />
        );
      case "groups":
        return (
          <GroupsView
            groups={groups}
            setGroups={setGroups}
            searchQuery={searchQuery}
          />
        );
      case "chatbot":
        return (
          <ChatbotView
            documents={documents}
            initialSelectedDoc={initialSelectedDocForChat}
          />
        );
      case "favorites":
        return (
          <FavoritesView
            documents={documents}
            setDocuments={setDocuments}
            searchQuery={searchQuery}
            setActiveTab={setActiveTab}
            onOpenAIOverlay={(doc) => setSelectedDocForAI(doc)}
          />
        );
      case "trash":
        return <TrashView documents={documents} setDocuments={setDocuments} />;
      case "settings":
        return <SettingsView />;
      case "admin":
        return <AdminView />;
      case "help":
        return <HelpView />;
      default:
        return (
          <div className="text-center py-20 text-[#c7c4d7]">
            Tính năng đang phát triển...
          </div>
        );
    }
  };

  return (
    <>
      {!user ? (
        // Show login or register screen
        isRegistering ? (
          <RegisterView
            onRegister={handleRegister}
            onSwitchToLogin={() => setIsRegistering(false)}
          />
        ) : (
          <LoginView
            onLogin={handleLogin}
            onSwitchToRegister={() => setIsRegistering(true)}
          />
        )
      ) : (
        // Show main app
        <div className="bg-[#f8fafd] text-[#1f1f1f] min-h-screen flex selection:bg-[#d2e3fc] selection:text-[#174ea6]">
          {/* Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            onLogout={handleLogout}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              // If moving away from chat or onto chat, reset the selected chat doc context cleanly
              if (tab !== "chatbot") {
                setInitialSelectedDocForChat(null);
              }
            }}
            openUploadModal={() => setShowUploadModal(true)}
            storageUsed={2.4}
            storageTotal={5}
            folders={folders}
            onImportSuccess={handleUploadSuccess}
          />

          {/* Main Panel Column */}
          <div className="ml-[260px] flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden">
            {/* Header Topbar */}
            <Topbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              user={user}
              onLogout={handleLogout}
            />

            {/* Dynamic Main Workspace page */}
            <main className="p-8 max-w-[1200px] mx-auto w-full flex-1 flex flex-col bg-[#f8fafd]">
              {renderMainContent()}
            </main>
          </div>

          {/* Document AI Analysis slide-over sidebar panel */}
          {selectedDocForAI && (
            <AIDocumentOverlay
              document={selectedDocForAI}
              onClose={() => setSelectedDocForAI(null)}
              onOpenChat={handleOpenChatWithDoc}
            />
          )}

          {/* File Drag & Drop custom Upload document Modal */}
          {showUploadModal && (
            <UploadModal
              onClose={() => setShowUploadModal(false)}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </div>
      )}
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="light" 
      />
    </>
  );
}
