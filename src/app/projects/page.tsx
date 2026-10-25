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
  getProjectTasksAction,
} from "@/app/actions";

type Status = "To Do" | "In Progress" | "In Review";
type ViewMode = "board" | "list" | "timeline";

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
  };

  const paths: Record<string, React.ReactNode> = {
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
    paperclip: <path d="m8 12.5 6.8-6.8a3 3 0 0 1 4.2 4.2l-8.5 8.5a5 5 0 0 1-7.1-7.1l8.1-8.1" />,
    comment: <path d="M21 11.5a8 8 0 0 1-8.5 8 9 9 0 0 1-4.2-1L3 20l1.7-4.4a7.5 7.5 0 0 1-.7-3.1 8 8 0 0 1 8.5-7.5 8 8 0 0 1 8.5 6.5Z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] || paths.search}</svg>;
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
  const [projectType, setProjectType] = useState<"Team" | "Personal">("Team");

  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("To Do");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState("All priorities");
  const [loadingData, setLoadingData] = useState(true);

  const [showRenameProjectModal, setShowRenameProjectModal] = useState(false);
  const [renameProjectInput, setRenameProjectInput] = useState("");

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
            setProjectType(res.description?.startsWith("[PERSONAL]") ? "Personal" : "Team");

            const formattedTasks: TaskUI[] = res.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description || "",
              status: statusDbToUi(t.status),
              priority: priorityDbToUi(t.priority),
              date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              progress: t.progress,
              comments: t.commentCount,
              files: t.fileCount,
              people: t.people.length > 0 ? t.people : [getInitials(session.user.name)],
            }));
            setTasks(formattedTasks);
          })
          .finally(() => setLoadingData(false));
      } else {
        getInitialWorkspaceData()
          .then((res) => {
            setProjectId(res.project.id);
            setProject(res.project.name);
            setProjectType(res.project.description?.startsWith("[PERSONAL]") ? "Personal" : "Team");

            const formattedTasks: TaskUI[] = res.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description || "",
              status: statusDbToUi(t.status),
              priority: priorityDbToUi(t.priority),
              date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              progress: t.progress,
              comments: t.commentCount,
              files: t.fileCount,
              people: t.people.length > 0 ? t.people : [getInitials(session.user.name)],
            }));
            setTasks(formattedTasks);
          })
          .finally(() => setLoadingData(false));
      }
    }
  }, [isPending, session, router, activeProjectId]);

  const userInitials = useMemo(() => getInitials(session?.user?.name), [session]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          `${t.title} ${t.description}`.toLowerCase().includes(taskSearchQuery.toLowerCase()) &&
          (filterPriority === "All priorities" || t.priority === filterPriority)
      ),
    [tasks, taskSearchQuery, filterPriority]
  );

  async function handleRenameProjectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renameProjectInput.trim() || !projectId) return;

    const trimmed = renameProjectInput.trim();
    setProject(trimmed);
    setShowRenameProjectModal(false);

    try {
      await updateProjectNameAction(projectId, trimmed);
    } catch (error) {
      console.error("Failed to rename project:", error);
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

    setTasks((old) => old.map((t) => (t.id === taskId ? { ...t, ...updatedFields } : t)));
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

  async function handleDeleteTask(taskId: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this task?")) return;

    setTasks((old) => old.filter((t) => t.id !== taskId));
    if (activeTask?.id === taskId) setActiveTask(null);

    try {
      await deleteTaskAction(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
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
        date: new Date(createdTask.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        progress: createdTask.progress,
        comments: createdTask.commentCount,
        files: createdTask.fileCount,
        people: createdTask.people,
      };

      setTasks((old) => [...old, newTaskUI]);
      setNewTitle("");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  }

  async function moveTask(id: string, newStatus: Status, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const dbStatus = statusUiToDb(newStatus);

    setTasks((old) => old.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));

    try {
      await updateTaskStatusAction(id, dbStatus);
    } catch (error) {
      console.error("Failed to move task status:", error);
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
              onClick={() => {
                setRenameProjectInput(project);
                setShowRenameProjectModal(true);
              }}
            >
              ↗
            </button>
          </div>
          <p className="project-subtitle">
            Plan, collaborate, and ship great work together.
          </p>

          <div className="member-line">
            {projectType === "Personal" ? (
              <div className="flex items-center gap-2">
                <Avatar initials={userInitials} index={0} />
                <span className="text-xs text-gray-400 font-medium">Only you (Personal)</span>
              </div>
            ) : (
              <>
                <div
                  className="avatar-stack cursor-pointer hover:opacity-80 transition"
                  onClick={() => setShowMembersModal(true)}
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
              </>
            )}

            <span className="private-label">
              <Icon name="lock" size={13} /> {isPrivate ? "Private" : "Public"}
            </span>
            <span
              className={`toggle-pill cursor-pointer transition ${isPrivate ? "active" : ""}`}
              onClick={() => setIsPrivate(!isPrivate)}
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

          <button
            className="add-task-small cursor-pointer"
            onClick={() => setShowForm(true)}
          >
            <Icon name="plus" size={15} /> Add task
          </button>
        </div>
      </div>

      {loadingData ? (
        <div className="flex h-64 items-center justify-center text-gray-400">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Loading project data...
          </div>
        </div>
      ) : (
        <>
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
                      </div>
                    </div>

                    <div className="task-stack">
                      {list.map((task) => (
                        <article
                          className="task-card cursor-pointer transition hover:border-violet-500/50"
                          key={task.id}
                          onClick={() => openTaskDetail(task)}
                        >
                          <div className="task-meta">
                            <span className={`priority priority-${task.priority.toLowerCase()}`}>
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

                          <div className="task-card-footer">
                            <div className="task-avatars">
                              {task.people.map((person, i) => (
                                <Avatar key={person + i} initials={person} index={i} />
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
                            </div>
                          </div>

                          <div className="card-move">
                            <span>Move to</span>
                            {columns
                              .filter((c) => c !== task.status)
                              .map((c) => (
                                <button key={c} onClick={(e) => moveTask(task.id, c, e)}>
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
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {viewMode === "list" && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 text-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-xs text-gray-400 uppercase">
                    <th className="py-3 px-4">Task Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} onClick={() => openTaskDetail(t)} className="hover:bg-[#35383a]/50 cursor-pointer">
                      <td className="py-3.5 px-4 font-medium">{t.title}</td>
                      <td className="py-3.5 px-4"><span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-[#35383a] text-violet-300">{t.status}</span></td>
                      <td className="py-3.5 px-4"><span className={`priority priority-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                      <td className="py-3.5 px-4 text-xs text-gray-400">{t.date}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button onClick={(e) => handleDeleteTask(t.id, e)} className="p-1.5 text-gray-400 hover:text-red-400"><Icon name="trash" size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "timeline" && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-white space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Project Timeline Roadmap</h3>
              <div className="space-y-3">
                {filteredTasks.map((t, index) => (
                  <div key={t.id} onClick={() => openTaskDetail(t)} className="p-3.5 rounded-xl border border-[var(--line)] bg-[#1e2022] hover:border-violet-500 cursor-pointer">
                    <div className="flex justify-between text-xs mb-1">
                      <strong>{t.title}</strong>
                      <span className="text-gray-400">{t.date}</span>
                    </div>
                    <div className="w-full bg-[#35383a] h-2 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: `${(index + 1) * 20}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Task Details</strong>
              <button onClick={() => setActiveTask(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Priority</label>
                <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as "Low" | "Medium" | "High")} className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-white">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[var(--line)]">
              <button type="button" onClick={() => handleDeleteTask(activeTask.id)} className="text-xs text-red-400 hover:underline">Delete Task</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => setActiveTask(null)} className="px-4 py-2 text-xs text-gray-300">Cancel</button>
                <button type="button" onClick={handleSaveTaskDetail} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRenameProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form onSubmit={handleRenameProjectSubmit} className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-white space-y-4">
            <strong className="text-sm font-semibold">Rename Project</strong>
            <input autoFocus value={renameProjectInput} onChange={(e) => setRenameProjectInput(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2 text-xs text-white" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowRenameProjectModal(false)} className="px-4 py-2 text-xs text-gray-300">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold">Save</button>
            </div>
          </form>
        </div>
      )}

      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-white space-y-4">
            <strong className="text-sm font-semibold">Project Members</strong>
            <div className="space-y-2">
              {teamMembers.map((m, idx) => (
                <div key={m.email} className="flex justify-between items-center p-2 rounded-xl bg-[#1e2022] border border-[var(--line)] text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar initials={m.initials} index={idx} />
                    <span>{m.name}</span>
                  </div>
                  <span className="text-gray-400 text-[10px]">{m.role}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowMembersModal(false)} className="w-full py-2 bg-violet-600 rounded-xl text-xs font-semibold">Close</button>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 text-white space-y-4">
            <strong className="text-sm font-semibold">Project Calendar Schedule</strong>
            <div className="p-3 bg-[#1e2022] rounded-xl border border-[var(--line)] text-xs space-y-1">
              <p>• Hero Section Wireframe - Due Oct 24</p>
              <p>• Dark Mode Color Tokens - Due Oct 28</p>
            </div>
            <button onClick={() => setShowCalendarModal(false)} className="w-full py-2 bg-violet-600 rounded-xl text-xs font-semibold">Close</button>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}