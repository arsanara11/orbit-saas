"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getInitialWorkspaceData,
  getWorkspaceActivitiesAction,
  logActivityAction,
} from "@/app/actions";

export type UserProfile = {
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  initials: string;
};

export type CalendarItem = {
  id: string;
  type: "task" | "event";
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  project?: string;
  status?: "pending" | "completed" | "overdue";
  priority?: "Low" | "Medium" | "High";
  description?: string;
  colorCategory: "lime" | "purple" | "amber" | "red";
};

export type ActivityItem = {
  id: string;
  actorName: string;
  actorAvatar: string;
  action: string;
  targetItem: string;
  project: string;
  timestamp: string;
  exactTime?: string;
  rawTimestamp?: string;
  dateGroup: "TODAY" | "YESTERDAY";
  iconType: "check" | "edit" | "folder";
};

type WorkspaceContextType = {
  workspaceId: string;
  workspaceName: string;
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaceData: () => Promise<void>;
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  calendarItems: CalendarItem[];
  addCalendarItem: (item: Omit<CalendarItem, "id">) => void;
  toggleTaskStatus: (id: string) => void;
  activities: ActivityItem[];
  logActivity: (action: string, targetItem: string, project?: string) => void;
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Workspace Member",
  email: "",
  bio: "Project Lead & Product Strategist at Orbit Workspace.",
  avatarUrl: null,
  initials: "WM",
};

const DEFAULT_CALENDAR: CalendarItem[] = [
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
  },
  {
    id: "item-2",
    type: "event",
    title: "Review API integration",
    date: "2026-10-28",
    time: "02:00 PM",
    project: "Website Redesign",
    colorCategory: "purple",
  },
];

function getInitials(name?: string) {
  if (!name) return "WM";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function mapIconType(action: string): "check" | "edit" | "folder" {
  const lower = action.toLowerCase();
  if (lower.includes("complete") || lower.includes("done")) return "check";
  if (lower.includes("project") || lower.includes("workspace")) return "folder";
  return "edit";
}

function mapDateGroup(date: Date): "TODAY" | "YESTERDAY" {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 0 ? "TODAY" : "YESTERDAY";
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("Orbit Workspace");
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>(DEFAULT_CALENDAR);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshWorkspaceData = useCallback(async (overrideWorkspaceId?: string) => {
    try {
      const savedWsId =
        overrideWorkspaceId ||
        workspaceId ||
        (typeof window !== "undefined" ? localStorage.getItem("orbit_active_workspace_id") || undefined : undefined);

      const res = await getInitialWorkspaceData(savedWsId);
      if (!res?.workspace) return;

      const activeWsId = res.workspace.id;
      const activeWsName = res.workspace.name || "Orbit Workspace";

      setWorkspaceId(activeWsId);
      setWorkspaceName(activeWsName);
      if (typeof window !== "undefined") {
        localStorage.setItem("orbit_active_workspace_id", activeWsId);
      }

      if (res.user) {
        setProfile((prev) => ({
          ...prev,
          name: res.user.name || prev.name,
          email: res.user.email || prev.email,
          avatarUrl: res.user.image || prev.avatarUrl,
          initials: getInitials(res.user.name || prev.name),
        }));
      }

      let rawActs = res.workspace.activities || [];
      try {
        const latestActs = await getWorkspaceActivitiesAction(activeWsId);
        if (latestActs) {
          rawActs = latestActs;
        }
      } catch {
        // Fallback ke res.workspace.activities jika gagal
      }

      const mappedActs: ActivityItem[] = rawActs.map((act: any) => {
        const created = new Date(act.createdAt);
        const actorName = act.user?.name || res.user?.name || "Workspace Member";
        return {
          id: act.id,
          actorName,
          actorAvatar: getInitials(actorName),
          action: act.action,
          targetItem: act.targetItem || act.target || "item",
          project: act.project || activeWsName,
          timestamp: created.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          exactTime: created.toLocaleString([], { dateStyle: "medium", timeStyle: "medium" }),
          rawTimestamp: created.toISOString(),
          dateGroup: mapDateGroup(created),
          iconType: mapIconType(act.action || ""),
        };
      });

      setActivities(mappedActs);
    } catch {
      // Abaikan jika user belum login (misal sedang di halaman /login)
    }
  }, [workspaceId]);

  useEffect(() => {
    try {
      const savedCalendar = localStorage.getItem("orbit_calendar");
      if (savedCalendar) setCalendarItems(JSON.parse(savedCalendar));
    } catch (e) {
      console.error("Gagal membaca calendar dari localStorage", e);
    }

    refreshWorkspaceData().finally(() => {
      setIsInitialized(true);
    });
  }, [refreshWorkspaceData]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("orbit_calendar", JSON.stringify(calendarItems));
  }, [calendarItems, isInitialized]);

  const setActiveWorkspaceId = (id: string) => {
    setWorkspaceId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("orbit_active_workspace_id", id);
    }
    refreshWorkspaceData(id);
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      if (newProfile.name) {
        updated.initials = getInitials(newProfile.name);
      }
      return updated;
    });

    logActivity("updated profile information", newProfile.name || "User Profile", workspaceName);
  };

  const addCalendarItem = (item: Omit<CalendarItem, "id">) => {
    const newItem: CalendarItem = { ...item, id: `item-${Date.now()}` };
    setCalendarItems((prev) => [...prev, newItem]);
    logActivity(`created new ${item.type}`, item.title, item.project || workspaceName);
  };

  const toggleTaskStatus = (id: string) => {
    setCalendarItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
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

  const logActivity = (action: string, targetItem: string, project = workspaceName) => {
    const now = new Date();
    const tempAct: ActivityItem = {
      id: `act-${Date.now()}`,
      actorName: profile.name,
      actorAvatar: profile.initials,
      action,
      targetItem,
      project,
      timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      exactTime: now.toLocaleString([], { dateStyle: "medium", timeStyle: "medium" }),
      rawTimestamp: now.toISOString(),
      dateGroup: "TODAY",
      iconType: mapIconType(action),
    };
    setActivities((prev) => [tempAct, ...prev]);

    if (workspaceId) {
      logActivityAction({
        workspaceId,
        action,
        targetItem,
        project,
      })
        .then(() => refreshWorkspaceData(workspaceId))
        .catch((err) => console.error("Gagal menyimpan activity ke DB:", err));
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceId,
        workspaceName,
        setActiveWorkspaceId,
        refreshWorkspaceData: () => refreshWorkspaceData(),
        profile,
        updateProfile,
        calendarItems,
        addCalendarItem,
        toggleTaskStatus,
        activities,
        logActivity,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace harus digunakan di dalam WorkspaceProvider");
  }
  return context;
}