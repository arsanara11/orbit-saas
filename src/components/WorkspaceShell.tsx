"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  getInitialWorkspaceData,
  createProjectAction,
  addMemberByEmailAction,
} from "@/app/actions";

type ProjectType = {
  id: string;
  name: string;
  description?: string;
  taskCount: number;
  type: "Team" | "Personal";
  category: "SaaS Product" | "Design System" | "Research" | "General";
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

const navItems = [
  { label: "Overview", icon: "grid", href: "/overview" },
  { label: "Projects", icon: "folder", href: "/projects" },
  { label: "Activity", icon: "activity", href: "/activity" },
  { label: "Messages", icon: "message", href: "/messages" },
  { label: "Calendar", icon: "calendar", href: "/calendar" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

function Icon({ name, size = 18 }: { name: string; size?: number }) {
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
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        <path d="M3 10h18" />
      </>
    ),
    activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    message: (
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-4-.9L3 20l1.5-4A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.1 8 7z" />
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          d="m19.4 15 .1.1 1.1 1.8-1.8 3.1-2.1-.5a8 8 0 0 1-1.8 1l-.7 2h-3.6l-.7-2a8 8 0 0 1-1.8-1l-2.1.5-1.8-3.1 1.1-1.8a7 7 0 0 1 0-2l-1.1-1.8 1.8-3.1 2.1.5a8 8 0 0 1 1.8-1l.7-2h3.6l.7 2a8 8 0 0 1 1.8 1l2.1-.5 1.8 3.1-1.1 1.8a7 7 0 0 1 0 2Z"
          transform="translate(0 -1) scale(.94)"
        />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    more: (
      <>
        <circle cx="5" cy="12" r=".7" />
        <circle cx="12" cy="12" r=".7" />
        <circle cx="19" cy="12" r=".7" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    moon: <path d="M20.5 15A8.5 8.5 0 0 1 9 3.5 8.5 8.5 0 1 0 20.5 15Z" />,
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    spark: <path d="m12 2 1.7 7.3L21 12l-7.3 1.7L12 21l-1.7-7.3L3 12l7.3-2.7Z" />,
    zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    check: <path d="m5 12 4 4L19 6" />,
    refresh: (
      <>
        <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.5L21 8" />
        <path d="M21 3v5h-5" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function Avatar({
  initials,
  src,
  index = 0,
  onClick,
}: {
  initials: string;
  src?: string | null;
  index?: number;
  onClick?: () => void;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        onClick={onClick}
        className="w-7 h-7 rounded-full object-cover cursor-pointer border border-[var(--line)] shrink-0"
      />
    );
  }

  return (
    <span
      className={`avatar avatar-${index % 4} cursor-pointer`}
      title={initials}
      onClick={onClick}
    >
      {initials}
    </span>
  );
}

function getInitials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { profile } = useWorkspace();

  const [dark, setDark] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceTab, setWorkspaceTab] = useState<"Team" | "Personal">("Team");
  const [projectsList, setProjectsList] = useState<ProjectType[]>([]);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeQuickView, setActiveQuickView] = useState<string>("todays-focus");

  const [members, setMembers] = useState<DBMember[]>([]);
  const [inviteEmailInput, setInviteEmailInput] = useState("");
  const [inviteStatusMsg, setInviteStatusMsg] = useState<string | null>(null);

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectNameInput, setNewProjectNameInput] = useState("");
  const [newProjectDescInput, setNewProjectDescInput] = useState("");

  const activeProjectId = searchParams.get("id");
  const isOverviewPage = pathname.startsWith("/overview");
  const isProjectsPage = pathname.startsWith("/projects");
  const showSubSidebar = isOverviewPage || isProjectsPage;

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      getInitialWorkspaceData()
        .then((res) => {
          if (res?.workspace) {
            setWorkspaceId(res.workspace.id);
            if (res.workspace.memberships) {
              setMembers(res.workspace.memberships as unknown as DBMember[]);
            }

            const formattedProjects: ProjectType[] = res.workspace.projects.map((p, idx) => {
              const isPersonal = p.description?.startsWith("[PERSONAL]");
              return {
                id: p.id,
                name: p.name,
                description:
                  isPersonal && p.description
                    ? p.description.replace("[PERSONAL]", "").trim()
                    : p.description || "",
                taskCount: p.tasks ? p.tasks.length : 0,
                type: isPersonal ? "Personal" : "Team",
                category:
                  idx === 0
                    ? "SaaS Product"
                    : idx === 1
                    ? "Design System"
                    : idx === 2
                    ? "Research"
                    : "General",
              };
            });
            setProjectsList(formattedProjects);
          }
        })
        .catch(console.error);
    }
  }, [isPending, session, router]);

  const userName = profile.name || session?.user?.name || "User";
  const userEmail = profile.email || session?.user?.email || "";
  const userInitials = profile.initials || getInitials(userName);
  const userImage = profile.avatarUrl || session?.user?.image;

  const currentProjectName = useMemo(() => {
    if (activeProjectId) {
      const found = projectsList.find((p) => p.id === activeProjectId);
      if (found) return found.name;
    }
    return projectsList[0]?.name || "Orbit Workspace";
  }, [projectsList, activeProjectId]);

  const filteredProjectsList = useMemo(() => {
    return projectsList.filter((p) => {
      const matchTab = p.type === workspaceTab;
      const matchSearch = p.name.toLowerCase().includes(projectSearchQuery.toLowerCase());
      const matchCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchTab && matchSearch && matchCategory;
    });
  }, [projectsList, workspaceTab, projectSearchQuery, selectedCategory]);

  function handleQuickViewClick(sectionId: string) {
    setActiveQuickView(sectionId);
    if (!isOverviewPage) {
      router.push(`/overview#${sectionId}`);
      return;
    }
    const targetEl = document.getElementById(sectionId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleCreateNewProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectNameInput.trim()) return;

    try {
      const rawDesc = newProjectDescInput.trim();
      const created = await createProjectAction(newProjectNameInput.trim());

      const newProjUI: ProjectType = {
        id: created.id,
        name: created.name,
        description: rawDesc,
        taskCount: 0,
        type: workspaceTab,
        category: "SaaS Product",
      };

      setProjectsList((old) => [...old, newProjUI]);
      setShowNewProjectModal(false);
      setNewProjectNameInput("");
      setNewProjectDescInput("");
      router.push(`/projects?id=${created.id}`);
    } catch (error) {
      console.error("Gagal membuat project:", error);
    }
  }

  async function handleInviteMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmailInput.trim() || !workspaceId) return;

    setInviteStatusMsg("Inviting...");
    try {
      const newMember = await addMemberByEmailAction(workspaceId, inviteEmailInput.trim());
      setMembers((prev) => [...prev, newMember as unknown as DBMember]);
      setInviteStatusMsg("Success! Member added.");
      setInviteEmailInput("");
      setTimeout(() => setInviteStatusMsg(null), 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to invite member";
      setInviteStatusMsg(`Error: ${errorMessage}`);
    }
  }

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#242628] text-white">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          Loading Orbit Workspace...
        </div>
      </main>
    );
  }

  return (
    <main className={`orbit-app ${dark ? "dark" : "light"}`}>
      {/* BROWSER BAR */}
      <div className="browser-bar">
        <div className="traffic-lights">
          <i />
          <i />
          <i />
        </div>
        <div className="browser-tab">
          <span className="brand-mini">
            <Icon name="spark" size={12} />
          </span>
          Orbit · Workspace <b>×</b>
        </div>
        <span className="browser-plus">+</span>
        <div className="browser-address">
          <span>◈</span> app.orbit.workspace{pathname} <Icon name="chevron" size={12} />
        </div>
        <div className="browser-right">• • •</div>
      </div>

      <div
        className="app-layout"
        style={{
          gridTemplateColumns: showSubSidebar ? undefined : "60px 1fr",
        }}
      >
        {/* RAIL SIDEBAR */}
        <aside className="rail">
          <div className="brand-mark">
            <Icon name="spark" size={22} />
          </div>
          <div className="rail-nav">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <button
                  key={item.label}
                  title={item.label}
                  onClick={() => router.push(item.href)}
                  className={active ? "rail-active" : ""}
                >
                  <Icon name={item.icon} />
                </button>
              );
            })}
          </div>
          <div className="rail-bottom">
            <button title="Help">
              <span>?</span>
            </button>
            <button
              className="rail-moon"
              title="Toggle theme"
              onClick={() => setDark(!dark)}
            >
              <Icon name="moon" />
            </button>
          </div>
        </aside>

        {/* PROJECT SIDEBAR */}
        {showSubSidebar && (
          <aside className="project-sidebar">
            <div className="side-heading">
              <div>
                <span className="eyebrow">WORKSPACE</span>
                <h2>{isOverviewPage ? "Overview" : "Projects"}</h2>
              </div>
              <div className="relative">
                <button
                  className="icon-button cursor-pointer"
                  onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                  title="Workspace options"
                >
                  <Icon name="more" />
                </button>

                {showWorkspaceMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowWorkspaceMenu(false)} />
                    <div className="absolute top-8 right-0 z-30 w-52 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-2xl text-xs text-white space-y-1">
                      <button
                        onClick={() => {
                          setShowWorkspaceMenu(false);
                          setShowNewProjectModal(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#35383a] transition flex items-center gap-2 cursor-pointer"
                      >
                        <Icon name="plus" size={14} /> Create New Project
                      </button>
                      <button
                        onClick={() => {
                          setShowWorkspaceMenu(false);
                          setShowMembersModal(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#35383a] transition flex items-center gap-2 cursor-pointer"
                      >
                        <Icon name="spark" size={14} /> Manage Members
                      </button>
                      <button
                        onClick={() => {
                          setShowWorkspaceMenu(false);
                          setShowStorageModal(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#35383a] transition flex items-center gap-2 cursor-pointer"
                      >
                        <Icon name="folder" size={14} /> Workspace Storage
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {isOverviewPage ? (
              <>
                <div className="sidebar-section-label">QUICK VIEWS</div>
                <div className="space-y-1">
                  <button
                    onClick={() => handleQuickViewClick("todays-focus")}
                    className={`project-item w-full flex items-center justify-between text-left cursor-pointer ${
                      activeQuickView === "todays-focus" ? "current" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="project-hash flex items-center justify-center">
                        <Icon name="zap" size={13} />
                      </span>
                      <span className="truncate">Today's Focus</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleQuickViewClick("my-tasks")}
                    className={`project-item w-full flex items-center justify-between text-left cursor-pointer ${
                      activeQuickView === "my-tasks" ? "current" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="project-hash flex items-center justify-center">
                        <Icon name="check" size={13} />
                      </span>
                      <span className="truncate">My Tasks</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleQuickViewClick("recent-activity")}
                    className={`project-item w-full flex items-center justify-between text-left cursor-pointer ${
                      activeQuickView === "recent-activity" ? "current" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="project-hash flex items-center justify-center">
                        <Icon name="refresh" size={13} />
                      </span>
                      <span className="truncate">Recent Activity</span>
                    </div>
                  </button>
                </div>

                <div className="sidebar-section-label categories-label">ACTIVE PROJECTS</div>
                <div className="space-y-1">
                  {projectsList.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/projects?id=${p.id}`)}
                      className="project-item w-full flex items-center justify-between text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="project-hash">#</span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      <b>{p.taskCount}</b>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="workspace-switch">
                  <button
                    className={workspaceTab === "Team" ? "selected" : ""}
                    onClick={() => setWorkspaceTab("Team")}
                  >
                    Team
                  </button>
                  <button
                    className={workspaceTab === "Personal" ? "selected" : ""}
                    onClick={() => setWorkspaceTab("Personal")}
                  >
                    Personal
                  </button>
                </div>

                <label className="project-search">
                  <Icon name="search" size={16} />
                  <input
                    placeholder="Search projects..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                  />
                  <kbd>⌘ K</kbd>
                </label>

                <div
                  className="sidebar-section-label cursor-pointer flex items-center justify-between"
                  onClick={() => setIsRecentOpen(!isRecentOpen)}
                >
                  <span>RECENT</span>
                  <span className={`transform transition-transform ${isRecentOpen ? "rotate-0" : "-rotate-90"}`}>
                    <Icon name="chevron" size={13} />
                  </span>
                </div>

                {isRecentOpen && (
                  <div className="space-y-1">
                    {filteredProjectsList.map((p) => {
                      const isSelected =
                        pathname === "/projects" &&
                        (searchParams.get("id") === p.id ||
                          (!searchParams.get("id") && projectsList[0]?.id === p.id));
                      return (
                        <button
                          key={p.id}
                          onClick={() => router.push(`/projects?id=${p.id}`)}
                          className={`project-item w-full flex items-center justify-between text-left cursor-pointer ${
                            isSelected ? "current" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="project-hash">#</span>
                            <span className="truncate">{p.name}</span>
                          </div>
                          <b>{p.taskCount}</b>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div
                  className="sidebar-section-label categories-label cursor-pointer flex items-center justify-between"
                  onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                >
                  <span>CATEGORIES</span>
                  <span className={`transform transition-transform ${isCategoriesOpen ? "rotate-0" : "-rotate-90"}`}>
                    <Icon name="chevron" size={13} />
                  </span>
                </div>

                {isCategoriesOpen && (
                  <div className="space-y-1">
                    {[
                      { name: "SaaS Product", color: "purple" },
                      { name: "Design System", color: "green" },
                      { name: "Research", color: "amber" },
                    ].map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() =>
                          setSelectedCategory(selectedCategory === cat.name ? null : cat.name)
                        }
                        className={`category-item w-full flex items-center justify-between text-left cursor-pointer ${
                          selectedCategory === cat.name ? "bg-[#35383a] text-white" : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`category-dot ${cat.color}`} />
                          {cat.name}
                        </span>
                        <span>{selectedCategory === cat.name ? "✓" : "›"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="sidebar-bottom">
              <div
                className="storage-card cursor-pointer hover:border-violet-500/50 transition"
                onClick={() => setShowStorageModal(true)}
                title="Click to view workspace storage details"
              >
                <div className="storage-icon">
                  <Icon name="folder" size={16} />
                </div>
                <div>
                  <strong>Workspace storage</strong>
                  <small>68% of 10 GB used</small>
                  <div className="storage-track">
                    <i />
                  </div>
                </div>
              </div>

              <button
                className="new-project cursor-pointer hover:bg-violet-600/20 transition"
                onClick={() => {
                  setNewProjectNameInput("");
                  setNewProjectDescInput("");
                  setShowNewProjectModal(true);
                }}
              >
                <Icon name="plus" size={16} /> New project
              </button>

              <div className="profile-row relative">
                <Avatar
                  initials={userInitials}
                  src={userImage}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                />
                <div className="min-w-0 flex-1">
                  <strong className="truncate">{userName}</strong>
                  <small className="truncate block">{userEmail || "Free workspace"}</small>
                </div>
                <button
                  className="icon-button cursor-pointer"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <Icon name="more" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* MAIN SECTION */}
        <section className="main-content" style={{ minWidth: 0, width: "100%" }}>
          <header className="topbar">
            {/* Clickable Breadcrumbs */}
            <div className="breadcrumbs">
              <Link href="/overview" className="capitalize hover:underline">
                Orbit
              </Link>
              <span className="crumb-slash">/</span>
              <Link href={pathname} className="capitalize hover:underline font-semibold text-white">
                {pathname.replace("/", "")}
              </Link>
              {pathname.startsWith("/projects") && (
                <>
                  <span className="crumb-slash">/</span>
                  <strong>{currentProjectName}</strong>
                </>
              )}
            </div>

            <div className="top-actions">
              <span className="last-updated">
                <i /> Saved just now
              </span>

              {/* Notification Bell Button */}
              <button
                className="top-icon cursor-pointer"
                onClick={() => router.push("/notifications")}
                title="Notifications"
              >
                <Icon name="bell" />
                <i />
              </button>

              {/* Theme Toggle */}
              <button className="top-icon cursor-pointer" onClick={() => setDark(!dark)} title="Toggle theme">
                <Icon name="moon" />
              </button>

              {/* Topbar Avatar + Profile Dropdown Menu */}
              <div className="relative">
                <Avatar
                  initials={userInitials}
                  src={userImage}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                />

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-10 z-30 w-48 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-2xl text-xs text-white space-y-1">
                      <div className="px-3 py-2 border-b border-[var(--line)]">
                        <strong className="block truncate font-semibold">{userName}</strong>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {userEmail || "Free workspace"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          router.push("/settings");
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#35383a] transition cursor-pointer flex items-center gap-2"
                      >
                        <Icon name="settings" size={14} /> Settings
                      </button>
                      <button
                        onClick={() =>
                          authClient.signOut({
                            fetchOptions: { onSuccess: () => router.push("/login") },
                          })
                        }
                        className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-[#35383a] transition cursor-pointer flex items-center gap-2"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Invite Members Button */}
              <button
                className="invite-button cursor-pointer"
                onClick={() => setShowMembersModal(true)}
              >
                <Icon name="plus" size={15} /> Invite members
              </button>
            </div>
          </header>

          {children}

          <footer className="app-footer">
            <span>© 2026 Orbit Workspace</span>
            <span>
              <span className="footer-status" /> All changes saved
            </span>
          </footer>
        </section>
      </div>

      {/* STORAGE MODAL */}
      {showStorageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Workspace Storage Details</strong>
              <button
                onClick={() => setShowStorageModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] space-y-2">
                <div className="flex justify-between font-medium">
                  <span>Used Storage</span>
                  <span className="text-[#98E499]">6.8 GB / 10 GB</span>
                </div>
                <div className="w-full bg-[#35383a] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#98E499] h-full rounded-full w-[68%]" />
                </div>
              </div>

              <div className="space-y-2 pt-1 text-gray-300">
                <div className="flex justify-between p-2 rounded-lg bg-[#1e2022]/60">
                  <span>Project Attachments & Media</span>
                  <strong>4.2 GB</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#1e2022]/60">
                  <span>Task History & Logs</span>
                  <strong>1.8 GB</strong>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#1e2022]/60">
                  <span>Database Indexes</span>
                  <strong>0.8 GB</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowStorageModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS & INVITE MODAL */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Workspace Members ({members.length})</strong>
              <button
                onClick={() => {
                  setShowMembersModal(false);
                  setInviteStatusMsg(null);
                }}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteMemberSubmit} className="space-y-2">
              <label className="block text-xs text-gray-400">Invite Member via Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={inviteEmailInput}
                  onChange={(e) => setInviteEmailInput(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: "#98E499", color: "#26282a" }}
                  className="px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#85d886]"
                >
                  Invite
                </button>
              </div>
              {inviteStatusMsg && (
                <p className={`text-[11px] ${inviteStatusMsg.startsWith("Error") ? "text-red-400" : "text-[#98E499]"}`}>
                  {inviteStatusMsg}
                </p>
              )}
            </form>

            <div className="mt-4 space-y-2 max-h-52 overflow-y-auto custom-scrollbar">
              {members.map((m, idx) => {
                const initials = m.user.name ? m.user.name.slice(0, 2).toUpperCase() : "US";
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2022] border border-[var(--line)] text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar initials={initials} src={m.user.image} index={idx} />
                      <div className="min-w-0">
                        <strong className="block text-xs font-semibold truncate text-white">{m.user.name}</strong>
                        <span className="text-[10px] text-gray-400 truncate block">{m.user.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] rounded-md bg-[#35383a] px-2 py-0.5 text-[#98E499] font-medium">
                      {m.role}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => {
                  setShowMembersModal(false);
                  setInviteStatusMsg(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#242628] text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form
            onSubmit={handleCreateNewProjectSubmit}
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Create New Project</strong>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Project Name</label>
              <input
                required
                autoFocus
                placeholder="e.g. Mobile App Redesign"
                value={newProjectNameInput}
                onChange={(e) => setNewProjectNameInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#98E499]"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Optional description..."
                value={newProjectDescInput}
                onChange={(e) => setNewProjectDescInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#98E499]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#85d886]"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}