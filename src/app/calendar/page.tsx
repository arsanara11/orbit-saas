"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { authClient } from "@/lib/auth-client";
import { useWorkspace, CalendarItem } from "@/context/WorkspaceContext";
import { getInitialWorkspaceData, createTaskAction } from "@/app/actions";

type ViewMode = "month" | "week" | "day";

type ProjectUI = {
  id: string;
  name: string;
};

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
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        <path d="M3 10h18" />
      </>
    ),
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    spark: <path d="m12 2 1.7 7.3L21 12l-7.3 1.7L12 21l-1.7-7.3L3 12l7.3-2.7Z" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] || paths.calendar}</svg>;
}

export default function CalendarPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { calendarItems, addCalendarItem, toggleTaskStatus, logActivity } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectUI[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("all");

  const [selectedDateStr, setSelectedDateStr] = useState<string>("");
  const [activeItem, setActiveItem] = useState<CalendarItem | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High">("Medium");

  useEffect(() => {
    setSelectedDateStr(new Date().toISOString().split("T")[0]);
    setNewDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session) {
      setLoading(true);
      getInitialWorkspaceData()
        .then((res) => {
          if (res?.workspace?.projects) {
            setProjects(
              res.workspace.projects.map((p) => ({
                id: p.id,
                name: p.name,
              }))
            );
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isPending, session, router]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredItems = useMemo(() => {
    if (selectedProjectFilter === "all") return calendarItems;
    return calendarItems.filter((item) => item.project === selectedProjectFilter);
  }, [calendarItems, selectedProjectFilter]);

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    filteredItems.forEach((item) => {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    return map;
  }, [filteredItems]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthGridDays = useMemo(() => {
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        dateStr: "",
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const formattedDay = String(d).padStart(2, "0");
      const formattedMonth = String(month + 1).padStart(2, "0");
      const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
      days.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
      });
    }

    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateStr: "",
      });
    }

    return days;
  }, [year, month, firstDayOfWeek, daysInMonth]);

  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)));
    } else {
      setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)));
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split("T")[0]);
  };

  const selectedDayItems = useMemo(() => {
    return itemsByDate[selectedDateStr] || [];
  }, [itemsByDate, selectedDateStr]);

  async function handleCreateEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetProj = projects.find((p) => p.id === newProjectId);

    try {
      if (newProjectId) {
        await createTaskAction({
          title: newTitle.trim(),
          projectId: newProjectId,
          status: "TODO",
          priority: priorityUiToDb(newPriority),
        });
      }
    } catch (err) {
      console.warn("Gagal simpan ke DB, tetep simpan di lokal:", err);
    }

    addCalendarItem({
      type: "task",
      title: newTitle.trim(),
      date: newDate || new Date().toISOString().split("T")[0],
      project: targetProj?.name || "Orbit Workspace",
      priority: newPriority,
      status: "pending",
      colorCategory: "lime",
    });

    logActivity("created calendar task", newTitle.trim(), targetProj?.name || "Orbit Workspace");

    setShowAddModal(false);
    setNewTitle("");
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <div className="p-6 space-y-6 text-white animate-pulse">
          <div className="h-20 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
          <div className="h-96 bg-[#1e2022] rounded-2xl border border-[var(--line)]" />
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="p-6 text-white space-y-6">
        {/* Top Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[#98E499]/10 text-[#98E499] border border-[#98E499]/20">
              <Icon name="calendar" size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {monthNames[month]} {year}
              </h1>
              <p className="text-xs text-gray-400">
                Workspace schedule & deadline management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs">
              {(["month", "week", "day"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={viewMode === mode ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition cursor-pointer ${
                    viewMode === mode ? "shadow-sm" : "text-gray-400 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Project Filter */}
            <div className="flex items-center gap-1.5 bg-[#1e2022] px-3 py-1.5 rounded-xl border border-[var(--line)] text-xs">
              <span className="text-gray-400"><Icon name="filter" size={13} /></span>
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#1e2022]">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.name} className="bg-[#1e2022]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Nav controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-[#242628] hover:bg-[#2c2f32] border border-[var(--line)] text-xs font-semibold text-gray-300 transition cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-xl bg-[#242628] hover:bg-[#2c2f32] border border-[var(--line)] text-xs text-gray-300 transition cursor-pointer"
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded-xl bg-[#242628] hover:bg-[#2c2f32] border border-[var(--line)] text-xs text-gray-300 transition cursor-pointer"
              >
                <Icon name="chevronRight" size={16} />
              </button>
            </div>

            {/* New Task/Event button */}
            <button
              onClick={() => {
                setNewTitle("");
                setShowAddModal(true);
              }}
              style={{ backgroundColor: "#98E499", color: "#26282a" }}
              className="h-8.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_10px_rgba(152,228,153,0.25)] hover:bg-[#85d886] transition cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid View (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-lg space-y-3 overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 pb-3 border-b border-[var(--line)] min-w-[650px]">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2 min-w-[650px]">
              {monthGridDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`off-${idx}`}
                      className="h-28 p-2 rounded-xl border border-dashed border-[var(--line)]/40 bg-[#18191b]/20 opacity-30 select-none"
                    >
                      <span className="text-xs text-gray-500 font-medium">{cell.day}</span>
                    </div>
                  );
                }

                const dayItems = itemsByDate[cell.dateStr] || [];
                const isToday = new Date().toISOString().split("T")[0] === cell.dateStr;
                const isSelected = selectedDateStr === cell.dateStr;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`h-28 p-2 rounded-xl border flex flex-col justify-between transition cursor-pointer group ${
                      isSelected
                        ? "border-[#98E499] bg-[#98E499]/10 shadow-sm"
                        : isToday
                        ? "border-[#98E499]/60 bg-[#98E499]/5"
                        : "border-[var(--line)] bg-[#1e2022] hover:border-gray-500"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? "bg-[#98E499] text-[#26282a]"
                            : isSelected
                            ? "text-[#98E499]"
                            : "text-gray-300"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[10px] font-semibold text-[#98E499] bg-[#98E499]/10 px-1.5 py-0.5 rounded-md">
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 mt-1">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItem(item);
                          }}
                          className={`p-1.5 rounded-lg border text-[10px] truncate transition ${
                            item.status === "completed"
                              ? "bg-[#18191b] border-gray-700 text-gray-400 line-through"
                              : "bg-[#242628] border-[var(--line)] text-white hover:border-[#98E499]/60"
                          }`}
                        >
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                              item.priority === "High"
                                ? "bg-red-400"
                                : item.priority === "Medium"
                                ? "bg-amber-400"
                                : "bg-[#98E499]"
                            }`}
                          />
                          {item.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Schedule Focus (1 Col) */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Agenda</h3>
                <p className="text-xs text-gray-400">{selectedDateStr || "Select date"}</p>
              </div>
              <button
                onClick={() => {
                  setNewDate(selectedDateStr);
                  setNewTitle("");
                  setShowAddModal(true);
                }}
                className="p-1.5 rounded-lg bg-[#242628] hover:bg-[#2c2f32] text-xs text-[#98E499] border border-[var(--line)] cursor-pointer"
                title="Add to selected date"
              >
                <Icon name="plus" size={14} />
              </button>
            </div>

            {selectedDayItems.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1e2022] flex items-center justify-center mx-auto text-gray-400">
                  <Icon name="calendar" size={18} />
                </div>
                <p className="text-xs">No tasks or events scheduled for this day.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-[var(--line)] bg-[#1e2022] space-y-2 hover:border-[#98E499]/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => toggleTaskStatus(item.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer shrink-0 ${
                            item.status === "completed"
                              ? "bg-[#98E499] border-[#98E499] text-[#26282a]"
                              : "border-gray-500 hover:border-[#98E499]"
                          }`}
                        >
                          {item.status === "completed" && <Icon name="check" size={10} />}
                        </button>
                        <strong
                          className={`text-xs block truncate ${
                            item.status === "completed"
                              ? "line-through text-gray-500"
                              : "text-white"
                          }`}
                        >
                          {item.title}
                        </strong>
                      </div>
                      <span className={`priority priority-${item.priority?.toLowerCase() || "medium"}`}>
                        {item.priority || "Medium"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[var(--line)]">
                      <span>#{item.project}</span>
                      <span className="text-[#98E499] font-medium">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal New Event/Task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form
            onSubmit={handleCreateEventSubmit}
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <strong className="text-sm font-semibold">Schedule New Event / Task</strong>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Title</label>
                <input
                  required
                  autoFocus
                  placeholder="e.g. Client Sync & Design Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#98E499]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#98E499]"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Project</label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
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
                  value={newPriority}
                  onChange={(e) =>
                    setNewPriority(e.target.value as "Low" | "Medium" | "High")
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
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ backgroundColor: "#98E499", color: "#26282a" }}
                className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#85d886]"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Item Detail Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <span className="text-[10px] uppercase font-bold text-[#98E499]">
                #{activeItem.project}
              </span>
              <button
                onClick={() => setActiveItem(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">{activeItem.title}</h3>
              <p className="text-xs text-gray-400">
                Scheduled for: <b className="text-white">{activeItem.date}</b>
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className={`priority priority-${activeItem.priority?.toLowerCase() || "medium"}`}>
                  {activeItem.priority || "Medium"}
                </span>
                <span className="text-xs text-gray-400">• {activeItem.status}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--line)]">
              <button
                onClick={() => setActiveItem(null)}
                className="px-4 py-1.5 rounded-xl bg-[#242628] hover:bg-[#2c2f32] text-xs font-semibold text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </WorkspaceShell>
  );
}