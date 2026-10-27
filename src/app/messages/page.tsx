"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { useWorkspace } from "@/context/WorkspaceContext";

// --- TYPES ---
type MessageTab = "Inbox" | "Unread" | "Archived";

type Attachment = {
  id: string;
  name: string;
  size: string;
  type: "file" | "image";
  url?: string;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  exactTime: string;
  dateGroup: "TODAY" | "YESTERDAY" | "EARLIER";
  isMine: boolean;
  status: "sent" | "delivered" | "read";
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  attachments?: Attachment[];
  isPinned?: boolean;
};

type Conversation = {
  id: string;
  name: string;
  type: "direct" | "group";
  avatar: string;
  roleOrStatus?: string;
  isOnline?: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isArchived?: boolean;
  linkedProject?: {
    id: string;
    name: string;
  };
  linkedTask?: {
    id: string;
    title: string;
  };
  members?: { name: string; role: string; avatar: string; isOnline: boolean }[];
};

// --- DATASET AWAL ---
const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    name: "Arkan",
    type: "direct",
    avatar: "AR",
    roleOrStatus: "Online",
    isOnline: true,
    lastMessage: "Oke, nanti kabarin kalau udah siap review.",
    lastMessageTime: "10:52 AM",
    unreadCount: 3,
    linkedProject: { id: "proj-1", name: "Orbit Workspace" },
    linkedTask: { id: "task-101", title: "Finalize dashboard layout" },
    members: [
      { name: "You", role: "Project Lead", avatar: "ME", isOnline: true },
      { name: "Arkan", role: "Frontend Developer", avatar: "AR", isOnline: true },
    ],
  },
  {
    id: "conv-2",
    name: "Dina",
    type: "direct",
    avatar: "DS",
    roleOrStatus: "Offline",
    isOnline: false,
    lastMessage: "Besok kita review ya",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    linkedProject: { id: "proj-2", name: "Website Redesign" },
    members: [
      { name: "You", role: "Project Lead", avatar: "ME", isOnline: true },
      { name: "Dina S.", role: "UI/UX Specialist", avatar: "DS", isOnline: false },
    ],
  },
  {
    id: "conv-3",
    name: "Orbit Team",
    type: "group",
    avatar: "OT",
    roleOrStatus: "4 Members",
    isOnline: true,
    lastMessage: "M. Kenzie: Task baru sudah masuk",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    linkedProject: { id: "proj-1", name: "Orbit Workspace" },
    members: [
      { name: "You", role: "Project Lead", avatar: "ME", isOnline: true },
      { name: "Ahmad Rizky", role: "Frontend Dev", avatar: "AR", isOnline: true },
      { name: "M. Kenzie", role: "UI/UX Designer", avatar: "MK", isOnline: true },
      { name: "Jasmine L.", role: "Backend Dev", avatar: "JL", isOnline: false },
    ],
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "u-arkan",
      senderName: "Arkan",
      senderAvatar: "AR",
      content: "Gimana progress dashboard Orbit?",
      timestamp: "10:48 AM",
      exactTime: "Today at 10:48 AM",
      dateGroup: "TODAY",
      isMine: false,
      status: "read",
    },
    {
      id: "msg-2",
      conversationId: "conv-1",
      senderId: "u-me",
      senderName: "You",
      senderAvatar: "ME",
      content: "Udah hampir selesai, tinggal responsive.",
      timestamp: "10:50 AM",
      exactTime: "Today at 10:50 AM",
      dateGroup: "TODAY",
      isMine: true,
      status: "read",
    },
    {
      id: "msg-3",
      conversationId: "conv-1",
      senderId: "u-arkan",
      senderName: "Arkan",
      senderAvatar: "AR",
      content: "Oke, nanti kabarin kalau udah siap review.",
      timestamp: "10:52 AM",
      exactTime: "Today at 10:52 AM",
      dateGroup: "TODAY",
      isMine: false,
      status: "read",
    },
  ],
  "conv-2": [
    {
      id: "msg-201",
      conversationId: "conv-2",
      senderId: "u-dina",
      senderName: "Dina",
      senderAvatar: "DS",
      content: "Halo, file aset icon kemarin udah di-upload ke Figma ya.",
      timestamp: "4:15 PM",
      exactTime: "Yesterday at 4:15 PM",
      dateGroup: "YESTERDAY",
      isMine: false,
      status: "read",
    },
    {
      id: "msg-202",
      conversationId: "conv-2",
      senderId: "u-dina",
      senderName: "Dina",
      senderAvatar: "DS",
      content: "Besok kita review ya",
      timestamp: "4:16 PM",
      exactTime: "Yesterday at 4:16 PM",
      dateGroup: "YESTERDAY",
      isMine: false,
      status: "read",
    },
  ],
  "conv-3": [
    {
      id: "msg-301",
      conversationId: "conv-3",
      senderId: "u-kenzie",
      senderName: "M. Kenzie",
      senderAvatar: "MK",
      content: "Guys, sprint minggu ini udah di-update di board.",
      timestamp: "2:00 PM",
      exactTime: "Yesterday at 2:00 PM",
      dateGroup: "YESTERDAY",
      isMine: false,
      status: "read",
    },
    {
      id: "msg-302",
      conversationId: "conv-3",
      senderId: "u-kenzie",
      senderName: "M. Kenzie",
      senderAvatar: "MK",
      content: "Task baru sudah masuk",
      timestamp: "2:05 PM",
      exactTime: "Yesterday at 2:05 PM",
      dateGroup: "YESTERDAY",
      isMine: false,
      status: "read",
    },
  ],
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
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    pin: <path d="M12 17v5M9 2h6l-1 5 3 4v2H7v-2l3-4-1-5Z" />,
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
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
    archive: (
      <>
        <rect x="2" y="4" width="20" height="5" rx="1" />
        <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M10 13h4" />
      </>
    ),
    file: (
      <>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </>
    ),
    chevronRight: <path d="m9 18 6-6-6-6" />,
  };

  return <svg {...common}>{paths[name] || paths.folder}</svg>;
}

export default function MessagesPage() {
  const router = useRouter();
  const { profile, logActivity } = useWorkspace();

  // --- STATES ---
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>("conv-1");
  const [activeTab, setActiveTab] = useState<MessageTab>("Inbox");
  const [searchQuery, setSearchQuery] = useState("");

  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [messageInput, setMessageInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);

  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatRecipient, setNewChatRecipient] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0];
  }, [conversations, activeConvId]);

  const currentMessages = useMemo(() => {
    return allMessages[activeConvId] || [];
  }, [allMessages, activeConvId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  useEffect(() => {
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
    );
  }, [activeConvId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (activeTab === "Unread" && c.unreadCount === 0) return false;
      if (activeTab === "Archived" && !c.isArchived) return false;
      if (activeTab !== "Archived" && c.isArchived) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchMsg = c.lastMessage.toLowerCase().includes(q);
        const matchProject = c.linkedProject?.name.toLowerCase().includes(q);
        return matchName || matchMsg || matchProject;
      }

      return true;
    });
  }, [conversations, activeTab, searchQuery]);

  function handleSendMessage() {
    if (!messageInput.trim() && attachedFiles.length === 0) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: activeConvId,
      senderId: "u-me",
      senderName: profile.name,
      senderAvatar: profile.initials,
      content: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      exactTime: `Today at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      dateGroup: "TODAY",
      isMine: true,
      status: "sent",
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : undefined,
    };

    setAllMessages((prev) => ({
      ...prev,
      [activeConvId]: [...(prev[activeConvId] || []), newMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              lastMessage: `You: ${messageInput.trim() || "Sent an attachment"}`,
              lastMessageTime: newMsg.timestamp,
            }
          : c
      )
    );

    logActivity("sent a message", activeConv.name, activeConv.linkedProject?.name || "Orbit Workspace");

    setMessageInput("");
    setReplyingTo(null);
    setAttachedFiles([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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

  function handleDeleteMessage(msgId: string) {
    setAllMessages((prev) => ({
      ...prev,
      [activeConvId]: prev[activeConvId].filter((m) => m.id !== msgId),
    }));
  }

  function handleArchiveConversation(convId: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isArchived: !c.isArchived } : c))
    );
  }

  function handleCreateNewChat(e: React.FormEvent) {
    e.preventDefault();
    if (!newChatRecipient.trim()) return;

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      name: newChatRecipient.trim(),
      type: "direct",
      avatar: newChatRecipient.trim().slice(0, 2).toUpperCase(),
      roleOrStatus: "Online",
      isOnline: true,
      lastMessage: "Started a new conversation",
      lastMessageTime: "Just now",
      unreadCount: 0,
      linkedProject: { id: "proj-1", name: "Orbit Workspace" },
      members: [
        { name: profile.name, role: "Project Lead (You)", avatar: profile.initials, isOnline: true },
        { name: newChatRecipient.trim(), role: "Team Member", avatar: newChatRecipient.trim().slice(0, 2).toUpperCase(), isOnline: true },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setAllMessages((prev) => ({
      ...prev,
      [newConv.id]: [],
    }));
    setActiveConvId(newConv.id);
    setShowNewChatModal(false);
    setNewChatRecipient("");
  }

  return (
    <WorkspaceShell>
      <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#18191b] text-white">
        {/* SIDEBAR PERCAKAPAN */}
        <aside className="w-80 shrink-0 border-r border-[var(--line)] bg-[#1e2022] flex flex-col">
          <div className="p-4 border-b border-[var(--line)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">Messages</h1>
                <span className="text-[10px] bg-[#98E499]/10 text-[#98E499] border border-[#98E499]/20 px-2 py-0.5 rounded-full font-semibold">
                  Connected
                </span>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="p-1.5 rounded-xl font-bold hover:bg-[#85d886] transition cursor-pointer"
                title="Start New Conversation"
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
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#242628] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#98E499] transition"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#141517] p-1 rounded-xl border border-[var(--line)] text-xs">
              {(["Inbox", "Unread", "Archived"] as const).map((tab) => (
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

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredConversations.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#242628] flex items-center justify-center mx-auto text-gray-400">
                  <Icon name="search" size={16} />
                </div>
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition group ${
                      isActive
                        ? "bg-[#282a2d] border border-[#98E499]/40"
                        : "hover:bg-[#242628] border border-transparent"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-xs text-[#98E499]">
                        {conv.avatar}
                      </div>
                      {conv.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#98E499] border-2 border-[#1e2022]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-semibold text-white truncate">
                          {conv.name}
                        </strong>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 truncate">
                        {conv.lastMessage}
                      </p>

                      {conv.linkedProject && (
                        <span className="inline-block text-[9px] text-[#98E499] bg-[#98E499]/10 border border-[#98E499]/20 px-1.5 py-0.2 rounded font-medium">
                          #{conv.linkedProject.name}
                        </span>
                      )}
                    </div>

                    {conv.unreadCount > 0 && (
                      <span
                        style={{ backgroundColor: "#98E499", color: "#26282a" }}
                        className="w-4 h-4 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0"
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* CHAT CONVERSATION */}
        <main className="flex-1 flex flex-col bg-[#18191b] min-w-0 relative">
          <header className="h-14 px-5 border-b border-[var(--line)] bg-[#1e2022] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-xs text-[#98E499]">
                  {activeConv.avatar}
                </div>
                {activeConv.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#98E499] border-2 border-[#1e2022]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-white truncate">
                    {activeConv.name}
                  </h2>
                  <span className="text-[10px] text-gray-400">
                    · {activeConv.roleOrStatus}
                  </span>
                </div>

                {activeConv.linkedProject && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#98E499]">
                    <Icon name="folder" size={11} />
                    <span>Project: {activeConv.linkedProject.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleArchiveConversation(activeConv.id)}
                className="p-1.5 rounded-lg hover:bg-[#242628] text-gray-400 hover:text-white transition cursor-pointer"
                title={activeConv.isArchived ? "Unarchive Conversation" : "Archive Conversation"}
              >
                <Icon name="archive" size={15} />
              </button>

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
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {currentMessages.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1e2022] border border-[var(--line)] flex items-center justify-center mx-auto text-gray-400">
                  <Icon name="smile" size={20} />
                </div>
                <strong className="block text-xs font-semibold text-white">No messages yet</strong>
                <p className="text-xs text-gray-400">
                  Send a message to start communicating with {activeConv.name}.
                </p>
              </div>
            ) : (
              currentMessages.map((msg, index) => {
                const showDateHeader =
                  index === 0 || currentMessages[index - 1].dateGroup !== msg.dateGroup;

                return (
                  <div key={msg.id} className="space-y-3">
                    {showDateHeader && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[var(--line)]" />
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-[#1e2022] px-2.5 py-0.5 rounded-full border border-[var(--line)]">
                          {msg.dateGroup}
                        </span>
                        <div className="flex-1 h-px bg-[var(--line)]" />
                      </div>
                    )}

                    <div
                      className={`flex gap-2.5 group ${
                        msg.isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!msg.isMine && (
                        <div className="w-7 h-7 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-[10px] text-[#98E499] shrink-0 mt-1">
                          {msg.senderAvatar}
                        </div>
                      )}

                      {msg.isMine && (
                        <div className="order-2 shrink-0 mt-1">
                          {profile.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt="Me"
                              className="w-7 h-7 rounded-full object-cover border border-[#98E499]/40"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#98E499] text-[#26282a] flex items-center justify-center font-bold text-[10px]">
                              {profile.initials}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[70%] space-y-1 ${msg.isMine ? "items-end order-1" : "items-start"}`}>
                        {!msg.isMine && activeConv.type === "group" && (
                          <span className="text-[10px] font-medium text-[#98E499] block pl-1">
                            {msg.senderName}
                          </span>
                        )}

                        {msg.replyTo && (
                          <div className="p-2 rounded-lg bg-[#18191b] border-l-2 border-[#98E499] text-[11px] space-y-0.5">
                            <span className="font-semibold text-[#98E499] block text-[10px]">
                              {msg.replyTo.senderName}
                            </span>
                            <p className="text-gray-400 truncate">{msg.replyTo.content}</p>
                          </div>
                        )}

                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed relative ${
                            msg.isMine
                              ? "bg-[#98E499] text-[#26282a] font-medium rounded-tr-xs shadow-md"
                              : "bg-[#242628] text-gray-200 border border-[var(--line)] rounded-tl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1 pt-2 border-t border-black/10">
                              {msg.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 p-1.5 rounded-lg bg-black/10 text-[11px]"
                                >
                                  <Icon name="file" size={13} />
                                  <span className="font-medium truncate flex-1">{att.name}</span>
                                  <span className="text-[9px] opacity-70">{att.size}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div
                            className={`absolute top-2 ${
                              msg.isMine ? "-left-14" : "-right-14"
                            } opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-[#1e2022] p-1 rounded-lg border border-[var(--line)] text-gray-400`}
                          >
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="hover:text-white p-0.5"
                              title="Reply"
                            >
                              <Icon name="reply" size={12} />
                            </button>
                            {msg.isMine && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="hover:text-red-400 p-0.5"
                                title="Delete message"
                              >
                                <Icon name="trash" size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div
                          className={`flex items-center gap-1.5 text-[9px] text-gray-500 ${
                            msg.isMine ? "justify-end pr-1" : "pl-1"
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {msg.isMine && (
                            <span className="text-[#98E499]">
                              <Icon name="doubleCheck" size={11} />
                            </span>
                          )}
                        </div>
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
            {replyingTo && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#242628] border border-[var(--line)] text-xs text-gray-300">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#98E499] font-semibold text-[11px]">
                    Replying to {replyingTo.senderName}:
                  </span>
                  <span className="truncate text-gray-400 text-[11px]">{replyingTo.content}</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Icon name="x" size={13} />
                </button>
              </div>
            )}

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
                      onClick={() =>
                        setAttachedFiles((prev) => prev.filter((f) => f.id !== att.id))
                      }
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
                  onClick={() => setMessageInput((prev) => prev + " 🙂")}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#242628] transition cursor-pointer"
                  title="Insert Emoji"
                >
                  <Icon name="smile" size={16} />
                </button>

                <button
                  onClick={() => setMessageInput((prev) => prev + " @")}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#242628] transition cursor-pointer"
                  title="Mention Member"
                >
                  <Icon name="at" size={16} />
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

        {/* CONVERSATION DETAILS PANEL */}
        {showDetailPanel && (
          <aside className="w-72 shrink-0 border-l border-[var(--line)] bg-[#1e2022] p-4 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-xs font-semibold text-white">Details</strong>
              <button
                onClick={() => setShowDetailPanel(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div className="text-center space-y-2 pb-4 border-b border-[var(--line)]">
              <div className="w-14 h-14 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-base text-[#98E499] mx-auto">
                {activeConv.avatar}
              </div>
              <strong className="block text-sm font-semibold text-white">{activeConv.name}</strong>
              <span className="text-xs text-gray-400">{activeConv.roleOrStatus}</span>
            </div>

            <div className="space-y-3 pb-4 border-b border-[var(--line)]">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Workspace Context
              </span>

              {activeConv.linkedProject && (
                <div className="p-2.5 rounded-xl bg-[#242628] border border-[var(--line)] space-y-1">
                  <span className="text-[10px] text-gray-400 block">Linked Project</span>
                  <button
                    onClick={() => router.push(`/projects?id=${activeConv.linkedProject?.id}`)}
                    className="text-xs font-semibold text-[#98E499] hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="folder" size={13} />
                    <span>#{activeConv.linkedProject.name}</span>
                  </button>
                </div>
              )}

              {activeConv.linkedTask && (
                <div className="p-2.5 rounded-xl bg-[#242628] border border-[var(--line)] space-y-1">
                  <span className="text-[10px] text-gray-400 block">Related Task</span>
                  <button
                    onClick={() => router.push("/overview")}
                    className="text-xs font-semibold text-[#98E499] hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <Icon name="check" size={13} />
                    <span>{activeConv.linkedTask.title}</span>
                  </button>
                </div>
              )}
            </div>

            {activeConv.members && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Participants ({activeConv.members.length})
                </span>

                <div className="space-y-2">
                  {activeConv.members.map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center text-[10px] text-[#98E499] font-semibold">
                          {m.avatar}
                        </div>
                        <span className="text-gray-200 font-medium">{m.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* MODAL NEW CHAT */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateNewChat}
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[#1e2022] p-5 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-xs font-semibold">New Conversation</strong>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1 font-medium">Recipient Name</label>
              <input
                required
                autoFocus
                placeholder="e.g. Jasmine L. or Design Team"
                value={newChatRecipient}
                onChange={(e) => setNewChatRecipient(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499] transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-gray-300 hover:bg-[#242628]"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-[#85d886] transition cursor-pointer"
              >
                Start Chat
              </button>
            </div>
          </form>
        </div>
      )}
    </WorkspaceShell>
  );
}