"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { authClient } from "@/lib/auth-client";
import {
  getInitialWorkspaceData,
  createTaskAction,
  updateTaskStatusAction,
  updateTaskAction,
  deleteTaskAction,
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

function statusDbToUi(status: string): Status {
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "IN_REVIEW") return "In Review";
  return "To Do";
}

function statusUiToDb(status: Status): "TODO" | "IN_PROGRESS" | "IN_REVIEW" {
  if (status === "In Progress") return "IN_PROGRESS";
  if (status === "In Review") return "IN_REVIEW";
  return "TODO";
}

function priorityDbToUi(priority: string): "Low" | "Medium" | "High" {
  if (priority === "HIGH" || priority === "URGENT") return "High";
  if (priority === "LOW") return "Low";
  return "Medium";
}

function priorityUiToDb(priority: "Low" | "Medium" | "High"): "LOW" | "MEDIUM" | "HIGH" {
  if (priority === "High") return "HIGH";
  if (priority === "Low") return "LOW";
  return "MEDIUM";
}

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

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskUI[]>([]);
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
          const currentProjName = res.project.name;
          const currentProjId = res.project.id;

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

          const formattedTasks: TaskUI[] = res.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description || "",
            status: statusDbToUi(t.status),
            priority: priorityDbToUi(t.priority),
            date: new Date(t.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            rawDate: new Date(t.createdAt),
            progress: t.progress,
            comments: t.commentCount,
            files: t.fileCount,
            people: t.people.length > 0 ? t.people : ["U"],
            projectId: currentProjId,
            projectName: currentProjName,
          }));
          setTasks(formattedTasks);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isPending, session, router]);

  const userName = session?.user?.name || "User";

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
    const todayStr = new Date().toDateString();
    return tasks.filter(
      (t) => t.status !== "In Review" && new Date(t.rawDate).toDateString() === todayStr
    );
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter(
      (t) => t.status !== "In Review" && new Date(t.rawDate) < today
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
    const list: ActivityUI[] = tasks.map((t) => ({
      id: t.id,
      type: t.status === "In Review" ? "task_completed" : "task_created",
      title: t.title,
      timestamp: t.date,
      project: t.projectName,
    }));
    return list.slice(0, 5);
  }, [tasks]);

  async function handleToggleTaskStatus(taskId: string, currentStatus: Status) {
    const nextStatus: Status = currentStatus === "In Review" ? "To Do" : "In Review";
    const dbStatus = statusUiToDb(nextStatus);

    setTasks((old) =>
      old.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      await updateTaskStatusAction(taskId, dbStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  }

  function openTaskDetail(task: TaskUI) {
    setActiveTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditPriority(task.priority);
  }

  async function handleSaveTaskDetail() {
    if (!activeTask || !editTitle.trim()) return;

    const taskId = activeTask.id;
    const updatedFields = {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
    };

    setTasks((old) =>
      old.map((t) => (t.id === taskId ? { ...t, ...updatedFields } : t))
    );
    setActiveTask(null);

    try {
      await updateTaskAction(taskId, {
        title: updatedFields.title,
        description: updatedFields.description,
        priority: priorityUiToDb(updatedFields.priority),
      });
    } catch (error) {
      console.error("Failed to save task detail:", error);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setTasks((old) => old.filter((t) => t.id !== taskId));
    if (activeTask?.id === taskId) setActiveTask(null);

    try {
      await deleteTaskAction(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  async function handleCreateTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const targetProjectId = newTaskProjectId || projects[0]?.id;
    if (!targetProjectId) return;

    try {
      const created = await createTaskAction({
        title: newTaskTitle.trim(),
        projectId: targetProjectId,
        status: "TODO",
        priority: priorityUiToDb(newTaskPriority),
      });

      const matchedProj = projects.find((p) => p.id === targetProjectId);

      const newTask: TaskUI = {
        id: created.id,
        title: created.title,
        description: created.description || "",
        status: statusDbToUi(created.status),
        priority: priorityDbToUi(created.priority),
        date: new Date(created.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        rawDate: new Date(created.createdAt),
        progress: created.progress,
        comments: created.commentCount,
        files: created.fileCount,
        people: created.people,
        projectId: targetProjectId,
        projectName: matchedProj?.name || "Orbit Project",
      };

      setTasks((old) => [newTask, ...old]);
      setShowNewTaskModal(false);
      setNewTaskTitle("");
    } catch (error) {
      console.error("Failed to create task:", error);
    }
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
            <div className="h-72 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="p-6 text-white space-y-6">
        {/* A. Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-xl">
          <div>
            <span className="text-xs text-gray-400 font-medium">{todayFormatted}</span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              {greeting}, {userName}! 👋
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              You have <span className="text-violet-400 font-semibold">{myTasksCount} active tasks</span> and{" "}
              <span className="text-amber-400 font-semibold">{dueTodayTasks.length} tasks due today</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewTaskTitle("");
                setShowNewTaskModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Icon name="plus" size={15} />
              <span>New Task</span>
            </button>
            <button
              onClick={() => {
                setNewProjectName("");
                setShowNewProjectModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#1e2022] hover:bg-[#2a2d30] border border-white/10 hover:border-white/20 text-xs font-semibold text-gray-200 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Icon name="plus" size={15} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* B. Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setMyTasksFilter("All")}
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-violet-500/50 transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">My Active Tasks</span>
              <span className="p-2 rounded-xl bg-[#1e2022] text-violet-400">
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
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-violet-500/50 transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">Active Projects</span>
              <span className="p-2 rounded-xl bg-[#1e2022] text-violet-400">
                <Icon name="spark" size={16} />
              </span>
            </div>
            <strong className="text-2xl font-bold text-white block">{projects.length}</strong>
            <span className="text-[11px] text-gray-400 block">Workspace active boards</span>
          </div>

          <div
            onClick={() => setMyTasksFilter("Overdue")}
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-violet-500/50 transition cursor-pointer space-y-2"
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
            className="p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] hover:border-violet-500/50 transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium">Completed Tasks</span>
              <span className="p-2 rounded-xl bg-[#1e2022] text-emerald-400">
                <Icon name="check" size={16} />
              </span>
            </div>
            <strong className="text-2xl font-bold text-white block">{completedThisWeekCount}</strong>
            <span className="text-[11px] text-emerald-400 font-medium block">✓ In Review / Completed</span>
          </div>
        </div>

        {/* C. Today's Focus & D. Project Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* C. Today's Focus - Target Smooth Scroll ID: todays-focus */}
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
                  className="px-4 py-2 rounded-xl bg-violet-600 text-xs font-semibold text-white hover:bg-violet-500 transition cursor-pointer"
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
                      className={`flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:border-violet-500/50 transition ${
                        isOverdue ? "border-red-500/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTaskStatus(t.id, t.status)}
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                            t.status === "In Review"
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-gray-500 hover:border-violet-400"
                          }`}
                        >
                          {t.status === "In Review" && <Icon name="check" size={12} />}
                        </button>
                        <div className="min-w-0">
                          <strong
                            onClick={() => openTaskDetail(t)}
                            className="text-xs text-white truncate block hover:text-violet-300 cursor-pointer"
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

          {/* D. Project Progress */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-white">Project Progress</h3>
              <button
                onClick={() => router.push("/projects")}
                className="text-xs text-violet-400 hover:underline cursor-pointer"
              >
                View all
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="py-8 text-center text-gray-400 space-y-3">
                <p className="text-xs">No projects in this workspace yet.</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 text-xs font-semibold text-white hover:bg-violet-500 transition cursor-pointer"
                >
                  Create project
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 4).map((p) => {
                  const percent =
                    p.taskCount > 0 ? Math.round((p.completedTaskCount / p.taskCount) * 100) : 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/projects?id=${p.id}`)}
                      className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:border-violet-500/50 transition cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-gray-200 truncate">{p.name}</strong>
                        <span className="text-violet-400 font-semibold">{percent}%</span>
                      </div>

                      <div className="w-full bg-[#35383a] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-violet-500 h-full rounded-full transition-all duration-500"
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

        {/* E. My Tasks & F. Upcoming Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* E. My Tasks - Target Smooth Scroll ID: my-tasks */}
          <div id="my-tasks" className="lg:col-span-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg scroll-mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-sm font-semibold text-white">My Tasks</h3>
                <p className="text-xs text-gray-400">Broad overview of all assigned tasks</p>
              </div>

              <div className="flex items-center gap-1 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs">
                {(["All", "In Progress", "Overdue"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMyTasksFilter(filter)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      myTasksFilter === filter
                        ? "bg-violet-600 text-white font-semibold"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
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
                        onClick={() => handleToggleTaskStatus(t.id, t.status)}
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition cursor-pointer ${
                          t.status === "In Review"
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-gray-500 hover:border-violet-400"
                        }`}
                      >
                        {t.status === "In Review" && <Icon name="check" size={10} />}
                      </button>
                      <div className="min-w-0">
                        <strong
                          onClick={() => openTaskDetail(t)}
                          className="text-xs text-white truncate block hover:text-violet-300 cursor-pointer"
                        >
                          {t.title}
                        </strong>
                        <span className="text-[10px] text-gray-400 block truncate">
                          {t.projectName} · {t.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#35383a] text-violet-300">
                        {t.status}
                      </span>
                      <span className={`priority priority-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition cursor-pointer"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* F. Upcoming Schedule */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
              <button
                onClick={() => router.push("/calendar")}
                className="text-xs text-violet-400 hover:underline cursor-pointer"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {tasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTaskDetail(t)}
                  className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] flex items-start gap-3 hover:border-violet-500/50 transition cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-[#35383a] text-violet-400">
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

        {/* G. Recent Activity & H. Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* G. Recent Activity - Target Smooth Scroll ID: recent-activity */}
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
                      <span className="p-1.5 rounded-lg bg-[#35383a] text-violet-400">
                        <Icon name={act.type === "task_completed" ? "check" : "spark"} size={13} />
                      </span>
                      <div className="truncate">
                        <span className="text-white font-medium">{act.title}</span>
                        <span className="text-gray-400 text-[10px] block">
                          {act.type === "task_completed" ? "Marked as completed" : "Task created"} in #{act.project}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{act.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* H. Quick Actions */}
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
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-violet-600/20 hover:border-violet-500/50 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="plus" size={18} />
                Create Task
              </button>

              <button
                onClick={() => {
                  setNewProjectName("");
                  setShowNewProjectModal(true);
                }}
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-violet-600/20 hover:border-violet-500/50 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="folder" size={18} />
                Create Project
              </button>

              <button
                onClick={() => router.push("/calendar")}
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-violet-600/20 hover:border-violet-500/50 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="calendar" size={18} />
                Open Calendar
              </button>

              <button
                onClick={() => router.push("/projects")}
                className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:bg-violet-600/20 hover:border-violet-500/50 text-white font-medium flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center"
              >
                <Icon name="arrowRight" size={18} />
                View All Tasks
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
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as "Low" | "Medium" | "High")
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-white"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => handleDeleteTask(activeTask.id)}
                className="text-xs text-red-400 hover:underline cursor-pointer"
              >
                Delete Task
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2 text-xs text-gray-300 hover:bg-[#35383a] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTaskDetail}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
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
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Target Project</label>
                <select
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                >
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
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-white focus:outline-none focus:border-violet-500"
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
                className="px-4 py-2 rounded-xl bg-violet-600 text-xs text-white font-medium hover:bg-violet-500"
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
                className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
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
                className="px-4 py-2 rounded-xl bg-violet-600 text-xs text-white font-medium hover:bg-violet-500"
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