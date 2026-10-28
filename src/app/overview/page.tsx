"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { authClient } from "@/lib/auth-client";
import { useWorkspace, CalendarItem } from "@/context/WorkspaceContext";
import {
  getInitialWorkspaceData,
  createProjectAction,
} from "@/app/actions";

type Status = "To Do" | "In Progress" | "In Review";

type TaskUI = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: "Low" | "Medium" | "High";
  date: string;
  rawDate: Date;
  progress: number;
  comments: number;
  files: number;
  people: string[];
  projectId: string;
  projectName: string;
};

type ProjectUI = {
  id: string;
  name: string;
  taskCount: number;
  completedTaskCount: number;
  type: "Team" | "Personal";
  category: string;
};

type ActivityUI = {
  id: string;
  type: "task_created" | "task_completed" | "project_created";
  title: string;
  timestamp: string;
  project: string;
};

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
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        <path d="M3 10h18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
    spark: <path d="m12 2 1.7 7.3L21 12l-7.3 1.7L12 21l-1.7-7.3L3 12l7.3-2.7Z" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] || paths.folder}</svg>;
}

export default function OverviewPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { profile, calendarItems, addCalendarItem, toggleTaskStatus, activities, logActivity } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectUI[]>([]);
  const [myTasksFilter, setMyTasksFilter] = useState<"All" | "In Progress" | "Overdue">("All");

  const [activeTask, setActiveTask] = useState<TaskUI | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      setLoading(true);
      getInitialWorkspaceData()
        .then((res) => {
          const formattedProjects: ProjectUI[] = res.workspace.projects.map((p, idx) => ({
            id: p.id,
            name: p.name,
            taskCount: p.tasks ? p.tasks.length : 0,
            completedTaskCount: p.tasks
              ? p.tasks.filter((t) => t.status === "IN_REVIEW").length
              : 0,
            type: p.description?.startsWith("[PERSONAL]") ? "Personal" : "Team",
            category:
              idx === 0
                ? "SaaS Product"
                : idx === 1
                ? "Design System"
                : idx === 2
                ? "Research"
                : "General",
          }));
          setProjects(formattedProjects);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isPending, session, router]);

  const tasks: TaskUI[] = useMemo(() => {
    return calendarItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || "",
      status: item.status === "completed" ? "In Review" : "In Progress",
      priority: item.priority || "Medium",
      date: item.date,
      rawDate: new Date(item.date),
      progress: item.status === "completed" ? 100 : 50,
      comments: 2,
      files: 1,
      people: [profile.initials],
      projectId: "proj-1",
      projectName: item.project || "Orbit Workspace",
    }));
  }, [calendarItems, profile.initials]);

  const userName = profile.name || session?.user?.name || "User";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const myTasksCount = useMemo(() => tasks.filter((t) => t.status !== "In Review").length, [tasks]);

  const dueTodayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return tasks.filter(
      (t) => t.status !== "In Review" && t.date === todayStr
    );
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(
      (t) => t.status !== "In Review" && new Date(t.date) < today
    );
  }, [tasks]);

  const completedThisWeekCount = useMemo(() => {
    return tasks.filter((t) => t.status === "In Review").length;
  }, [tasks]);

  const todaysFocusTasks = useMemo(() => {
    const list = [...tasks.filter((t) => t.status !== "In Review")];
    return list
      .sort((a, b) => {
        const isOverdueA = overdueTasks.some((t) => t.id === a.id);
        const isOverdueB = overdueTasks.some((t) => t.id === b.id);
        if (isOverdueA && !isOverdueB) return -1;
        if (!isOverdueA && isOverdueB) return 1;

        if (a.priority === "High" && b.priority !== "High") return -1;
        if (a.priority !== "High" && b.priority === "High") return 1;

        return b.rawDate.getTime() - a.rawDate.getTime();
      })
      .slice(0, 5);
  }, [tasks, overdueTasks]);

  const filteredMyTasks = useMemo(() => {
    if (myTasksFilter === "In Progress") {
      return tasks.filter((t) => t.status === "In Progress");
    }
    if (myTasksFilter === "Overdue") {
      return overdueTasks;
    }
    return tasks;
  }, [tasks, myTasksFilter, overdueTasks]);

  const recentActivities = useMemo(() => {
    if (activities.length > 0) {
      return activities.slice(0, 5).map((act) => ({
        id: act.id,
        type: act.action.includes("completed") ? ("task_completed" as const) : ("task_created" as const),
        title: act.targetItem,
        timestamp: act.timestamp,
        project: act.project,
      }));
    }
    return tasks.slice(0, 5).map((t) => ({
      id: t.id,
      type: t.status === "In Review" ? ("task_completed" as const) : ("task_created" as const),
      title: t.title,
      timestamp: t.date,
      project: t.projectName,
    }));
  }, [activities, tasks]);

  function handleToggleTaskStatus(taskId: string) {
    toggleTaskStatus(taskId);
  }

  function openTaskDetail(task: TaskUI) {
    setActiveTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
  }

  function handleSaveTaskDetail() {
    if (!activeTask || !editTitle.trim()) return;
    logActivity("updated task details", editTitle.trim(), activeTask.projectName);
    setActiveTask(null);
  }

  function handleCreateTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const matchedProj = projects.find((p) => p.id === newTaskProjectId);

    addCalendarItem({
      type: "task",
      title: newTaskTitle.trim(),
      date: new Date().toISOString().split("T")[0],
      project: matchedProj?.name || "Orbit Workspace",
      priority: newTaskPriority,
      status: "pending",
      colorCategory: "lime",
    });

    setShowNewTaskModal(false);
    setNewTaskTitle("");
  }

  async function handleCreateProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const created = await createProjectAction(newProjectName.trim());
      const newProjUI: ProjectUI = {
        id: created.id,
        name: created.name,
        taskCount: 0,
        completedTaskCount: 0,
        type: "Team",
        category: "SaaS Product",
      };

      setProjects((old) => [...old, newProjUI]);
      logActivity("created project", newProjectName.trim(), newProjectName.trim());
      setShowNewProjectModal(false);
      setNewProjectName("");
      router.push(`/projects?id=${created.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
    }
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="p-6 space-y-6 text-white animate-pulse">
          <div className="h-20 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-28 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
            <div className="h-28 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
            <div className="h-28 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
            <div className="h-28 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="p-6 text-white space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-lg">
          <div className="space-y-0.5">
            <span className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">{todayFormatted}</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-xs text-gray-400">
              You have <span className="text-[#98E499] font-semibold">{myTasksCount} active tasks</span> and{" "}
              <span className="text-amber-400 font-semibold">{dueTodayTasks.length} tasks due today</span>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            {/* Tombol Primary Green Glow */}
            <button
              onClick={() => {
                setNewTaskTitle("");
                setShowNewTaskModal(true);
              }}
              style={{ backgroundColor: "#98E499", color: "#26282a" }}
              className="h-8.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_10px_rgba(152,228,153,0.25)] hover:shadow-[0_4px_16px_rgba(152,228,153,0.4)] hover:bg-[#85d886] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <Icon name="plus" size={13} />
              <span>New Task</span>
            </button>

            {/* Tombol Secondary Dark */}
            <button
              onClick={() => {
                setNewProjectName("");
                setShowNewProjectModal(true);
              }}
              className="h-8.5 px-3.5 rounded-xl bg-[#242628] hover:bg-[#2c2f32] border border-[var(--line)] text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <Icon name="plus" size={13} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setMyTasksFilter("All")}
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-[#98E499]/50 transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">My Active Tasks</span>
              <span className="p-2 rounded-xl bg-[#1e2022] text-[#98E499]">
                <Icon name="folder" size={16} />
              </span>
            </div>
            <strong className="text-2xl font-bold text-white block">{myTasksCount}</strong>
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              <span>Today: <b className="text-amber-400">{dueTodayTasks.length}</b></span>
              <span>Overdue: <b className="text-red-400">{overdueTasks.length}</b></span>
            </div>
          </div>

          <div
            onClick={() => router.push("/projects")}
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-[#98E499]/50 transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">Active Projects</span>
              <span className="p-2 rounded-xl bg-[#1e2022] text-[#98E499]">
                <Icon name="spark" size={16} />
              </span>
            </div>
            <strong className="text-2xl font-bold text-white block">{projects.length || 1}</strong>
            <span className="text-[11px] text-gray-400 block">Workspace active boards</span>
          </div>

          <div
            onClick={() => setMyTasksFilter("Overdue")}
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-[#98E499]/50 transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">Upcoming Deadlines</span>
              <span className="p-2 rounded-xl bg-[#1e2022] text-amber-400">
                <Icon name="clock" size={16} />
              </span>
            </div>
            <strong className="text-2xl font-bold text-white block">{dueTodayTasks.length + overdueTasks.length}</strong>
            <span className="text-[11px] text-gray-400 block">Requires attention this week</span>
          </div>

          <div
            onClick={() => setMyTasksFilter("All")}
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-[#98E499]/50 transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">Completed Tasks</span>
              <span className="p-2 rounded-xl bg-[#1e2022] text-[#98E499]">
                <Icon name="check" size={16} />
              </span>
            </div>
            <strong className="text-2xl font-bold text-white block">{completedThisWeekCount}</strong>
            <span className="text-[11px] text-[#98E499] font-medium block">✓ In Review / Completed</span>
          </div>
        </div>

        {/* Today's Focus & Project Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="todays-focus" className="lg:col-span-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg scroll-mt-6">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-sm font-semibold text-white">Today's Focus</h3>
                <p className="text-xs text-gray-400">Prioritized tasks for your current workflow</p>
              </div>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
                {todaysFocusTasks.length} Priority Tasks
              </span>
            </div>

            {todaysFocusTasks.length === 0 ? (
              <div className="py-10 text-center text-gray-400 space-y-3">
                <p className="text-sm">🎉 You're all caught up for today!</p>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  style={{ backgroundColor: "#98E499", color: "#26282a" }}
                  className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#85d886] transition cursor-pointer"
                >
                  Create your first task
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysFocusTasks.map((t) => {
                  const isOverdue = overdueTasks.some((o) => o.id === t.id);
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:border-[#98E499]/50 transition ${
                        isOverdue ? "border-red-500/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTaskStatus(t.id)}
                          style={t.status === "In Review" ? { backgroundColor: "#98E499", borderColor: "#98E499", color: "#26282a" } : {}}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                            t.status === "In Review"
                              ? "font-bold"
                              : "border-gray-500 hover:border-[#98E499]"
                          }`}
                        >
                          {t.status === "In Review" && <Icon name="check" size={12} />}
                        </button>
                        <div className="min-w-0">
                          <strong
                            onClick={() => openTaskDetail(t)}
                            className="text-xs text-white truncate block hover:text-[#98E499] cursor-pointer"
                          >
                            {t.title}
                          </strong>
                          <span className="text-[10px] text-gray-400 block truncate">
                            #{t.projectName} · Due {t.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isOverdue && (
                          <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                            <Icon name="alert" size={11} /> Overdue
                          </span>
                        )}
                        <span className={`priority priority-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                        <button
                          onClick={() => openTaskDetail(t)}
                          className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer"
                        >
                          <Icon name="arrowRight" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-white">Project Progress</h3>
              <button
                onClick={() => router.push("/projects")}
                className="text-xs text-[#98E499] hover:underline cursor-pointer font-medium"
              >
                View all
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="py-8 text-center text-gray-400 space-y-3">
                <p className="text-xs">No projects in this workspace yet.</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  style={{ backgroundColor: "#98E499", color: "#26282a" }}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-[#85d886] transition cursor-pointer"
                >
                  Create project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 4).map((p) => {
                  const percent =
                    p.taskCount > 0 ? Math.round((p.completedTaskCount / p.taskCount) * 100) : 40;
                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/projects?id=${p.id}`)}
                      className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:border-[#98E499]/50 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-gray-200 truncate">{p.name}</strong>
                        <span className="text-[#98E499] font-bold">{percent}%</span>
                      </div>

                      <div className="w-full bg-[#35383a] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#98E499] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span>
                          {p.completedTaskCount} of {p.taskCount} tasks completed
                        </span>
                        <span className="text-gray-500">{p.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* My Tasks & Upcoming Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="my-tasks" className="lg:col-span-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg scroll-mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-sm font-semibold text-white">My Tasks</h3>
                <p className="text-xs text-gray-400">Broad overview of all assigned tasks</p>
              </div>

              <div className="flex items-center gap-1 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs">
                {(["All", "In Progress", "Overdue"] as const).map((filter) => {
                  const isActive = myTasksFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setMyTasksFilter(filter)}
                      style={isActive ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer font-semibold ${
                        isActive ? "shadow-sm" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {filteredMyTasks.length === 0 ? (
                <p className="py-6 text-center text-xs text-gray-400">
                  No tasks found under "{myTasksFilter}" filter.
                </p>
              ) : (
                filteredMyTasks.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-[#35383a]/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTaskStatus(t.id)}
                        style={t.status === "In Review" ? { backgroundColor: "#98E499", borderColor: "#98E499", color: "#26282a" } : {}}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition cursor-pointer ${
                          t.status === "In Review"
                            ? "font-bold"
                            : "border-gray-500 hover:border-[#98E499]"
                        }`}
                      >
                        {t.status === "In Review" && <Icon name="check" size={10} />}
                      </button>
                      <div className="min-w-0">
                        <strong
                          onClick={() => openTaskDetail(t)}
                          className="text-xs text-white truncate block hover:text-[#98E499] cursor-pointer"
                        >
                          {t.title}
                        </strong>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {t.projectName} · {t.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#35383a] text-[#98E499]">
                        {t.status}
                      </span>
                      <span className={`priority priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
              <button
                onClick={() => router.push("/calendar")}
                className="text-xs text-[#98E499] hover:underline cursor-pointer font-medium"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {tasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTaskDetail(t)}
                  className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] flex items-start gap-3 hover:border-[#98E499]/50 transition cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-[#35383a] text-[#98E499]">
                    <Icon name="calendar" size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block text-white truncate">{t.title}</strong>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      Due Date: {t.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div id="recent-activity" className="lg:col-span-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg scroll-mt-6">
            <div className="pb-3 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
              <p className="text-xs text-gray-400">Latest updates across your workspace</p>
            </div>

            {recentActivities.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No recent activity recorded.</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((act) => (
                  <div
                    key={act.id + act.type}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2022] border border-[var(--line)] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="p-1.5 rounded-lg bg-[#35383a] text-[#98E499]">
                        <Icon name={act.type === "task_completed" ? "check" : "spark"} size={13} />
                      </span>
                      <div className="truncate">
                        <span className="text-white font-medium">{act.title}</span>
                        <span className="text-gray-400 text-[10px] block">
                          {act.type === "task_completed" ? "Marked as completed" : "Activity logged"} in #{act.project}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{act.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg">
            <div className="pb-3 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
              <p className="text-xs text-gray-400">Fast shortcuts for common tasks</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  setNewTaskTitle("");
                  setShowNewTaskModal(true);
                }}
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-[#98E499]/10 hover:border-[#98E499]/40 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="plus" size={18} />
                Create Task
              </button>

              <button
                onClick={() => {
                  setNewProjectName("");
                  setShowNewProjectModal(true);
                }}
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-[#98E499]/10 hover:border-[#98E499]/40 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="folder" size={18} />
                Create Project
              </button>

              <button
                onClick={() => router.push("/calendar")}
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-[#98E499]/10 hover:border-[#98E499]/40 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="calendar" size={18} />
                Open Calendar
              </button>

              <button
                onClick={() => router.push("/projects")}
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-[#98E499]/10 hover:border-[#98E499]/40 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="arrowRight" size={18} />
                View Projects
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Task Detail */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Task Details
              </strong>
              <button
                onClick={() => setActiveTask(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2 text-white focus:outline-none focus:border-[#98E499]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2 text-white focus:outline-none focus:border-[#98E499]"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as "Low" | "Medium" | "High")
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-white focus:outline-none focus:border-[#98E499]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="px-4 py-2 text-xs text-gray-300 hover:bg-[#35383a] rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveTaskDetail}
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#85d886] cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal New Task */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form
            onSubmit={handleCreateTaskSubmit}
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Create New Task</strong>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Task Title</label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. Design Hero Wireframe"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#98E499]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Target Project</label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-white focus:outline-none focus:border-[#98E499]"
                >
                  <option value="">Orbit Workspace</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) =>
                    setNewTaskPriority(e.target.value as "Low" | "Medium" | "High")
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-white focus:outline-none focus:border-[#98E499]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#85d886]"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form
            onSubmit={handleCreateProjectSubmit}
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
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
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
    </WorkspaceShell>
  );
}