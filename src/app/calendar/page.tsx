"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";

// --- TYPES ---
type ViewMode = "Month" | "Week" | "Day";
type FilterType = "All" | "Tasks" | "Events";

type CalendarItem = {
  id: string;
  type: "task" | "event";
  title: string;
  date: string; // Format: YYYY-MM-DD
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  project?: string;
  status?: "pending" | "completed" | "overdue";
  priority?: "Low" | "Medium" | "High";
  description?: string;
  colorCategory: "lime" | "purple" | "amber" | "red";
};

// --- DATASET DUMMY INITIAL ---
const INITIAL_ITEMS: CalendarItem[] = [
  {
    id: "item-1",
    type: "task",
    title: "Finalize dashboard layout",
    date: "2026-10-27",
    time: "10:00 AM",
    project: "Orbit Workspace",
    status: "completed",
    priority: "High",
    colorCategory: "lime",
    description: "Review component scaling and dynamic sidebar behavior.",
  },
  {
    id: "item-2",
    type: "event",
    title: "Review API integration",
    date: "2026-10-28",
    time: "02:00 PM",
    endTime: "03:00 PM",
    project: "Website Redesign",
    colorCategory: "purple",
    description: "Sync with backend engineering team regarding auth endpoints.",
  },
  {
    id: "item-3",
    type: "task",
    title: "Prepare project documentation",
    date: "2026-10-22",
    time: "04:20 PM",
    project: "Orbit Workspace",
    status: "overdue",
    priority: "Medium",
    colorCategory: "red",
    description: "Overdue task from last week. Needs immediate update.",
  },
  {
    id: "item-4",
    type: "event",
    title: "Design System Token Migration",
    date: "2026-10-29",
    time: "11:00 AM",
    endTime: "12:30 PM",
    project: "Orbit Workspace",
    colorCategory: "amber",
    description: "Align color tokens across Tailwind configuration.",
  },
  {
    id: "item-5",
    type: "task",
    title: "Setup Analytics Pipeline",
    date: "2026-10-30",
    time: "05:00 PM",
    project: "Mobile App Redesign",
    status: "pending",
    priority: "Low",
    colorCategory: "purple",
  },
];

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
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    x: <path d="M18 6 6 18M6 6l12 12" />,
    trash: (
      <>
        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.calendar}</svg>;
}

export default function CalendarPage() {
  const router = useRouter();

  // State Utama Kalender
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 27));
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-10-27");

  // State Items & Modal
  const [items, setItems] = useState<CalendarItem[]>(INITIAL_ITEMS);
  const [activeItem, setActiveItem] = useState<CalendarItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State Event Baru
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("2026-10-27");
  const [newStartTime, setNewStartTime] = useState("10:00 AM");
  const [newEndTime, setNewEndTime] = useState("11:00 AM");
  const [newIsAllDay, setNewIsAllDay] = useState(false);
  const [newProject, setNewProject] = useState("Orbit Workspace");
  const [newDescription, setNewDescription] = useState("");

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date(2026, 9, 27);
    setCurrentDate(today);
    setSelectedDateStr("2026-10-27");
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevDateObj = new Date(year, month - 1, d);
      const dateStr = prevDateObj.toISOString().split("T")[0];
      days.push({ dayNumber: d, isCurrentMonth: false, dateStr });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNumber: d, isCurrentMonth: true, dateStr });
    }

    const remainingSlots = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDateObj = new Date(year, month + 1, d);
      const dateStr = nextDateObj.toISOString().split("T")[0];
      days.push({ dayNumber: d, isCurrentMonth: false, dateStr });
    }

    return days;
  }, [year, month]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType === "Tasks" && item.type !== "task") return false;
      if (filterType === "Events" && item.type !== "event") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchProj = item.project?.toLowerCase().includes(q);
        return matchTitle || matchProj;
      }

      return true;
    });
  }, [items, filterType, searchQuery]);

  const selectedDateAgenda = useMemo(() => {
    return filteredItems.filter((item) => item.date === selectedDateStr);
  }, [filteredItems, selectedDateStr]);

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: CalendarItem = {
      id: `item-${Date.now()}`,
      type: "event",
      title: newTitle.trim(),
      date: newDate,
      time: newIsAllDay ? undefined : newStartTime,
      endTime: newIsAllDay ? undefined : newEndTime,
      isAllDay: newIsAllDay,
      project: newProject,
      colorCategory: "purple",
      description: newDescription.trim(),
    };

    setItems((prev) => [...prev, newItem]);
    setShowCreateModal(false);
    setNewTitle("");
    setNewDescription("");
  };

  const handleToggleTaskStatus = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const nextStatus = item.status === "completed" ? "pending" : "completed";
          return {
            ...item,
            status: nextStatus,
            colorCategory: nextStatus === "completed" ? "lime" : "purple",
          };
        }
        return item;
      })
    );
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <WorkspaceShell>
      <div className="p-5 pb-16 text-white space-y-4 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">Calendar</h1>
              <span className="text-[10px] bg-[#1e2022] text-[#98E499] border border-[var(--line)] px-2 py-0.5 rounded-full font-medium">
                {monthNames[month]} {year}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Plan your time. Stay on track with workspace events and deadlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Navigasi Bulan */}
            <div className="flex items-center bg-[#1e2022] border border-[var(--line)] rounded-xl p-0.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-[#2a2d30] text-gray-300 hover:text-white rounded-lg transition cursor-pointer"
                title="Previous month"
              >
                <Icon name="chevronLeft" size={13} />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-gray-200 hover:text-white transition cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-[#2a2d30] text-gray-300 hover:text-white rounded-lg transition cursor-pointer"
                title="Next month"
              >
                <Icon name="chevronRight" size={13} />
              </button>
            </div>

            {/* Mode Selector (Month, Week, Day) */}
            <div className="flex items-center gap-0.5 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs">
              {(["Month", "Week", "Day"] as const).map((m) => {
                const isActive = viewMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={isActive ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isActive ? "shadow-sm" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Tombol New Event */}
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: "#98E499", color: "#26282a" }}
              className="px-3.5 py-1.5 rounded-xl hover:bg-[#85d886] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Icon name="plus" size={14} />
              <span>New event</span>
            </button>
          </div>
        </div>

        {/* Bar Search & Filter Kategori */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs">
            {(["All", "Tasks", "Events"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterType === cat
                    ? "bg-[#2a2d30] text-white font-semibold border border-[var(--line)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <span className="absolute left-2.5 top-2.5 text-gray-400">
              <Icon name="search" size={13} />
            </span>
            <input
              type="text"
              placeholder="Filter tasks or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
            />
          </div>
        </div>

        {/* Main Calendar View */}
        {viewMode === "Month" && (
          <div className="border border-[var(--line)] rounded-2xl bg-[var(--card)] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[var(--line)] bg-[#1e2022] text-center text-[11px] font-semibold text-gray-400 py-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-[var(--line)]">
              {daysInMonth.map((d, idx) => {
                const isToday = d.dateStr === "2026-10-27";
                const isSelected = d.dateStr === selectedDateStr;
                const dayItems = filteredItems.filter((item) => item.date === d.dateStr);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(d.dateStr)}
                    className={`min-h-[90px] p-2 flex flex-col justify-between transition cursor-pointer ${
                      !d.isCurrentMonth ? "bg-[#18191b]/50 text-gray-600" : "hover:bg-[#242628]"
                    } ${isSelected ? "bg-violet-600/10 border-violet-500" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        style={isToday ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                        className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                          isToday
                            ? "font-bold shadow-sm"
                            : isSelected
                            ? "text-violet-300 bg-violet-500/20 font-semibold"
                            : d.isCurrentMonth
                            ? "text-gray-300"
                            : "text-gray-600"
                        }`}
                      >
                        {d.dayNumber}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="text-[9px] text-gray-500 font-semibold">
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayItems.slice(0, 2).map((item) => {
                        let colorClasses = "bg-violet-500/20 text-violet-300 border-violet-500/30";
                        if (item.colorCategory === "lime")
                          colorClasses = "bg-[#98E499]/20 text-[#98E499] border-[#98E499]/30";
                        if (item.colorCategory === "red")
                          colorClasses = "bg-red-500/20 text-red-300 border-red-500/30";
                        if (item.colorCategory === "amber")
                          colorClasses = "bg-amber-500/20 text-amber-300 border-amber-500/30";

                        return (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveItem(item);
                            }}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 ${colorClasses} hover:opacity-80 transition`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                            <span className="truncate">{item.title}</span>
                          </div>
                        );
                      })}

                      {dayItems.length > 2 && (
                        <span className="text-[9px] text-gray-400 font-semibold pl-1">
                          +{dayItems.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "Week" && (
          <div className="p-8 border border-[var(--line)] rounded-2xl bg-[var(--card)] text-center space-y-3">
            <h3 className="text-sm font-semibold text-white">Week View (Oct 25 – Oct 31, 2026)</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Detailed time slots for the current week. Select an agenda item below or switch to Month View.
            </p>
            <div className="grid grid-cols-7 gap-2 pt-4">
              {["Sun 25", "Mon 26", "Tue 27", "Wed 28", "Thu 29", "Fri 30", "Sat 31"].map((dayLabel, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] text-xs space-y-2">
                  <strong className="block text-gray-300">{dayLabel}</strong>
                  <div className="text-[10px] text-gray-500">
                    {filteredItems.filter((i) => i.date.endsWith(String(25 + idx))).length} events
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "Day" && (
          <div className="p-6 border border-[var(--line)] rounded-2xl bg-[var(--card)] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-white">Day View ({selectedDateStr})</h3>
              <span className="text-xs text-[#98E499] font-semibold">Today's Focus</span>
            </div>
            <div className="space-y-2">
              {selectedDateAgenda.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No schedule recorded for this specific date.</p>
              ) : (
                selectedDateAgenda.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveItem(item)}
                    className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] flex items-center justify-between cursor-pointer hover:border-violet-500/40"
                  >
                    <div>
                      <strong className="block text-xs text-white">{item.title}</strong>
                      <span className="text-[10px] text-gray-400">
                        {item.time || "All day"} · #{item.project}
                      </span>
                    </div>
                    <span className="text-xs text-violet-300 font-semibold">Details →</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Agenda Panel */}
        <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Agenda for {selectedDateStr}
              </h2>
              <span className="text-[10px] bg-[#1e2022] text-gray-300 px-2 py-0.5 rounded-full border border-[var(--line)]">
                {selectedDateAgenda.length} items
              </span>
            </div>

            <button
              onClick={() => setSelectedDateStr("2026-10-27")}
              className="text-xs text-violet-300 hover:underline cursor-pointer"
            >
              Reset to Today
            </button>
          </div>

          {selectedDateAgenda.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">
              No events or task deadlines scheduled for this date.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateAgenda.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] hover:border-violet-500/40 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {item.type === "task" ? (
                      <button
                        onClick={(e) => handleToggleTaskStatus(item.id, e)}
                        style={item.status === "completed" ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition cursor-pointer ${
                          item.status === "completed"
                            ? "border-[#98E499]"
                            : "border-gray-500 hover:border-[#98E499]"
                        }`}
                      >
                        {item.status === "completed" && <Icon name="check" size={10} />}
                      </button>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    )}

                    <div>
                      <span
                        className={`text-xs font-semibold block ${
                          item.status === "completed" ? "line-through text-gray-500" : "text-white"
                        }`}
                      >
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span>{item.time || "All day"}</span>
                        <span>·</span>
                        <span className="text-violet-300 font-medium">#{item.project}</span>
                        {item.status === "overdue" && (
                          <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.2 rounded">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400 hover:text-white transition">Details →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Create Event */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <form
              onSubmit={handleCreateEventSubmit}
              className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <strong className="text-xs font-semibold text-white">Create New Event</strong>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Event Title *</label>
                  <input
                    required
                    autoFocus
                    placeholder="e.g. Sprint Planning Session"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Date *</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#98E499]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Related Project</label>
                    <select
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                    >
                      <option value="Orbit Workspace">Orbit Workspace</option>
                      <option value="Website Redesign">Website Redesign</option>
                      <option value="Mobile App Redesign">Mobile App Redesign</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="allDay"
                    checked={newIsAllDay}
                    onChange={(e) => setNewIsAllDay(e.target.checked)}
                    className="rounded border-gray-600 accent-[#98E499] cursor-pointer"
                  />
                  <label htmlFor="allDay" className="text-xs text-gray-300 cursor-pointer">
                    All-day event
                  </label>
                </div>

                {!newIsAllDay && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">Start Time</label>
                      <input
                        type="text"
                        placeholder="10:00 AM"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#98E499]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">End Time</label>
                      <input
                        type="text"
                        placeholder="11:00 AM"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#98E499]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Optional notes or meeting link..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "#98E499", color: "#26282a" }}
                  className="px-4 py-1.5 rounded-xl hover:bg-[#85d886] font-bold text-xs transition cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Detail Item */}
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  {activeItem.type === "task" ? "Task Deadline Detail" : "Event Detail"}
                </span>
                <button
                  onClick={() => setActiveItem(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] space-y-2">
                  <strong className="block text-sm text-white font-semibold">{activeItem.title}</strong>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Date</span>
                    <span className="text-gray-200 font-medium">{activeItem.date}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Time</span>
                    <span className="text-gray-200">{activeItem.time || "All day"}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Project</span>
                    <span className="text-violet-300 font-semibold">#{activeItem.project}</span>
                  </div>
                </div>

                {activeItem.description && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-400 font-medium">Description:</span>
                    <p className="p-2.5 rounded-xl bg-[#1e2022]/60 border border-[var(--line)] text-xs text-gray-300 leading-relaxed">
                      {activeItem.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--line)]">
                <button
                  onClick={() => setActiveItem(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    setActiveItem(null);
                    if (activeItem.type === "task") {
                      router.push("/overview");
                    } else {
                      router.push("/projects");
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Open Context
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}