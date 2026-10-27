"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";
import { useWorkspace, CalendarItem } from "@/context/WorkspaceContext";

type ViewMode = "Month" | "Week" | "Day";
type FilterType = "All" | "Tasks" | "Events";

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
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
  };

  return <svg {...common}>{paths[name] || paths.check}</svg>;
}

export default function CalendarPage() {
  const router = useRouter();
  const { calendarItems, addCalendarItem, toggleTaskStatus } = useWorkspace();

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 27));
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [filterType, setFilterType] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-10-27");

  const [activeItem, setActiveItem] = useState<CalendarItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    return calendarItems.filter((item) => {
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
  }, [calendarItems, filterType, searchQuery]);

  const selectedDateAgenda = useMemo(() => {
    return filteredItems.filter((item) => item.date === selectedDateStr);
  }, [filteredItems, selectedDateStr]);

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addCalendarItem({
      type: "event",
      title: newTitle.trim(),
      date: newDate,
      time: newIsAllDay ? undefined : newStartTime,
      endTime: newIsAllDay ? undefined : newEndTime,
      isAllDay: newIsAllDay,
      project: newProject,
      colorCategory: "purple",
      description: newDescription.trim(),
    });

    setShowCreateModal(false);
    setNewTitle("");
    setNewDescription("");
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <WorkspaceShell>
      <div className="p-5 pb-16 text-white space-y-4 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-bold tracking-tight text-white">Calendar</h1>
              <span className="text-[10px] bg-[#1e2022] text-[#98E499] border border-[var(--line)] px-2 py-0.5 rounded-full font-medium">
                {monthNames[month]} {year}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Plan your time. Stay on track with workspace events and deadlines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#1e2022] border border-[var(--line)] rounded-xl p-0.5">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-[#2a2d30] text-gray-300 rounded-lg">
                <Icon name="chevronLeft" size={13} />
              </button>
              <button onClick={handleToday} className="px-2.5 py-1 text-xs font-semibold text-gray-200">
                Today
              </button>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-[#2a2d30] text-gray-300 rounded-lg">
                <Icon name="chevronRight" size={13} />
              </button>
            </div>

            <div className="flex items-center gap-0.5 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs">
              {(["Month", "Week", "Day"] as const).map((m) => {
                const isActive = viewMode === m;
                return (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    style={isActive ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${isActive ? "shadow-sm" : "text-gray-400 hover:text-white"}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{ backgroundColor: "#98E499", color: "#26282a" }}
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>New event</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs">
            {(["All", "Tasks", "Events"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterType(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
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
              className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

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
                    className={`min-h-[90px] p-2 flex flex-col justify-between cursor-pointer ${
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
                        <span className="text-[9px] text-gray-500 font-semibold">{dayItems.length}</span>
                      )}
                    </div>

                    <div className="space-y-1 my-1 overflow-hidden">
                      {dayItems.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItem(item);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1 bg-[#98E499]/20 text-[#98E499] border-[#98E499]/30"
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Agenda for {selectedDateStr}
            </h2>
            <button onClick={() => setSelectedDateStr("2026-10-27")} className="text-xs text-violet-300 hover:underline">
              Reset to Today
            </button>
          </div>

          {selectedDateAgenda.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500">No events or tasks scheduled for this date.</div>
          ) : (
            <div className="space-y-2">
              {selectedDateAgenda.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {item.type === "task" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(item.id);
                        }}
                        style={item.status === "completed" ? { backgroundColor: "#98E499", color: "#26282a" } : {}}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          item.status === "completed" ? "border-[#98E499]" : "border-gray-500"
                        }`}
                      >
                        {item.status === "completed" && <Icon name="check" size={10} />}
                      </button>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    )}
                    <div>
                      <span className={`text-xs font-semibold block ${item.status === "completed" ? "line-through text-gray-500" : "text-white"}`}>
                        {item.title}
                      </span>
                      <span className="text-[10px] text-gray-400">{item.time || "All day"} · #{item.project}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <form onSubmit={handleCreateEventSubmit} className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <strong className="text-xs font-semibold">Create New Event</strong>
                <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400">
                  <Icon name="x" size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Event Title *</label>
                  <input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Date *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3.5 py-1.5 text-xs text-gray-300">
                  Cancel
                </button>
                <button type="submit" style={{ backgroundColor: "#98E499", color: "#26282a" }} className="px-4 py-1.5 rounded-xl font-bold text-xs cursor-pointer">
                  Save Event
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}