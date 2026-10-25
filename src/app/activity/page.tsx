"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceShell from "@/components/WorkspaceShell";

type ActivityCategory = "All activity" | "Tasks" | "Projects" | "Members";
type DateRangeOption = "All time" | "Today" | "Last 7 days" | "Last 30 days";

type ChangeDiff = {
  field: string;
  oldValue: string;
  newValue: string;
};

type ActivityItem = {
  id: string;
  actor: {
    name: string;
    avatarInitials: string;
    role: string;
  };
  action: string;
  targetItem: string;
  targetType: "task" | "project" | "member";
  project: string;
  projectId?: string;
  timestamp: string;
  exactTime: string;
  dateGroup: "TODAY" | "YESTERDAY" | "LAST 7 DAYS" | "EARLIER";
  rawDate: Date;
  iconType: "check" | "edit" | "plus" | "folder" | "user" | "clock" | "trash";
  changes?: ChangeDiff[];
  isDeletedTarget?: boolean;
};

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-101",
    actor: { name: "Anisa Nabila", avatarInitials: "AN", role: "Project Lead" },
    action: "completed a task",
    targetItem: "Finalize dashboard layout",
    targetType: "task",
    project: "Orbit Workspace",
    projectId: "proj-1",
    timestamp: "10:42 AM",
    exactTime: "Today at 10:42:15 AM",
    dateGroup: "TODAY",
    rawDate: new Date(),
    iconType: "check",
    changes: [
      { field: "Status", oldValue: "In Progress", newValue: "Completed / In Review" },
      { field: "Progress", oldValue: "80%", newValue: "100%" },
    ],
  },
  {
    id: "act-102",
    actor: { name: "Ahmad Rizky", avatarInitials: "AR", role: "Frontend Developer" },
    action: "updated task priority",
    targetItem: "API integration",
    targetType: "task",
    project: "Website Redesign",
    projectId: "proj-2",
    timestamp: "09:15 AM",
    exactTime: "Today at 09:15:02 AM",
    dateGroup: "TODAY",
    rawDate: new Date(),
    iconType: "edit",
    changes: [
      { field: "Priority", oldValue: "Medium", newValue: "High" },
    ],
  },
  {
    id: "act-103",
    actor: { name: "Anisa Nabila", avatarInitials: "AN", role: "Project Lead" },
    action: "created a new project",
    targetItem: "Mobile App Redesign",
    targetType: "project",
    project: "Mobile App Redesign",
    projectId: "proj-3",
    timestamp: "08:30 AM",
    exactTime: "Today at 08:30:00 AM",
    dateGroup: "TODAY",
    rawDate: new Date(),
    iconType: "folder",
  },
  {
    id: "act-104",
    actor: { name: "M. Kenzie", avatarInitials: "MK", role: "UI/UX Designer" },
    action: "updated a task deadline",
    targetItem: "Prepare project documentation",
    targetType: "task",
    project: "Orbit Workspace",
    projectId: "proj-1",
    timestamp: "Yesterday, 04:20 PM",
    exactTime: "Oct 25, 2026 at 04:20:11 PM",
    dateGroup: "YESTERDAY",
    rawDate: new Date(Date.now() - 86400000),
    iconType: "clock",
    changes: [
      { field: "Due Date", oldValue: "Oct 24, 2026", newValue: "Oct 30, 2026" },
    ],
  },
  {
    id: "act-105",
    actor: { name: "Jasmine L.", avatarInitials: "JL", role: "Backend Developer" },
    action: "joined the workspace team",
    targetItem: "Backend Developer Role",
    targetType: "member",
    project: "Orbit Workspace",
    projectId: "proj-1",
    timestamp: "Yesterday, 02:15 PM",
    exactTime: "Oct 25, 2026 at 02:15:40 PM",
    dateGroup: "YESTERDAY",
    rawDate: new Date(Date.now() - 86400000),
    iconType: "user",
  },
  {
    id: "act-106",
    actor: { name: "Ahmad Rizky", avatarInitials: "AR", role: "Frontend Developer" },
    action: "deleted a legacy task",
    targetItem: "Deprecated Auth Middleware",
    targetType: "task",
    project: "Website Redesign",
    projectId: "proj-2",
    timestamp: "Oct 23, 11:00 AM",
    exactTime: "Oct 23, 2026 at 11:00:00 AM",
    dateGroup: "LAST 7 DAYS",
    rawDate: new Date(Date.now() - 86400000 * 3),
    iconType: "trash",
    isDeletedTarget: true,
  },
  {
    id: "act-107",
    actor: { name: "M. Kenzie", avatarInitials: "MK", role: "UI/UX Designer" },
    action: "created a new task",
    targetItem: "Design System Tokens Migration",
    targetType: "task",
    project: "Orbit Workspace",
    projectId: "proj-1",
    timestamp: "Oct 22, 03:45 PM",
    exactTime: "Oct 22, 2026 at 03:45:10 PM",
    dateGroup: "LAST 7 DAYS",
    rawDate: new Date(Date.now() - 86400000 * 4),
    iconType: "plus",
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
    check: <path d="m5 12 4 4L19 6" />,
    edit: <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
        <path d="M3 10h18" />
      </>
    ),
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    ),
    arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
  };

  return <svg {...common}>{paths[name] || paths.folder}</svg>;
}

export default function ActivityPage() {
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>("All activity");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeOption>("All time");
  const [selectedActor, setSelectedActor] = useState<string>("All actors");
  const [selectedProject, setSelectedProject] = useState<string>("All projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [activeDetailItem, setActiveDetailItem] = useState<ActivityItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const filteredActivities = useMemo(() => {
    return INITIAL_ACTIVITIES.filter((act) => {
      if (selectedCategory === "Tasks" && act.targetType !== "task") return false;
      if (selectedCategory === "Projects" && act.targetType !== "project") return false;
      if (selectedCategory === "Members" && act.targetType !== "member") return false;

      if (selectedDateRange === "Today" && act.dateGroup !== "TODAY") return false;
      if (selectedDateRange === "Last 7 days" && act.dateGroup === "EARLIER") return false;
      if (selectedDateRange === "Last 30 days" && act.dateGroup === "EARLIER") return false;

      if (selectedActor !== "All actors" && act.actor.name !== selectedActor) return false;
      if (selectedProject !== "All projects" && act.project !== selectedProject) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchActor = act.actor.name.toLowerCase().includes(q);
        const matchItem = act.targetItem.toLowerCase().includes(q);
        const matchAction = act.action.toLowerCase().includes(q);
        const matchProject = act.project.toLowerCase().includes(q);
        return matchActor || matchItem || matchAction || matchProject;
      }

      return true;
    });
  }, [selectedCategory, selectedDateRange, selectedActor, selectedProject, searchQuery]);

  const displayedActivities = useMemo(() => {
    return filteredActivities.slice(0, visibleCount);
  }, [filteredActivities, visibleCount]);

  const groupedTimeline = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    displayedActivities.forEach((act) => {
      if (!groups[act.dateGroup]) {
        groups[act.dateGroup] = [];
      }
      groups[act.dateGroup].push(act);
    });
    return groups;
  }, [displayedActivities]);

  function handleExportCSV() {
    if (filteredActivities.length === 0) return;

    const headers = ["ID", "Actor", "Role", "Action", "Target Item", "Target Type", "Project", "Timestamp"];
    const rows = filteredActivities.map((a) => [
      a.id,
      `"${a.actor.name}"`,
      `"${a.actor.role}"`,
      `"${a.action}"`,
      `"${a.targetItem}"`,
      a.targetType,
      `"${a.project}"`,
      `"${a.exactTime}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orbit_activity_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleResetFilters() {
    setSelectedCategory("All activity");
    setSelectedDateRange("All time");
    setSelectedActor("All actors");
    setSelectedProject("All projects");
    setSearchQuery("");
  }

  return (
    <WorkspaceShell>
      <div className="p-6 text-white space-y-5 max-w-5xl mx-auto w-full">
        {/* Header Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[30px] font-bold tracking-tight text-white">Activity</h1>
              <span className="text-[11px] bg-[#1e2022] text-violet-400 border border-[var(--line)] px-2.5 py-0.5 rounded-full font-semibold">
                {filteredActivities.length} events
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Track what's happening across your workspace in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1.5 rounded-xl border border-[var(--line)] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                showAdvancedFilters ? "bg-violet-600 text-white" : "bg-[#1e2022] hover:bg-[#2a2d30] text-gray-300"
              }`}
            >
              <Icon name="filter" size={13} />
              <span>Filter</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-[#1e2022] hover:bg-[#2a2d30] border border-[var(--line)] text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Icon name="download" size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-[#1e2022] p-1 rounded-xl border border-[var(--line)] text-xs overflow-x-auto">
              {(["All activity", "Tasks", "Projects", "Members"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-violet-600 text-white font-semibold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Icon name="search" size={13} />
              </span>
              <input
                type="text"
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[#1e2022] pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[#1e2022] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">Date Range</label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value as DateRangeOption)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="All time">All time</option>
                  <option value="Today">Today</option>
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">Actor</label>
                <select
                  value={selectedActor}
                  onChange={(e) => setSelectedActor(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="All actors">All actors</option>
                  <option value="Anisa Nabila">Anisa Nabila</option>
                  <option value="Ahmad Rizky">Ahmad Rizky</option>
                  <option value="M. Kenzie">M. Kenzie</option>
                  <option value="Jasmine L.">Jasmine L.</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="All projects">All projects</option>
                  <option value="Orbit Workspace">Orbit Workspace</option>
                  <option value="Website Redesign">Website Redesign</option>
                  <option value="Mobile App Redesign">Mobile App Redesign</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Content */}
        {isLoading ? (
          <div className="space-y-3 pt-2 animate-pulse">
            <div className="h-3 bg-[#1e2022] rounded w-24" />
            <div className="h-14 bg-[#1e2022] rounded-xl border border-[var(--line)]" />
            <div className="h-14 bg-[#1e2022] rounded-xl border border-[var(--line)]" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center space-y-2 rounded-xl border border-[var(--line)] bg-[var(--card)] p-6">
            <strong className="block text-xs font-semibold text-white">No activity matches your filters</strong>
            <p className="text-[11px] text-gray-400">Try searching for another keyword or clear current filters.</p>
            <button
              onClick={handleResetFilters}
              className="mt-1 px-3.5 py-1.5 rounded-xl bg-[#35383a] hover:bg-[#404346] text-xs font-medium text-white transition cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-6 pt-1">
            {Object.entries(groupedTimeline).map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                    {dateLabel}
                  </span>
                  <span className="text-[10px] text-gray-500 bg-[#1e2022] px-2 py-0.5 rounded-full border border-[var(--line)]">
                    {items.length} {items.length === 1 ? "activity" : "activities"}
                  </span>
                  <div className="flex-1 h-px bg-[var(--line)]" />
                </div>

                <div className="relative pl-6 space-y-2.5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-px before:bg-[#35383a]">
                  {items.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => setActiveDetailItem(act)}
                      className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--line)] bg-[var(--card)] hover:border-violet-500/40 transition group cursor-pointer"
                    >
                      <span className="absolute -left-6 top-3.5 w-4 h-4 rounded-full bg-[#1e2022] border border-[var(--line)] flex items-center justify-center text-violet-400 group-hover:border-violet-500 transition">
                        <Icon name={act.iconType} size={10} />
                      </span>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="text-xs text-gray-200 leading-snug flex flex-wrap items-center gap-1.5">
                          <strong className="text-white font-semibold bg-[#1e2022] px-2 py-0.5 rounded-md border border-[var(--line)] text-[11px]">
                            {act.actor.name}
                          </strong>
                          <span className="text-gray-400">{act.action}</span>
                          <span className="text-violet-300 font-medium hover:underline">
                            "{act.targetItem}"
                          </span>

                          {act.isDeletedTarget && (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md font-semibold">
                              [Deleted]
                            </span>
                          )}
                        </div>

                        {act.changes && act.changes.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {act.changes.map((c, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-[#1e2022] border border-[var(--line)] px-2 py-0.5 rounded-md text-gray-300"
                              >
                                <b>{c.field}:</b> <span className="text-gray-400 line-through">{c.oldValue}</span> →{" "}
                                <span className="text-violet-300 font-medium">{c.newValue}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-0.5">
                          <span className="text-gray-300 font-medium">#{act.project}</span>
                          <span>·</span>
                          <span>{act.timestamp}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDetailItem(act);
                        }}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 self-start sm:self-center transition cursor-pointer"
                      >
                        <span>Details</span>
                        <Icon name="arrowRight" size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {visibleCount < filteredActivities.length && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                  className="px-4 py-2 rounded-xl bg-[#1e2022] hover:bg-[#2a2d30] border border-[var(--line)] text-xs font-medium text-gray-300 hover:text-white transition cursor-pointer"
                >
                  Load more activities
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Detail */}
        {activeDetailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                <strong className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                  Activity Details
                </strong>
                <button
                  onClick={() => setActiveDetailItem(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#1e2022] border border-[var(--line)] space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Actor</span>
                    <strong className="text-white">{activeDetailItem.actor.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Action</span>
                    <span className="text-violet-300 font-medium">{activeDetailItem.action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Target</span>
                    <span className="text-white font-medium">{activeDetailItem.targetItem}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project</span>
                    <span className="text-gray-300 font-medium">#{activeDetailItem.project}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time</span>
                    <span className="text-gray-300">{activeDetailItem.exactTime}</span>
                  </div>
                </div>

                {activeDetailItem.changes && activeDetailItem.changes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="block font-semibold text-gray-300 text-[11px]">Changes:</span>
                    {activeDetailItem.changes.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#1e2022]/60 border border-[var(--line)] flex justify-between items-center text-[11px]"
                      >
                        <span className="text-gray-400">{c.field}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-gray-500">{c.oldValue}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-emerald-400 font-medium">{c.newValue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[var(--line)]">
                <button
                  onClick={() => setActiveDetailItem(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-gray-300 hover:bg-[#35383a]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveDetailItem(null);
                    if (activeDetailItem.targetType === "project") {
                      router.push("/projects");
                    } else {
                      router.push("/overview");
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Open Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}