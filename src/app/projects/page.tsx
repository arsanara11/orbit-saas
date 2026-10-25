"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { authClient } from "@/lib/auth-client";
import {
  getInitialWorkspaceData,
  createTaskAction,
  updateTaskStatusAction,
  updateProjectNameAction,
  deleteTaskAction,
  updateTaskAction,
  createProjectAction,
  getProjectTasksAction,
} from "@/app/actions";

type Status = "To Do" | "In Progress" | "In Review";
type ViewMode = "board" | "list" | "timeline";

type ProjectType = {
  id: string;
  name: string;
  taskCount: number;
};

type TaskUI = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: "Low" | "Medium" | "High";
  date: string;
  progress: number;
  comments: number;
  files: number;
  people: string[];
};

const columns: Status[] = ["To Do", "In Progress", "In Review"];

const teamMembers = [
  { name: "Anisa Nabila", role: "Project Lead", initials: "AN", email: "anisa@orbit.app" },
  { name: "Ahmad Rizky", role: "Frontend Developer", initials: "AR", email: "rizky@orbit.app" },
  { name: "M. Kenzie", role: "UI/UX Designer", initials: "MK", email: "kenzie@orbit.app" },
  { name: "Jasmine L.", role: "Backend Developer", initials: "JL", email: "jasmine@orbit.app" },
];

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
    "aria-hidden": true as const,
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
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    filter: (
      <>
        <path d="M4 5h16M7 12h10m-7 7h4" />
        <circle cx="8" cy="5" r="1.5" fill="currentColor" />
        <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      </>
    ),
    paperclip: (
      <path d="m8 12.5 6.8-6.8a3 3 0 0 1 4.2 4.2l-8.5 8.5a5 5 0 0 1-7.1-7.1l8.1-8.1" />
    ),
    comment: (
      <path d="M21 11.5a8 8 0 0 1-8.5 8 9 9 0 0 1-4.2-1L3 20l1.7-4.4a7.5 7.5 0 0 1-.7-3.1 8 8 0 0 1 8.5-7.5 8 8 0 0 1 8.5 6.5Z" />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    moon: <path d="M20.5 15A8.5 8.5 0 0 1 9 3.5 8.5 8.5 0 1 0 20.5 15Z" />,
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    spark: <path d="m12 2 1.7 7.3L21 12l-7.3 1.7L12 21l-1.7-7.3L3 12l7.3-2.7Z" />,
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
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

export default function ProjectsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProjectId = searchParams.get("id");

  const [tasks, setTasks] = useState<TaskUI[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState("Orbit Workspace");

  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("To Do");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState("All priorities");
  const [loadingData, setLoadingData] = useState(true);
  const [switchingProject, setSwitchingProject] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [isPrivate, setIsPrivate] = useState(true);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [activeTask, setActiveTask] = useState<TaskUI | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      setLoadingData(true);
      if (activeProjectId) {
        getProjectTasksAction(activeProjectId)
          .then((res) => {
            setProjectId(res.id);
            setProject(res.name);

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
              progress: t.progress,
              comments: t.commentCount,
              files: t.fileCount,
              people: t.people.length > 0 ? t.people : [getInitials(session.user.name)],
            }));
            setTasks(formattedTasks);
          })
          .catch((err) => console.error("Gagal mengambil data project:", err))
          .finally(() => setLoadingData(false));
      } else {
        getInitialWorkspaceData()
          .then((res) => {
            setProject(res.project.name);
            setProjectId(res.project.id);

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
              progress: t.progress,
              comments: t.commentCount,
              files: t.fileCount,
              people: t.people.length > 0 ? t.people : [getInitials(session.user.name)],
            }));

            setTasks(formattedTasks);
          })
          .catch((err) => console.error("Gagal mengambil data workspace:", err))
          .finally(() => setLoadingData(false));
      }
    }
  }, [isPending, session, router, activeProjectId]);

  const userInitials = useMemo(() => getInitials(session?.user?.name), [session]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          `${t.title} ${t.description}`
            .toLowerCase()
            .includes(taskSearchQuery.toLowerCase()) &&
          (filterPriority === "All priorities" || t.priority === filterPriority)
      ),
    [tasks, taskSearchQuery, filterPriority]
  );

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
      console.error("Gagal menyimpan detail task:", error);
    }
  }

  async function handleDeleteTask(taskId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();

    if (!confirm("Apakah Anda yakin ingin menghapus task ini?")) return;

    setTasks((old) => old.filter((t) => t.id !== taskId));
    if (activeTask?.id === taskId) setActiveTask(null);

    try {
      await deleteTaskAction(taskId);
    } catch (error) {
      console.error("Gagal menghapus task:", error);
    }
  }

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newTitle.trim() || !projectId) return;

    const dbStatus = statusUiToDb(newStatus);

    try {
      const createdTask = await createTaskAction({
        title: newTitle.trim(),
        projectId: projectId,
        status: dbStatus,
        priority: "MEDIUM",
      });

      const newTaskUI: TaskUI = {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description || "",
        status: statusDbToUi(createdTask.status),
        priority: priorityDbToUi(createdTask.priority),
        date: new Date(createdTask.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        progress: createdTask.progress,
        comments: createdTask.commentCount,
        files: createdTask.fileCount,
        people: createdTask.people,
      };

      setTasks((old) => [...old, newTaskUI]);
      setNewTitle("");
      setShowForm(false);
    } catch (error) {
      console.error("Gagal menambah task:", error);
    }
  }

  async function moveTask(id: string, newStatus: Status, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const dbStatus = statusUiToDb(newStatus);

    setTasks((old) =>
      old.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTaskStatusAction(id, dbStatus);
    } catch (error) {
      console.error("Gagal mengubah status task:", error);
    }
  }

  async function handleRenameProject() {
    const name = window.prompt("Project name", project);
    if (name?.trim() && name.trim() !== project && projectId) {
      const trimmedName = name.trim();
      setProject(trimmedName);
      try {
        await updateProjectNameAction(projectId, trimmedName);
      } catch (error) {
        console.error("Gagal mengubah nama project:", error);
      }
    }
  }

  return (
    <WorkspaceShell>
      <div className="project-heading">
        <div>
          <div className="project-title-line">
            <h1>{project}</h1>
            <button
              className="edit-title cursor-pointer hover:text-violet-400 transition"
              title="Rename project"
              onClick={handleRenameProject}
            >
              ↗
            </button>
          </div>
          <p className="project-subtitle">
            Plan, collaborate, and ship great work together.
          </p>

          <div className="member-line">
            <div
              className="avatar-stack cursor-pointer hover:opacity-80 transition"
              onClick={() => setShowMembersModal(true)}
              title="View project members"
            >
              <Avatar initials={userInitials} index={0} />
              <Avatar initials="AR" index={1} />
              <Avatar initials="MK" index={2} />
              <Avatar initials="JL" index={3} />
            </div>
            <span
              className="more-members cursor-pointer hover:text-white transition"
              onClick={() => setShowMembersModal(true)}
            >
              +{teamMembers.length}
            </span>

            <span className="private-label">
              <Icon name="lock" size={13} /> {isPrivate ? "Private" : "Public"}
            </span>
            <span
              className={`toggle-pill cursor-pointer transition ${isPrivate ? "active" : ""}`}
              onClick={() => setIsPrivate(!isPrivate)}
              title={`Click to switch to ${isPrivate ? "Public" : "Private"}`}
            >
              <i />
            </span>
          </div>
        </div>

        <div className="heading-actions">
          <button
            className="square-button hover:bg-[#35383a] transition cursor-pointer"
            title="View Calendar"
            onClick={() => setShowCalendarModal(true)}
          >
            <Icon name="calendar" />
          </button>

          <div className="relative">
            <button
              className="view-select hover:bg-[#35383a] transition flex items-center gap-1 capitalize cursor-pointer"
              onClick={() => setShowViewDropdown(!showViewDropdown)}
            >
              {viewMode} view <Icon name="chevron" size={14} />
            </button>

            {showViewDropdown && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowViewDropdown(false)} />
                <div className="absolute right-0 top-11 z-30 w-36 rounded-xl border border-[var(--line)] bg-[var(--card)] p-1.5 shadow-xl text-xs text-white">
                  {(["board", "list", "timeline"] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setViewMode(mode);
                        setShowViewDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg capitalize transition cursor-pointer ${
                        viewMode === mode ? "bg-violet-600 font-semibold" : "hover:bg-[#35383a]"
                      }`}
                    >
                      {mode} view
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            className="square-button hover:bg-[#35383a] transition cursor-pointer"
            title="Filter tasks"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" />
          </button>
          <button
            className="invite-button invite-desktop cursor-pointer"
            onClick={() => setShowForm(true)}
          >
            <Icon name="plus" size={15} /> Add task
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filter-row">
          <span>Filter by priority</span>
          {["All priorities", "High", "Medium", "Low"].map((f) => (
            <button
              key={f}
              className={filterPriority === f ? "filter-selected" : ""}
              onClick={() => setFilterPriority(f)}
            >
              {f}
            </button>
          ))}
          <button
            className="filter-clear"
            onClick={() => {
              setFilterPriority("All priorities");
              setTaskSearchQuery("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}

      {showForm && (
        <form className="task-form" onSubmit={addTask}>
          <div className="form-heading">
            <strong>Create a task</strong>
            <span>Quickly add a task to your board</span>
          </div>
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title..."
            required
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as Status)}
          >
            {columns.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="primary-button">
            Create task
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <div className="board-toolbar">
        <div className="board-tabs">
          <button
            className={viewMode === "board" ? "board-tab-active" : ""}
            onClick={() => setViewMode("board")}
          >
            Board view
          </button>
          <button
            className={viewMode === "list" ? "board-tab-active" : ""}
            onClick={() => setViewMode("list")}
          >
            List view
          </button>
          <button
            className={viewMode === "timeline" ? "board-tab-active" : ""}
            onClick={() => setViewMode("timeline")}
          >
            Timeline
          </button>
        </div>

        <div className="board-tools">
          <label className="board-search">
            <Icon name="search" size={15} />
            <input
              placeholder="Search tasks"
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
            />
          </label>
          <div
            className="board-avatars cursor-pointer hover:opacity-80 transition"
            onClick={() => setShowMembersModal(true)}
          >
            <Avatar initials={userInitials} />
            <Avatar initials="AR" index={1} />
            <Avatar initials="MK" index={2} />
            <span>+2</span>
          </div>
          <button
            className="add-task-small cursor-pointer"
            onClick={() => setShowForm(true)}
          >
            <Icon name="plus" size={15} /> Add task
          </button>
        </div>
      </div>

      {switchingProject || loadingData ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Loading project data...
          </div>
        </div>
      ) : (
        <>
          {/* TAMPILAN 1: KANBAN BOARD VIEW */}
          {viewMode === "board" && (
            <div className="kanban-board">
              {columns.map((column, ci) => {
                const list = filteredTasks.filter((t) => t.status === column);
                return (
                  <section className="kanban-column" key={column}>
                    <div className="column-heading">
                      <div className="column-name">
                        <span className={`column-indicator indicator-${ci}`} />
                        <h2>{column}</h2>
                        <span className="column-count">{list.length}</span>
                      </div>
                      <div className="column-controls">
                        <button
                          title="Add task"
                          onClick={() => {
                            setNewStatus(column);
                            setShowForm(true);
                          }}
                        >
                          <Icon name="plus" size={17} />
                        </button>
                        <button title="Column options">
                          <Icon name="more" size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="task-stack">
                      {list.map((task, ti) => (
                        <article
                          className={`task-card cursor-pointer transition hover:border-violet-500/50 ${
                            ti === 0 && ci !== 1 ? "task-card-feature" : ""
                          }`}
                          key={task.id}
                          onClick={() => openTaskDetail(task)}
                        >
                          {task.title === "New task" && (
                            <div className="task-illustration">
                              <div className="illustration-window">
                                <div className="window-dots">
                                  <i />
                                  <i />
                                  <i />
                                </div>
                                <div className="wire-card wire-a" />
                                <div className="wire-card wire-b" />
                                <div className="wire-card wire-c" />
                                <div className="wire-lines">
                                  <i />
                                  <i />
                                  <i />
                                </div>
                                <div className="wire-button">
                                  <Icon name="plus" size={13} />
                                </div>
                              </div>
                              <span className="art-cursor">↖</span>
                            </div>
                          )}

                          {task.title === "Business model canvas of product" && (
                            <div className="canvas-art">
                              <div className="canvas-diamond diamond-one" />
                              <div className="canvas-diamond diamond-two" />
                              <div className="canvas-node node-one">◎</div>
                              <div className="canvas-node node-two">✤</div>
                              <div className="canvas-node node-three">♟</div>
                              <div className="canvas-node node-four">▤</div>
                              <div className="canvas-connect connect-one" />
                              <div className="canvas-connect connect-two" />
                              <div className="canvas-connect connect-three" />
                            </div>
                          )}

                          <div className="task-meta">
                            <span
                              className={`priority priority-${task.priority.toLowerCase()}`}
                            >
                              {task.priority}
                            </span>
                            <span className="date-chip">
                              <Icon name="calendar" size={12} />
                              {task.date}
                            </span>
                            <button
                              className="card-more hover:text-red-400"
                              title="Delete task"
                              onClick={(e) => handleDeleteTask(task.id, e)}
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </div>

                          <h3>{task.title}</h3>
                          <p className="task-description">{task.description}</p>

                          {task.progress > 0 && (
                            <div className="progress-wrap">
                              <div
                                className={`progress-track progress-${task.priority.toLowerCase()}`}
                              >
                                <i style={{ width: `${task.progress}%` }} />
                              </div>
                              <span>{task.progress}%</span>
                            </div>
                          )}

                          <div className="task-card-footer">
                            <div className="task-avatars">
                              {task.people.map((person, i) => (
                                <Avatar
                                  key={person + i}
                                  initials={person}
                                  index={i}
                                />
                              ))}
                            </div>
                            <div className="task-stats">
                              <span>
                                <Icon name="paperclip" size={13} />
                                {task.files}
                              </span>
                              <span>
                                <Icon name="comment" size={13} />
                                {task.comments}
                              </span>
                              <button
                                title="Mark complete"
                                onClick={(e) =>
                                  moveTask(
                                    task.id,
                                    task.status === "In Review"
                                      ? "To Do"
                                      : "In Review",
                                    e
                                  )
                                }
                              >
                                <Icon name="check" size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="card-move">
                            <span>Move to</span>
                            {columns
                              .filter((c) => c !== task.status)
                              .map((c) => (
                                <button
                                  key={c}
                                  onClick={(e) => moveTask(task.id, c, e)}
                                >
                                  {c}
                                </button>
                              ))}
                          </div>
                        </article>
                      ))}

                      {list.length === 0 && (
                        <div className="empty-column">
                          No tasks here yet.
                          <button
                            onClick={() => {
                              setNewStatus(column);
                              setShowForm(true);
                            }}
                          >
                            <Icon name="plus" size={14} /> Add a task
                          </button>
                        </div>
                      )}

                      <button
                        className="column-add"
                        onClick={() => {
                          setNewStatus(column);
                          setShowForm(true);
                        }}
                      >
                        <Icon name="plus" size={16} /> Add task
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* TAMPILAN 2: LIST VIEW TABEL */}
          {viewMode === "list" && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 text-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-xs text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Task Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {filteredTasks.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => openTaskDetail(t)}
                        className="cursor-pointer hover:bg-[#35383a]/50 transition"
                      >
                        <td className="py-3.5 px-4 font-medium">{t.title}</td>
                        <td className="py-3.5 px-4">
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-[#35383a] text-violet-300">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`priority priority-${t.priority.toLowerCase()}`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-400">{t.date}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex -space-x-1">
                            {t.people.map((p, i) => (
                              <Avatar key={p + i} initials={p} index={i} />
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => handleDeleteTask(t.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">
                          No tasks match your search or filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAMPILAN 3: TIMELINE VIEW */}
          {viewMode === "timeline" && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-white space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
                <h3 className="text-sm font-semibold text-gray-300">Project Timeline Roadmap</h3>
                <span className="text-xs text-gray-400">2026 Schedule</span>
              </div>
              <div className="space-y-4">
                {filteredTasks.map((t, index) => (
                  <div
                    key={t.id}
                    onClick={() => openTaskDetail(t)}
                    className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:border-violet-500/50 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-sm">{t.title}</strong>
                      <span className="text-xs text-gray-400">{t.date}</span>
                    </div>
                    <div className="w-full bg-[#35383a] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${t.progress || (index + 1) * 20}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Popup Detail Task */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Task Details
              </span>
              <button
                onClick={() => setActiveTask(null)}
                className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(e.target.value as "Low" | "Medium" | "High")
                  }
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => handleDeleteTask(activeTask.id)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium transition cursor-pointer"
              >
                <Icon name="trash" size={14} /> Delete Task
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#35383a] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTaskDetail}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-xs text-white font-medium hover:bg-violet-500 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup Team Members */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Project Members</strong>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {teamMembers.map((m, idx) => (
                <div
                  key={m.email}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e2022] border border-[var(--line)]"
                >
                  <div className="flex items-center gap-3">
                    <Avatar initials={m.initials} index={idx} />
                    <div>
                      <strong className="block text-xs font-semibold">{m.name}</strong>
                      <span className="text-[10px] text-gray-400">{m.email}</span>
                    </div>
                  </div>
                  <span className="text-[10px] rounded-md bg-[#35383a] px-2 py-1 text-violet-300">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowMembersModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-violet-600 text-xs text-white font-semibold hover:bg-violet-500 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal Popup Calendar View */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Project Calendar Schedule</strong>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-300 space-y-3">
              <div className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)]">
                <span className="font-semibold text-violet-400 block mb-1">Today's Deadlines</span>
                <p>• Planning meeting for dashboard (In Progress)</p>
                <p>• Business model canvas review (In Review)</p>
              </div>
              <p className="text-center text-gray-400 text-[11px] pt-2">
                Calendar integration active with PostgreSQL date stamps.
              </p>
            </div>
            <button
              onClick={() => setShowCalendarModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-violet-600 text-xs text-white font-semibold hover:bg-violet-500 transition cursor-pointer"
            >
              Close Calendar
            </button>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}