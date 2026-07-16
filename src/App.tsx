import { useState, useEffect } from "react";
import { INITIAL_GROUPS } from "@/data";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { StudyDocument, StudyGroup } from "@/types";
import { fetchDocuments, fetchCategories, resolveShareToken, uploadDocumentFile, fetchFoldersFromBackend, createFolderOnBackend } from "@/services/documentsApi";

// Component imports
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import HomeView from "@/pages/home/HomeView";
import DocumentsView from "@/pages/documents/DocumentsView";
import GroupsView from "@/pages/groups/GroupsView";
import FavoritesView from "@/pages/favorites/FavoritesView";

import ChatbotView from "@/pages/chatbot/ChatbotView";
import AIDocumentOverlay from "@/components/AIDocumentOverlay";
import UploadModal from "@/components/UploadModal";
import Loader from "@/components/Loader";
import LoginView from "@/pages/auth/LoginView";
import RegisterView from "@/pages/auth/RegisterView";
import VerifyEmailView from "@/pages/auth/VerifyEmailView";
import ForgotPasswordView from "@/pages/auth/ForgotPasswordView";
import ResetPasswordView from "@/pages/auth/ResetPasswordView";
import {
  TrashView,
  SettingsView,
  AdminView,
  HelpView,
} from "@/pages/dashboard/SecondaryViews";
import ProfileView from "@/pages/profile/ProfileView";
import type { AuthSession, AuthUser, UserStorageInfo } from "@/types/auth";
import { getCurrentUserStorageQuota } from "@/services/authApi";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  isTokenExpired,
  registerSessionExpiredHandler,
} from "@/lib/authStorage";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password'>('login');
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // App primary states
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [storageQuota, setStorageQuota] = useState<UserStorageInfo | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

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
        setInitialLoading(false);
      } else {
        setUser(session.user);
      }
    } else {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setInitialLoading(true);
      Promise.all([
        fetchDocuments().catch((err) => {
          console.error("Lỗi tải tài liệu từ API thật:", err);
          return [];
        }),
        fetchCategories().catch(() => []),
        fetchFoldersFromBackend().catch(() => [])
      ]).then(([docs, cats, backendFolders]) => {
        const myDocs = docs.filter(d => !d.uploaderId || d.uploaderId === user.id);
        setDocuments(myDocs);

        const mappedCats = cats.map((c, i) => ({
          id: c.id,
          name: c.name,
          owner: 'me',
          dateModified: 'Vừa tải',
          size: '—',
          color: ['#ffb783', '#c0c1ff', '#8b5cf6', '#10b981', '#f59e0b'][i % 5] || '#1967d2',
          bg: '#fff7f2',
          type: 'category'
        }));

        const mappedFolders = backendFolders.map((f, i) => ({
          id: f.id,
          name: f.name,
          owner: 'me',
          dateModified: 'Vừa tải',
          size: '—',
          color: ['#10b981', '#f59e0b', '#ffb783', '#c0c1ff', '#8b5cf6'][i % 5] || '#1967d2',
          bg: '#f0fdf4',
          type: 'folder',
          parentId: f.parentId
        }));

        setFolders([...mappedCats, ...mappedFolders]);
      }).catch((err) => {
        console.error("Lỗi tải danh mục/thư mục từ API thật:", err);
        setFolders([]);
      }).finally(() => {
        setTimeout(() => {
          setInitialLoading(false);
        }, 1500);
      });
    } else {
      setDocuments([]);
      setFolders([]);
      setInitialLoading(false);
    }
  }, [user]);

  // Load storage quota dynamically when user logs in or uploads/deletes a document
  useEffect(() => {
    if (user) {
      getCurrentUserStorageQuota()
        .then((quota) => setStorageQuota(quota))
        .catch((err) => {
          console.error("Lỗi tải hạn mức bộ nhớ từ API thật:", err);
          setStorageQuota(null);
        });
    } else {
      setStorageQuota(null);
    }
  }, [user, documents]);

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

  const handleLogout = () => {
    setUser(null);
    clearAuthSession();
    setActiveTab("home");
  };

  const handleUserUpdate = (updatedFields: { fullName: string; username: string; avatarUrl?: string }) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    const session = loadAuthSession();
    if (session) {
      session.user = updatedUser;
      saveAuthSession(session);
    }
  };

  // Handles adding new uploads
  const handleUploadSuccess = (newDoc: StudyDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    toast.success(
      `Tải lên tài liệu "${newDoc.title}" thành công. AI đã lập chỉ mục và tóm tắt lý thuyết.`
    );
  };

  const handleCreateFolder = async (name: string, parentId?: string | null) => {
    try {
      const newFolder = await createFolderOnBackend({ name, parentId });
      const mappedFolder = {
        id: newFolder.id,
        name: newFolder.name,
        owner: 'me',
        dateModified: 'Vừa tải',
        size: '—',
        color: ['#10b981', '#f59e0b', '#ffb783', '#c0c1ff', '#8b5cf6'][folders.length % 5] || '#1967d2',
        bg: '#f0fdf4',
        type: 'folder',
        parentId: newFolder.parentId
      };
      setFolders((prev) => [...prev, mappedFolder]);
      toast.success(`Đã tạo thư mục: "${name}"`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi tạo thư mục.');
    }
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
            setCurrentFolderId={setCurrentFolderId}
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
            currentFolderId={currentFolderId}
            setCurrentFolderId={setCurrentFolderId}
          />
        );

      case "chatbot":
        return (
          <ChatbotView
            documents={documents}
            initialSelectedDoc={initialSelectedDocForChat}
            currentUser={user}
          />
        );
      case "bookmarks":
      case "favorites":
        return (
          <FavoritesView
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
      case "profile":
        return <ProfileView onUpdateUser={handleUserUpdate} />;
      default:
        return (
          <div className="text-center py-20 text-[#c7c4d7]">
            Tính năng đang phát triển...
          </div>
        );
    }
  };

  const renderAuthContent = () => {
    switch (authView) {
      case "register":
        return (
          <RegisterView
            onRegisterSuccess={(email) => {
              setPendingEmail(email);
              setAuthView("verify-email");
            }}
            onSwitchToLogin={() => setAuthView("login")}
          />
        );
      case "verify-email":
        return (
          <VerifyEmailView
            email={pendingEmail}
            onVerificationSuccess={() => {
              setAuthView("login");
            }}
            onBackToLogin={() => setAuthView("login")}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordView
            onCodeSent={(email) => {
              setPendingEmail(email);
              setAuthView("reset-password");
            }}
            onBackToLogin={() => setAuthView("login")}
          />
        );
      case "reset-password":
        return (
          <ResetPasswordView
            email={pendingEmail}
            onResetSuccess={() => {
              setAuthView("login");
            }}
            onBackToLogin={() => setAuthView("login")}
          />
        );
      case "login":
      default:
        return (
          <LoginView
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthView("register")}
            onForgotPassword={() => setAuthView("forgot-password")}
            onUnverifiedEmailRedirect={(email) => {
              setPendingEmail(email);
              setAuthView("verify-email");
            }}
          />
        );
    }
  };

  return (
    <>
      {initialLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafd]">
          <Loader />
        </div>
      ) : !user ? (
        renderAuthContent()
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
            storageQuota={storageQuota}
            folders={folders}
            onImportSuccess={handleUploadSuccess}
            onCreateFolder={handleCreateFolder}
          />

          {/* Main Panel Column */}
          <div className="ml-[260px] flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden">
            {/* Header Topbar */}
            <Topbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              user={user}
              onLogout={handleLogout}
              onViewProfile={() => setActiveTab("profile")}
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
              folderId={currentFolderId}
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
