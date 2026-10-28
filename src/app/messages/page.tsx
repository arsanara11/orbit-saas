"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getInitialWorkspaceData,
  getWorkspaceMessagesAction,
  sendMessageAction,
  addMemberByEmailAction,
} from "@/app/actions";

// --- TYPES ---
type MessageTab = "Inbox" | "Unread";

type Attachment = {
  id: string;
  name: string;
  size: string;
  type: "file" | "image";
};

type DBMessage = {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type DBMember = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

// --- ICON COMPONENT ---
function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    send: <path d="m22 2-7 20-4-9-9-4Zm0 0L11 13" />,
    paperclip: (
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </>
    ),
    at: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    reply: <path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 5 5v3" />,
    check: <path d="m5 12 4 4L19 6" />,
    doubleCheck: <path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16" />,
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        <path d="M3 10h18" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    x: <path d="M18 6 6 18M6 6l12 12" />,
    file: (
      <>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.folder}</svg>;
}

export default function MessagesPage() {
  const router = useRouter();
  const { profile, logActivity } = useWorkspace();

  // --- STATES ---
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("Workspace Channel");
  const [members, setMembers] = useState<DBMember[]>([]);
  const [messages, setMessages] = useState<DBMessage[]>([]);

  const [activeTab, setActiveTab] = useState<MessageTab>("Inbox");
  const [searchQuery, setSearchQuery] = useState("");

  const [messageInput, setMessageInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<DBMessage | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);

  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load Data dari Database
  useEffect(() => {
    async function loadWorkspaceAndMessages() {
      try {
        setLoading(true);
        const data = await getInitialWorkspaceData();
        if (data?.workspace) {
          setWorkspaceId(data.workspace.id);
          setWorkspaceName(data.workspace.name);
          setCurrentUserId(data.user.id);

          if (data.workspace.memberships) {
            setMembers(data.workspace.memberships as unknown as DBMember[]);
          }

          if (data.workspace.messages) {
            setMessages(data.workspace.messages as unknown as DBMessage[]);
          } else {
            const dbMsgs = await getWorkspaceMessagesAction(data.workspace.id);
            setMessages(dbMsgs as unknown as DBMessage[]);
          }
        }
      } catch (error) {
        console.error("Failed to load real workspace messages:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWorkspaceAndMessages();
  }, []);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.sender.name.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  async function handleSendMessage() {
    if ((!messageInput.trim() && attachedFiles.length === 0) || !workspaceId) return;

    const contentToSend = messageInput.trim();
    setMessageInput("");
    setAttachedFiles([]);
    setReplyingTo(null);

    try {
      const newMsg = await sendMessageAction(workspaceId, contentToSend);
      setMessages((prev) => [...prev, newMsg as unknown as DBMessage]);
      logActivity("sent a message", "Workspace Chat", workspaceName);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !workspaceId) return;

    setInviteStatus("Inviting...");
    try {
      const newMember = await addMemberByEmailAction(workspaceId, inviteEmail.trim());
      setMembers((prev) => [...prev, newMember as unknown as DBMember]);
      setInviteStatus("Success! Member added.");
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteStatus(null);
      }, 1000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to invite member";
      setInviteStatus(`Error: ${errorMessage}`);
    }
  }

  function handleAddAttachment() {
    const mockFiles: Attachment[] = [
      { id: `file-${Date.now()}`, name: "orbit_spec_v2.pdf", size: "1.4 MB", type: "file" },
      { id: `file-${Date.now() + 1}`, name: "dashboard_ui.png", size: "820 KB", type: "image" },
    ];
    const fileToAdd = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setAttachedFiles((prev) => [...prev, fileToAdd]);
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-[#18191b] text-white animate-pulse">
          <p className="text-xs text-gray-400">Loading real workspace channel...</p>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#18191b] text-white">
        {/* SIDEBAR MEMBERS & CHANNELS */}
        <aside className="w-80 shrink-0 border-r border-[var(--line)] bg-[#1e2022] flex flex-col">
          <div className="p-4 border-b border-[var(--line)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">Workspace Chat</h1>
                <span className="text-[10px] bg-[#98E499]/10 text-[#98E499] border border-[#98E499]/20 px-2 py-0.5 rounded-full font-semibold">
                  Live
                </span>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="p-1.5 rounded-xl font-bold hover:bg-[#85d886] transition cursor-pointer"
                title="Invite Member via Email"
              >
                <Icon name="plus" size={15} />
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Icon name="search" size={13} />
              </span>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#242628] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#98E499] transition"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#141517] p-1 rounded-xl border border-[var(--line)] text-xs">
              {(["Inbox", "Unread"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeTab === tab
                      ? "bg-[#242628] text-white font-semibold border border-[var(--line)] shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 px-1">
                Workspace Members ({members.length})
              </span>
              <div className="space-y-1">
                {members.map((m) => {
                  const isMe = m.user.id === currentUserId;
                  const initials = m.user.name ? m.user.name.slice(0, 2).toUpperCase() : "US";
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-[#242628]/60 border border-[var(--line)] text-xs"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-[10px] text-[#98E499] shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1 truncate">
                        <strong className="block text-white truncate font-medium">
                          {m.user.name} {isMe && "(You)"}
                        </strong>
                        <span className="text-[10px] text-gray-400 block truncate">{m.user.email}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* CHAT CONVERSATION AREA */}
        <main className="flex-1 flex flex-col bg-[#18191b] min-w-0 relative">
          <header className="h-14 px-5 border-b border-[var(--line)] bg-[#1e2022] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-xs text-[#98E499]">
                #
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-semibold text-white truncate">{workspaceName} Channel</h2>
                <span className="text-[10px] text-gray-400 block">
                  {members.length} members connected
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowDetailPanel(!showDetailPanel)}
              style={showDetailPanel ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                showDetailPanel
                  ? "font-bold"
                  : "bg-[#242628] border-[var(--line)] text-gray-400 hover:text-white"
              }`}
              title="Toggle Context Details Panel"
            >
              <Icon name="info" size={15} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {filteredMessages.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1e2022] border border-[var(--line)] flex items-center justify-center mx-auto text-gray-400">
                  <Icon name="smile" size={20} />
                </div>
                <strong className="block text-xs font-semibold text-white">No real messages yet</strong>
                <p className="text-xs text-gray-400">Be the first to send a message in this workspace channel!</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMine = msg.sender.id === currentUserId;
                const senderInitials = msg.sender.name ? msg.sender.name.slice(0, 2).toUpperCase() : "US";
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={msg.id} className={`flex gap-2.5 group ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <div className="w-7 h-7 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-[10px] text-[#98E499] shrink-0 mt-1">
                        {senderInitials}
                      </div>
                    )}

                    <div className={`max-w-[70%] space-y-1 ${isMine ? "items-end order-1" : "items-start"}`}>
                      {!isMine && (
                        <span className="text-[10px] font-medium text-[#98E499] block pl-1">
                          {msg.sender.name}
                        </span>
                      )}

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed relative ${
                          isMine
                            ? "bg-[#98E499] text-[#26282a] font-medium rounded-tr-xs shadow-md"
                            : "bg-[#242628] text-gray-200 border border-[var(--line)] rounded-tl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>

                      <div className={`flex items-center gap-1.5 text-[9px] text-gray-500 ${isMine ? "justify-end pr-1" : "pl-1"}`}>
                        <span>{timeStr}</span>
                        {isMine && (
                          <span className="text-[#98E499]">
                            <Icon name="doubleCheck" size={11} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* COMPOSER */}
          <footer className="p-4 border-t border-[var(--line)] bg-[#1e2022] space-y-2">
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachedFiles.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#242628] border border-[var(--line)] text-xs text-gray-200"
                  >
                    <Icon name="file" size={13} />
                    <span className="truncate max-w-[120px] text-[11px]">{att.name}</span>
                    <button
                      onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== att.id))}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-[#18191b] p-2 rounded-2xl border border-[var(--line)] focus-within:border-[#98E499]/50 transition">
              <textarea
                rows={2}
                placeholder="Write a message... (Shift+Enter for new line)"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-xs text-white placeholder-gray-500 resize-none focus:outline-none p-1.5 custom-scrollbar"
              />

              <div className="flex items-center gap-2 shrink-0 pb-1">
                <button
                  onClick={handleAddAttachment}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#242628] transition cursor-pointer"
                  title="Attach file"
                >
                  <Icon name="paperclip" size={16} />
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() && attachedFiles.length === 0}
                  style={
                    messageInput.trim() || attachedFiles.length > 0
                      ? { backgroundColor: "#98E499", color: "#26282a" }
                      : {}
                  }
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    messageInput.trim() || attachedFiles.length > 0
                      ? "hover:bg-[#85d886] shadow-sm"
                      : "bg-[#242628] text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <span>Send</span>
                  <Icon name="send" size={13} />
                </button>
              </div>
            </div>
          </footer>
        </main>

        {/* DETAILS PANEL */}
        {showDetailPanel && (
          <aside className="w-72 shrink-0 border-l border-[var(--line)] bg-[#1e2022] p-4 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-xs font-semibold text-white">Workspace Details</strong>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Active Members ({members.length})
              </span>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center text-[10px] text-[#98E499] font-semibold">
                        {m.user.name ? m.user.name.slice(0, 2).toUpperCase() : "US"}
                      </div>
                      <span className="text-gray-200 font-medium truncate max-w-[120px]">{m.user.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL INVITE MEMBER VIA EMAIL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleInviteMember}
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[#1e2022] p-5 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-xs font-semibold">Invite Real Member to Workspace</strong>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteStatus(null);
                }}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">User Registered Email</label>
              <input
                required
                type="email"
                autoFocus
                placeholder="e.g. colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499] transition"
              />
            </div>

            {inviteStatus && (
              <p
                className={`text-xs ${
                  inviteStatus.startsWith("Error")
                    ? "text-red-400"
                    : inviteStatus.startsWith("Success")
                    ? "text-[#98E499]"
                    : "text-amber-400"
                }`}
              >
                {inviteStatus}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteStatus(null);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs text-gray-300 hover:bg-[#242628]"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-[#85d886] transition cursor-pointer"
              >
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}
    </WorkspaceShell>
  );
}