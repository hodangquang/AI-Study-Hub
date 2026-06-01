import { useState, useEffect } from "react";
import { INITIAL_DOCUMENTS, INITIAL_GROUPS } from "./data";
import { StudyDocument, StudyGroup } from "./types";

// Component imports
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import DashboardView from "./components/DashboardView";
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
} from "./lib/authStorage";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("documents");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // App primary states
  const [documents, setDocuments] =
    useState<StudyDocument[]>(INITIAL_DOCUMENTS);
  const [groups, setGroups] = useState<StudyGroup[]>(INITIAL_GROUPS);

  // Modal & Slideover navigation states
  const [selectedDocForAI, setSelectedDocForAI] =
    useState<StudyDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [initialSelectedDocForChat, setInitialSelectedDocForChat] =
    useState<StudyDocument | null>(null);

  useEffect(() => {
    const session = loadAuthSession();
    if (session?.user) {
      setUser(session.user);
    }
  }, []);

  const handleLogin = (session: AuthSession) => {
    saveAuthSession(session);
    setUser(session.user);
    setActiveTab("documents");
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
    setActiveTab("documents");
  };

  const handleLogout = () => {
    setUser(null);
    clearAuthSession();
    setActiveTab("documents");
  };

  // Handles adding new uploads
  const handleUploadSuccess = (newDoc: StudyDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);
    // Prompt nicely
    alert(
      `Tải lên tài liệu "${newDoc.title}" thành công. AI đã lập chỉ mục và tóm tắt lý thuyết.`,
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
      case "dashboard":
        return (
          <DashboardView
            documents={documents}
            groups={groups}
            setActiveTab={setActiveTab}
            openUploadModal={() => setShowUploadModal(true)}
          />
        );
      case "documents":
        return (
          <DocumentsView
            documents={documents}
            searchQuery={searchQuery}
            setDocuments={setDocuments}
            onOpenAIOverlay={(doc) => setSelectedDocForAI(doc)}
            openUploadModal={() => setShowUploadModal(true)}
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
        <div className="bg-[#031427] text-[#d3e4fe] min-h-screen flex selection:bg-[#8083ff]/30 selection:text-[#d3e4fe]">
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
            <main className="p-8 max-w-[1200px] mx-auto w-full flex-1 flex flex-col bg-[#031427]">
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
    </>
  );
}
