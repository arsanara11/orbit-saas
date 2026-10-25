"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getInitialWorkspaceData, createProjectAction } from "@/app/actions";

type ProjectType = {
  id: string;
  name: string;
  description?: string;
  taskCount: number;
  type: "Team" | "Personal";
  category: "SaaS Product" | "Design System" | "Research" | "General";
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
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function Avatar({ initials, index = 0 }: { initials: string; index?: number }) {
  return (
    <span className={`avatar avatar-${index % 4}`} title={initials}>
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

  const [dark, setDark] = useState(true);
  const [workspaceTab, setWorkspaceTab] = useState<"Team" | "Personal">("Team");
  const [projectsList, setProjectsList] = useState<ProjectType[]>([]);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectNameInput, setNewProjectNameInput] = useState("");
  const [newProjectDescInput, setNewProjectDescInput] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      getInitialWorkspaceData()
        .then((res) => {
          const formattedProjects: ProjectType[] = res.workspace.projects.map((p, idx) => {
            const isPersonal = p.description?.startsWith("[PERSONAL]");
            return {
              id: p.id,
              name: p.name,
              description: isPersonal && p.description ? p.description.replace("[PERSONAL]", "").trim() : p.description || "",
              taskCount: p.tasks ? p.tasks.length : 0,
              type: isPersonal ? "Personal" : "Team",
              category: idx === 0 ? "SaaS Product" : idx === 1 ? "Design System" : idx === 2 ? "Research" : "General",
            };
          });
          setProjectsList(formattedProjects);
        })
        .catch(console.error);
    }
  }, [isPending, session, router]);

  const userInitials = useMemo(() => getInitials(session?.user?.name), [session]);
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const filteredProjectsList = useMemo(() => {
    return projectsList.filter((p) => {
      const matchTab = p.type === workspaceTab;
      const matchSearch = p.name.toLowerCase().includes(projectSearchQuery.toLowerCase());
      const matchCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchTab && matchSearch && matchCategory;
    });
  }, [projectsList, workspaceTab, projectSearchQuery, selectedCategory]);

  async function handleCreateNewProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectNameInput.trim()) return;

    try {
      const rawDesc = newProjectDescInput.trim();

      const created = await createProjectAction(
        newProjectNameInput.trim()
      );

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
      <div className="browser-bar">
        <div className="traffic-lights"><i /><i /><i /></div>
        <div className="browser-tab">
          <span className="brand-mini"><Icon name="spark" size={12} /></span>
          Orbit · Workspace <b>×</b>
        </div>
        <span className="browser-plus">+</span>
        <div className="browser-address">
          <span>◈</span> app.orbit.workspace{pathname} <Icon name="chevron" size={12} />
        </div>
        <div className="browser-right">• • •</div>
      </div>

      <div className="app-layout">
        <aside className="rail">
          <div className="brand-mark"><Icon name="spark" size={22} /></div>
          <div className="rail-nav">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.label}
                  className={active ? "rail-active" : ""}
                >
                  <Icon name={item.icon} />
                </Link>
              );
            })}
          </div>
          <div className="rail-bottom">
            <button title="Help"><span>?</span></button>
            <button className="rail-moon" title="Toggle theme" onClick={() => setDark(!dark)}>
              <Icon name="moon" />
            </button>
          </div>
        </aside>

        <aside className="project-sidebar">
          <div className="side-heading">
            <div>
              <span className="eyebrow">WORKSPACE</span>
              <h2>Projects</h2>
            </div>
            <button
              className="icon-button cursor-pointer"
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
            >
              <Icon name="more" />
            </button>

            {showWorkspaceMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowWorkspaceMenu(false)} />
                <div className="absolute top-12 right-4 z-30 w-48 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-2xl text-xs text-white">
                  <button
                    onClick={() => {
                      setShowWorkspaceMenu(false);
                      setShowNewProjectModal(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#35383a] transition flex items-center gap-2 cursor-pointer"
                  >
                    <Icon name="plus" size={14} /> Create New Project
                  </button>
                </div>
              </>
            )}
          </div>

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
                const isSelected = pathname === "/projects" && searchParams.get("id") === p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/projects?id=${p.id}`}
                    className={`project-item w-full flex items-center justify-between text-left ${
                      isSelected ? "current" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="project-hash">#</span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    <b>{p.taskCount}</b>
                  </Link>
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
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className={`category-item w-full flex items-center justify-between text-left ${
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

          <div className="sidebar-bottom">
            <button
              className="new-project cursor-pointer"
              onClick={() => {
                setNewProjectNameInput("");
                setNewProjectDescInput("");
                setShowNewProjectModal(true);
              }}
            >
              <Icon name="plus" size={16} /> New project
            </button>

            <div className="profile-row">
              <Avatar initials={userInitials} />
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

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute bottom-12 right-2 z-30 w-40 rounded-xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-xl text-xs text-white">
                    <button
                      onClick={() =>
                        authClient.signOut({
                          fetchOptions: { onSuccess: () => router.push("/login") },
                        })
                      }
                      className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-[#35383a] transition cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        <section className="main-content">
          <header className="topbar">
            <div className="breadcrumbs">
              <span className="capitalize">{pathname.replace("/", "")}</span>
            </div>

            <div className="top-actions">
              <span className="last-updated"><i /> Saved just now</span>
              <button className="top-icon cursor-pointer" onClick={() => setShowNotifications(!showNotifications)}>
                <Icon name="bell" />
                <i />
              </button>
              <button className="top-icon cursor-pointer" onClick={() => setDark(!dark)}>
                <Icon name="moon" />
              </button>
              <Avatar initials={userInitials} />
            </div>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
                <div className="notification-pop z-30">
                  <strong>Notifications</strong>
                  <p><span className="notice-dot" /> All workspace services are operational.</p>
                  <button onClick={() => setShowNotifications(false)}>Mark as read</button>
                </div>
              </>
            )}
          </header>

          <div className="p-6">{children}</div>

          <footer className="app-footer">
            <span>© 2026 Orbit Workspace</span>
            <span><span className="footer-status" /> All changes saved</span>
          </footer>
        </section>
      </div>

      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form
            onSubmit={handleCreateNewProjectSubmit}
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Create New Project</strong>
              <button type="button" onClick={() => setShowNewProjectModal(false)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Project Name</label>
              <input
                required
                autoFocus
                placeholder="e.g. Mobile App Redesign"
                value={newProjectNameInput}
                onChange={(e) => setNewProjectNameInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Optional description..."
                value={newProjectDescInput}
                onChange={(e) => setNewProjectDescInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <button type="button" onClick={() => setShowNewProjectModal(false)} className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 text-xs text-white font-medium hover:bg-violet-500">Create Project</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}