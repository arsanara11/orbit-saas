"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";

type NotificationCategory = "Tasks" | "Mentions" | "Projects" | "Messages" | "Deadlines";
type FilterTab = "All" | "Unread" | "Mentions" | "Tasks" | "Projects" | "Messages";

type NotificationItem = {
  id: string;
  actorName?: string;
  actorAvatar?: string;
  category: NotificationCategory;
  title: string;
  description: string;
  targetName: string;
  targetUrl: string;
  timestamp: string;
  timeGroup: "TODAY" | "YESTERDAY" | "EARLIER";
  isRead: boolean;
};

// --- DATASET MOCK NOTIFIKASI ---
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    actorName: "Sarah M.",
    actorAvatar: "SM",
    category: "Tasks",
    title: "completed a task",
    description: "Sarah completed Design Homepage",
    targetName: "#Website Redesign",
    targetUrl: "/projects?id=proj-2",
    timestamp: "10:42 AM",
    timeGroup: "TODAY",
    isRead: false,
  },
  {
    id: "notif-2",
    actorName: "Alex Rivera",
    actorAvatar: "AR",
    category: "Mentions",
    title: "mentioned you",
    description: "Alex mentioned you in Project Discussion: 'Gimana progress layoutnya?'",
    targetName: "#Orbit Workspace",
    targetUrl: "/messages",
    timestamp: "09:30 AM",
    timeGroup: "TODAY",
    isRead: false,
  },
  {
    id: "notif-3",
    category: "Deadlines",
    title: "Deadline Approaching",
    description: "API Integration is due tomorrow",
    targetName: "Task #104",
    targetUrl: "/overview#todays-focus",
    timestamp: "08:15 AM",
    timeGroup: "TODAY",
    isRead: false,
  },
  {
    id: "notif-4",
    actorName: "Daniel S.",
    actorAvatar: "DS",
    category: "Projects",
    title: "added you to project",
    description: "You were added as collaborator in Mobile Application UI",
    targetName: "#Mobile App",
    targetUrl: "/projects",
    timestamp: "04:20 PM",
    timeGroup: "YESTERDAY",
    isRead: true,
  },
  {
    id: "notif-5",
    actorName: "Jasmine L.",
    actorAvatar: "JL",
    category: "Messages",
    title: "sent you a direct message",
    description: "Jasmine: 'Aset logo yang baru udah disimpit di Figma ya.'",
    targetName: "Direct Message",
    targetUrl: "/messages",
    timestamp: "02:10 PM",
    timeGroup: "YESTERDAY",
    isRead: true,
  },
  {
    id: "notif-6",
    actorName: "System",
    category: "Tasks",
    title: "Task status updated",
    description: "Wireframe Mobile View was moved to In Review",
    targetName: "#Website Redesign",
    targetUrl: "/overview",
    timestamp: "3 days ago",
    timeGroup: "EARLIER",
    isRead: true,
  },
];

function Icon({ name, size = 16 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, React.ReactNode> = {
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    checkCheck: <path d="M18 6 7 17l-5-5M22 10l-7.5 7.5L13 16" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.1 1.8-1.8 3.1-2.1-.5a8 8 0 0 1-1.8 1l-.7 2h-3.6l-.7-2a8 8 0 0 1-1.8-1l-2.1.5-1.8-3.1 1.1-1.8a7 7 0 0 1 0-2l-1.1-1.8 1.8-3.1 2.1.5a8 8 0 0 1 1.8-1l.7-2h3.6l.7 2a8 8 0 0 1 1.8 1l2.1-.5 1.8 3.1-1.1 1.8a7 7 0 0 1 0 2Z" />
      </>
    ),
    task: <path d="m5 12 4 4L19 6" />,
    at: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        <path d="M3 10h18" />
      </>
    ),
    message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg {...common}>{paths[name] || paths.bell}</svg>;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "Unread") return !n.isRead;
      if (activeTab === "Mentions") return n.category === "Mentions";
      if (activeTab === "Tasks") return n.category === "Tasks" || n.category === "Deadlines";
      if (activeTab === "Projects") return n.category === "Projects";
      if (activeTab === "Messages") return n.category === "Messages";
      return true;
    });
  }, [notifications, activeTab]);

  const groupedNotifications = useMemo(() => {
    const today = filteredNotifications.filter((n) => n.timeGroup === "TODAY");
    const yesterday = filteredNotifications.filter((n) => n.timeGroup === "YESTERDAY");
    const earlier = filteredNotifications.filter((n) => n.timeGroup === "EARLIER");
    return { today, yesterday, earlier };
  }, [filteredNotifications]);

  function handleMarkAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function handleToggleRead(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  }

  function handleDeleteNotification(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function handleNotificationClick(notif: NotificationItem) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    router.push(notif.targetUrl);
  }

  function getCategoryBadge(category: NotificationCategory) {
    switch (category) {
      case "Mentions":
        return { icon: "at", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      case "Tasks":
        return { icon: "task", color: "text-[#98E499] bg-[#98E499]/10 border-[#98E499]/20" };
      case "Projects":
        return { icon: "folder", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case "Messages":
        return { icon: "message", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
      case "Deadlines":
        return { icon: "clock", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      default:
        return { icon: "bell", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" };
    }
  }

  return (
    <WorkspaceShell>
      <div className="max-w-5xl mx-auto p-6 text-white space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span
                  style={{ backgroundColor: "#98E499", color: "#26282a" }}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm"
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Stay updated on what's happening in your workspace.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={`h-8.5 px-3.5 rounded-xl border border-[var(--line)] text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                unreadCount > 0
                  ? "bg-[#242628] text-gray-200 hover:text-white hover:bg-[#2c2f32]"
                  : "bg-[#1e2022] text-gray-500 cursor-not-allowed border-transparent"
              }`}
            >
              <Icon name="checkCheck" size={14} />
              <span>Mark all as read</span>
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="p-2 rounded-xl bg-[#242628] hover:bg-[#2c2f32] border border-[var(--line)] text-gray-400 hover:text-white transition cursor-pointer"
              title="Notification Settings"
            >
              <Icon name="settings" size={16} />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-[#1e2022] rounded-xl border border-[var(--line)] custom-scrollbar text-xs">
          {(["All", "Unread", "Mentions", "Tasks", "Projects", "Messages"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={isActive ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  isActive ? "shadow-sm" : "text-gray-400 hover:text-white"
                }`}
              >
                {tab}
                {tab === "Unread" && unreadCount > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold opacity-80">({unreadCount})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification List Container */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-lg space-y-6">
          {filteredNotifications.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1e2022] border border-[var(--line)] flex items-center justify-center mx-auto text-gray-400">
                <Icon name="bell" size={20} />
              </div>
              <strong className="block text-sm font-semibold text-white">No notifications found</strong>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {activeTab === "Unread"
                  ? "You're all caught up! No unread notifications left."
                  : `There are no notifications under the "${activeTab}" category.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group: Today */}
              {groupedNotifications.today.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                    Today
                  </span>
                  <div className="space-y-1.5">
                    {groupedNotifications.today.map((notif) => (
                      <NotificationCard
                        key={notif.id}
                        notif={notif}
                        badge={getCategoryBadge(notif.category)}
                        onClick={() => handleNotificationClick(notif)}
                        onToggleRead={(e) => handleToggleRead(notif.id, e)}
                        onDelete={(e) => handleDeleteNotification(notif.id, e)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Yesterday */}
              {groupedNotifications.yesterday.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                    Yesterday
                  </span>
                  <div className="space-y-1.5">
                    {groupedNotifications.yesterday.map((notif) => (
                      <NotificationCard
                        key={notif.id}
                        notif={notif}
                        badge={getCategoryBadge(notif.category)}
                        onClick={() => handleNotificationClick(notif)}
                        onToggleRead={(e) => handleToggleRead(notif.id, e)}
                        onDelete={(e) => handleDeleteNotification(notif.id, e)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Earlier */}
              {groupedNotifications.earlier.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                    Earlier
                  </span>
                  <div className="space-y-1.5">
                    {groupedNotifications.earlier.map((notif) => (
                      <NotificationCard
                        key={notif.id}
                        notif={notif}
                        badge={getCategoryBadge(notif.category)}
                        onClick={() => handleNotificationClick(notif)}
                        onToggleRead={(e) => handleToggleRead(notif.id, e)}
                        onDelete={(e) => handleDeleteNotification(notif.id, e)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}

// --- ITEM CARD NOTIFIKASI ---
function NotificationCard({
  notif,
  badge,
  onClick,
  onToggleRead,
  onDelete,
}: {
  notif: NotificationItem;
  badge: { icon: string; color: string };
  onClick: () => void;
  onToggleRead: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start justify-between gap-4 p-3.5 rounded-xl border transition cursor-pointer ${
        !notif.isRead
          ? "bg-[#242628] border-[#98E499]/30 hover:border-[#98E499]/60 shadow-sm"
          : "bg-[#1e2022] border-[var(--line)] hover:bg-[#242628]/60"
      }`}
    >
      {/* Indikator Unread Line */}
      {!notif.isRead && (
        <span
          style={{ backgroundColor: "#98E499" }}
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
        />
      )}

      <div className="flex items-start gap-3 min-w-0 pl-1">
        {/* Avatar / Icon Badge */}
        <div className="relative shrink-0 mt-0.5">
          {notif.actorAvatar ? (
            <div className="w-8 h-8 rounded-full bg-[#98E499]/20 border border-[#98E499]/30 flex items-center justify-center font-bold text-xs text-[#98E499]">
              {notif.actorAvatar}
            </div>
          ) : (
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${badge.color}`}>
              <Icon name={badge.icon} size={15} />
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="min-w-0 space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {notif.actorName && (
              <strong className="text-white font-semibold">{notif.actorName}</strong>
            )}
            <span className="text-gray-300">{notif.title}</span>
            <span className="font-semibold text-[#98E499]">{notif.targetName}</span>
          </div>

          <p className="text-gray-400 text-[11px] line-clamp-2 leading-relaxed">
            {notif.description}
          </p>

          <span className="text-[10px] text-gray-500 block pt-0.5">{notif.timestamp}</span>
        </div>
      </div>

      {/* Hover Action Bar */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition bg-[#1e2022] p-1 rounded-lg border border-[var(--line)]">
        <button
          onClick={onToggleRead}
          className="p-1 text-gray-400 hover:text-[#98E499] transition cursor-pointer"
          title={notif.isRead ? "Mark as unread" : "Mark as read"}
        >
          <Icon name="check" size={13} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-400 transition cursor-pointer"
          title="Dismiss notification"
        >
          <Icon name="trash" size={13} />
        </button>
      </div>
    </div>
  );
}